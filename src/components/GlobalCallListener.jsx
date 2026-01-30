import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToSignaling } from '../services/webrtcService';
import CallModal from './CallModal';

const GlobalCallListener = () => {
    const { user } = useAuth();
    const [incomingCall, setIncomingCall] = useState(null);
    const [showCallModal, setShowCallModal] = useState(false);
    const [callType, setCallType] = useState(null);
    const [otherUserInfo, setOtherUserInfo] = useState(null);
    const signalingUnsubscribeRef = useRef(null);
    const processingOfferRef = useRef(false);

    useEffect(() => {
        if (!user?.id) {
            console.log('⚠️ [GlobalCallListener] No user ID, skipping setup');
            return;
        }

        console.log('🌐 [GlobalCallListener] Setting up global incoming call listener for user:', user.id);

        // Cleanup previous subscription if exists
        if (signalingUnsubscribeRef.current) {
            console.log('🧹 [GlobalCallListener] Cleaning up previous subscription');
            signalingUnsubscribeRef.current();
            signalingUnsubscribeRef.current = null;
        }

        const unsubscribe = subscribeToSignaling(user.id, async (message) => {
            console.log('🌐 [GlobalCallListener] ====== SIGNALING MESSAGE RECEIVED ======');
            console.log('🌐 [GlobalCallListener] Message details:', {
                id: message.id,
                type: message.type,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                created_at: message.created_at,
                dataType: typeof message.data,
                dataPreview: typeof message.data === 'string' ? message.data.substring(0, 100) : JSON.stringify(message.data).substring(0, 100)
            });

            if (message.type === 'offer') {
                console.log('🌐 [GlobalCallListener] Incoming call offer from:', message.sender_id);
                
                // Prevent duplicate processing
                if (processingOfferRef.current) {
                    console.log('⚠️ [GlobalCallListener] Already processing an offer, ignoring');
                    return;
                }
                
                // Prevent duplicate call modals
                if (showCallModal) {
                    console.log('⚠️ [GlobalCallListener] Call modal already open, ignoring duplicate offer');
                    return;
                }
                
                processingOfferRef.current = true;

                // Try to get user info
                try {
                    const response = await fetch(
                        `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/users?id=eq.${message.sender_id}&select=id,name,image`,
                        {
                            headers: {
                                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY',
                                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY'
                            }
                        }
                    );
                    const users = await response.json();
                    const senderUser = users?.[0];

                    // Determine call type from offer data
                    let offerData;
                    try {
                        offerData = typeof message.data === 'string' 
                            ? JSON.parse(message.data) 
                            : message.data;
                        console.log('🌐 [GlobalCallListener] Parsed offer data:', offerData);
                    } catch (e) {
                        console.error('❌ [GlobalCallListener] Failed to parse offer data:', e, message.data);
                        return;
                    }
                    
                    const sdp = offerData?.offer?.sdp || offerData?.sdp || '';
                    const hasVideo = sdp.includes('m=video') || sdp.includes('video');

                    console.log('🌐 [GlobalCallListener] Opening call modal, type:', hasVideo ? 'video' : 'voice', 'SDP preview:', sdp.substring(0, 100));

                    setOtherUserInfo({
                        userId: message.sender_id,
                        userName: senderUser?.name || 'Người dùng',
                        userImage: senderUser?.image
                    });
                    setCallType(hasVideo ? 'video' : 'voice');
                    setIncomingCall({
                        senderId: message.sender_id,
                        messageId: message.id
                    });
                    setShowCallModal(true);
                    processingOfferRef.current = false;

                    // Play notification sound (optional)
                    try {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzGH0fPTgjMGHm7A7+OZURAJR6Hh8sBrIgYwgM/z2IU1BhtsvO3mnlEQCE2k4fG9bCEGMYfR89OCMwYebsDv45lREAlHouHywGsiBjCAz/PYhTUGG2y87eaeURAITaTh8b1sIQYxh9Hz04IzBh5uwO/jmVEQCUei4fLAayIGMIDP89iFNQYbbLzt5p5REAhNpOHxvWwhBjGH0fPTgjMGHm7A7+OZURA=');
                        audio.volume = 0.5;
                        audio.play().catch(e => console.warn('Could not play notification sound:', e));
                    } catch (e) {
                        console.warn('Could not create notification sound:', e);
                    }
                } catch (error) {
                    console.error('❌ [GlobalCallListener] Error getting user info:', error);
                    processingOfferRef.current = false;
                }
            } else if (message.type === 'hangup') {
                console.log('🌐 [GlobalCallListener] Received hangup signal');
                // Reset all state
                setShowCallModal(false);
                setCallType(null);
                setIncomingCall(null);
                setOtherUserInfo(null);
                processingOfferRef.current = false;
            }
        });

        signalingUnsubscribeRef.current = unsubscribe;

        return () => {
            console.log('🧹 [GlobalCallListener] Cleaning up on unmount');
            if (signalingUnsubscribeRef.current) {
                signalingUnsubscribeRef.current();
                signalingUnsubscribeRef.current = null;
            }
        };
    }, [user?.id]);

    // Reset processing flag when modal closes
    useEffect(() => {
        if (!showCallModal) {
            processingOfferRef.current = false;
            console.log('🔄 [GlobalCallListener] Modal closed, reset processing flag');
        }
    }, [showCallModal]);

    if (!showCallModal || !callType || !otherUserInfo) return null;

    return (
        <CallModal
            key={`call-${otherUserInfo.userId}`}
            isOpen={showCallModal}
            onClose={() => {
                console.log('🚪 [GlobalCallListener] CallModal closed, resetting state');
                setShowCallModal(false);
                setCallType(null);
                setIncomingCall(null);
                setOtherUserInfo(null);
                processingOfferRef.current = false;
            }}
            callType={callType}
            otherUserId={otherUserInfo.userId}
            otherUserName={otherUserInfo.userName}
            otherUserImage={otherUserInfo.userImage}
            conversationId={null}
            isIncoming={true}
        />
    );
};

export default GlobalCallListener;

