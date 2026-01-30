import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { createSignalingMessage, subscribeToSignaling, deleteSignalingMessage } from '../services/webrtcService';
import Avatar from './Avatar';
import './CallModal.css';

const CallModal = ({ isOpen, onClose, callType, otherUserId, otherUserName, otherUserImage, conversationId, isIncoming = false }) => {
    const { user } = useAuth();
    console.log('🎬 [CallModal] Component render', { isOpen, isIncoming, callType, otherUserId, userId: user?.id });
    const [callStatus, setCallStatus] = useState(() => {
        const initial = isIncoming ? 'ringing' : 'calling';
        console.log('📊 [CallModal] Initial callStatus:', initial);
        return initial;
    }); // 'calling', 'ringing', 'connected', 'ended'
    
    // Keep ref in sync with state
    useEffect(() => {
        callStatusRef.current = callStatus;
    }, [callStatus]);
    const [isLocalMuted, setIsLocalMuted] = useState(false);
    const [isLocalVideoOff, setIsLocalVideoOff] = useState(callType === 'voice');
    const [isRemoteMuted, setIsRemoteMuted] = useState(false);
    const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const signalingUnsubscribeRef = useRef(null);
    const initializedRef = useRef(false);
    const pendingOfferRef = useRef(null);
    const handleSignalingMessageRef = useRef(null);
    const callStatusRef = useRef(callStatus);

    const cleanup = () => {
        console.log('🧹 [CallModal] Starting cleanup');
        
        // Unsubscribe from signaling FIRST to prevent new messages
        if (signalingUnsubscribeRef.current) {
            try {
                console.log('📡 [CallModal] Unsubscribing from signaling');
                signalingUnsubscribeRef.current();
            } catch (err) {
                console.warn('⚠️ [CallModal] Error unsubscribing:', err);
            }
            signalingUnsubscribeRef.current = null;
        }
        
        // Close peer connection
        if (peerConnectionRef.current) {
            try {
                console.log('🔌 [CallModal] Closing peer connection');
                // Remove all event listeners
                peerConnectionRef.current.onicecandidate = null;
                peerConnectionRef.current.ontrack = null;
                peerConnectionRef.current.onconnectionstatechange = null;
                peerConnectionRef.current.close();
            } catch (err) {
                console.warn('⚠️ [CallModal] Error closing peer connection:', err);
            }
            peerConnectionRef.current = null;
        }
        
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 [CallModal] Stopped local track:', track.kind);
            });
            localStreamRef.current = null;
        }
        
        // Stop remote stream
        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 [CallModal] Stopped remote track:', track.kind);
            });
            remoteStreamRef.current = null;
        }

        // Clear video refs
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        
        // Reset initialization flag
        initializedRef.current = false;
        console.log('✅ [CallModal] Cleanup complete');
    };

    // Initialize call only once when modal opens
    useEffect(() => {
        console.log('🔧 [CallModal] Init effect, isOpen:', isOpen, 'user?.id:', user?.id, 'isIncoming:', isIncoming, 'initialized:', initializedRef.current);
        
        if (!isOpen || !user?.id) {
            if (initializedRef.current && !isOpen) {
                // Modal just closed
                console.log('🔄 [CallModal] Modal closed, cleaning up');
                cleanup();
            }
            return;
        }
        
        if (!initializedRef.current) {
            console.log('🚀 [CallModal] Initializing call, isIncoming:', isIncoming);
            initializedRef.current = true;
            if (isIncoming) {
                // For incoming calls, wait for user to accept
                // Setup will be done in setupIncomingCall which is defined later
                setupIncomingCall().catch(err => console.error('Error in setupIncomingCall:', err));
            } else {
                // For outgoing calls, initialize immediately
                initializeCall().catch(err => console.error('Error in initializeCall:', err));
            }
        }
        
        // Cleanup on unmount or when modal closes
        return () => {
            if (!isOpen && initializedRef.current) {
                console.log('🔄 [CallModal] Cleanup on unmount/close');
                cleanup();
            }
        };
    }, [isOpen, user?.id, isIncoming]);

    const setupIncomingCall = async () => {
        try {
            console.log('📡 [CallModal] Setting up incoming call listener');
            // Subscribe to signaling for incoming call
            if (signalingUnsubscribeRef.current) {
                // Cleanup existing subscription first
                console.log('🧹 [CallModal] Cleaning up existing subscription');
                signalingUnsubscribeRef.current();
            }
            // Use ref to access handleSignalingMessage
            signalingUnsubscribeRef.current = subscribeToSignaling(user.id, (message) => {
                if (handleSignalingMessageRef.current) {
                    handleSignalingMessageRef.current(message);
                }
            });
            console.log('✅ [CallModal] Incoming call listener set up');
        } catch (error) {
            console.error('❌ [CallModal] Error setting up incoming call:', error);
        }
    };

    const acceptCall = async () => {
        try {
            console.log('✅ [CallModal] Accepting call');
            // Don't change status yet, wait for answer to be sent and connection established
            // Status will be updated when answer is sent or remote track is received
            
            // Get user media
            const constraints = {
                audio: true,
                video: callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Create peer connection
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            };

            const pc = new RTCPeerConnection(configuration);
            peerConnectionRef.current = pc;

            // Add local stream tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                console.log('📹 [CallModal] Received remote track');
                remoteStreamRef.current = event.streams[0];
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setCallStatus('connected');
            };

            // Handle ICE candidates
            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    console.log('🧊 [CallModal] Sending ICE candidate');
                    await createSignalingMessage(
                        user.id,
                        otherUserId,
                        'ice-candidate',
                        { candidate: event.candidate }
                    );
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('🔌 [CallModal] Connection state:', pc.connectionState);
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    setCallStatus('ended');
                }
            };

            // Subscribe to signaling messages
            if (signalingUnsubscribeRef.current) {
                signalingUnsubscribeRef.current();
            }
            signalingUnsubscribeRef.current = subscribeToSignaling(user.id, (message) => {
                if (handleSignalingMessageRef.current) {
                    handleSignalingMessageRef.current(message);
                }
            });

            // Fetch and process pending offer if exists
            try {
                const { getSignalingMessages } = await import('../services/webrtcService');
                const messages = await getSignalingMessages(user.id);
                const offerMessage = messages.find(m => 
                    m.type === 'offer' && 
                    m.sender_id === otherUserId &&
                    m.receiver_id === user.id
                );
                
                if (offerMessage) {
                    console.log('📥 [CallModal] Found pending offer, processing...');
                    pendingOfferRef.current = offerMessage;
                    await handleSignalingMessage(offerMessage);
                } else {
                    console.log('✅ [CallModal] Call accepted, waiting for offer');
                }
            } catch (error) {
                console.warn('⚠️ [CallModal] Could not fetch pending offers:', error);
                console.log('✅ [CallModal] Call accepted, waiting for offer via subscription');
            }
        } catch (error) {
            console.error('❌ [CallModal] Error accepting call:', error);
            alert('Không thể chấp nhận cuộc gọi. Vui lòng kiểm tra quyền truy cập microphone/camera.');
            onClose();
        }
    };

    const initializeCall = async () => {
        console.log('🚀 [CallModal] initializeCall called', { callType, otherUserId, user: user?.id });
        try {
            // Get user media
            const constraints = {
                audio: true,
                video: callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Create peer connection
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            };

            const pc = new RTCPeerConnection(configuration);
            peerConnectionRef.current = pc;

            // Add local stream tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                console.log('📹 [CallModal] Received remote track');
                remoteStreamRef.current = event.streams[0];
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                // Only update status if not already connected
                setCallStatus(prev => {
                    if (prev !== 'connected' && prev !== 'ended') {
                        console.log('✅ [CallModal] Call connected (remote track received)');
                        return 'connected';
                    }
                    return prev;
                });
            };

            // Handle ICE candidates
            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    console.log('🧊 Sending ICE candidate');
                    await createSignalingMessage(
                        user.id,
                        otherUserId,
                        'ice-candidate',
                        { candidate: event.candidate }
                    );
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('🔌 [CallModal] Connection state:', pc.connectionState);
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    setCallStatus(prev => {
                        if (prev !== 'ended') {
                            console.log('❌ [CallModal] Connection failed/disconnected');
                            return 'ended';
                        }
                        return prev;
                    });
                }
            };

            // Subscribe to signaling messages
            signalingUnsubscribeRef.current = subscribeToSignaling(user.id, (message) => {
                if (handleSignalingMessageRef.current) {
                    handleSignalingMessageRef.current(message);
                }
            });

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            console.log('📤 [CallModal] Sending offer to:', otherUserId);
            console.log('📤 [CallModal] Offer SDP:', offer.sdp?.substring(0, 100));
            
            const offerData = {
                offer: {
                    type: offer.type,
                    sdp: offer.sdp
                }
            };
            
            console.log('📤 [CallModal] About to send offer via createSignalingMessage', {
                senderId: user.id,
                receiverId: otherUserId,
                offerType: offer.type,
                offerSdpLength: offer.sdp?.length
            });
            
            const result = await createSignalingMessage(
                user.id,
                otherUserId,
                'offer',
                offerData
            );
            
            console.log('✅ [CallModal] Offer sent successfully:', result);

            // Only set to ringing if not already connected or ended
            setCallStatus(prev => {
                if (prev !== 'connected' && prev !== 'ringing' && prev !== 'ended') {
                    console.log('📞 [CallModal] Call status set to ringing (offer sent)');
                    return 'ringing';
                }
                return prev;
            });
        } catch (error) {
            console.error('❌ Error initializing call:', error);
            alert('Không thể khởi tạo cuộc gọi. Vui lòng kiểm tra quyền truy cập microphone/camera.');
            onClose();
        }
    };

    const handleSignalingMessage = useCallback(async (message) => {
        console.log('📨 [CallModal] Received signaling message:', {
            type: message.type,
            sender_id: message.sender_id,
            otherUserId: otherUserId,
            matches: message.sender_id === otherUserId,
            callStatus: callStatusRef.current
        });
        
        if (message.sender_id !== otherUserId) {
            console.log('⚠️ [CallModal] Message sender does not match, ignoring');
            return;
        }

        // Handle hangup message
        if (message.type === 'hangup') {
            console.log('📞 [CallModal] Received hangup signal');
            setCallStatus('ended');
            cleanup();
            setTimeout(() => {
                onClose();
            }, 500);
            await deleteSignalingMessage(message.id);
            return;
        }

        const pc = peerConnectionRef.current;
        if (!pc && message.type !== 'offer') {
            console.log('⚠️ [CallModal] No peer connection and message is not offer, ignoring');
            return;
        }

        try {
            if (message.type === 'offer') {
                // We received an offer (incoming call)
                console.log('📥 [CallModal] Received offer, isIncoming:', isIncoming, 'callStatus:', callStatusRef.current);
                
                // For incoming calls, we need peer connection to exist (created in acceptCall)
                if (isIncoming && !peerConnectionRef.current) {
                    console.log('⚠️ [CallModal] Call not accepted yet, storing offer for later');
                    // Store offer to process after accept
                    pendingOfferRef.current = message;
                    return;
                }
                
                if (!peerConnectionRef.current) {
                    // Create peer connection if not exists
                    const configuration = {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' }
                        ]
                    };
                    const pc = new RTCPeerConnection(configuration);
                    peerConnectionRef.current = pc;

                    // Get user media
                    const constraints = {
                        audio: true,
                        video: callType === 'video' ? {
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        } : false
                    };

                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    localStreamRef.current = stream;
                    
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }

                    // Add local stream tracks
                    stream.getTracks().forEach(track => {
                        pc.addTrack(track, stream);
                    });

                    // Handle remote stream
                    pc.ontrack = (event) => {
                        console.log('📹 [CallModal] Received remote track');
                        remoteStreamRef.current = event.streams[0];
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = event.streams[0];
                        }
                        // Only update status if not already connected
                        setCallStatus(prev => {
                            if (prev !== 'connected' && prev !== 'ended') {
                                console.log('✅ [CallModal] Call connected (remote track received)');
                                return 'connected';
                            }
                            return prev;
                        });
                    };

                    // Handle ICE candidates
                    pc.onicecandidate = async (event) => {
                        if (event.candidate) {
                            console.log('🧊 Sending ICE candidate');
                            await createSignalingMessage(
                                user.id,
                                otherUserId,
                                'ice-candidate',
                                { candidate: event.candidate }
                            );
                        }
                    };

                    // Handle connection state changes
                    pc.onconnectionstatechange = () => {
                        console.log('🔌 [CallModal] Connection state:', pc.connectionState);
                        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                            setCallStatus(prev => {
                                if (prev !== 'ended') {
                                    console.log('❌ [CallModal] Connection failed/disconnected');
                                    return 'ended';
                                }
                                return prev;
                            });
                        }
                    };
                }

                const pc = peerConnectionRef.current;
                
                // Parse offer data correctly
                let offerData = message.data;
                if (typeof offerData === 'string') {
                    try {
                        offerData = JSON.parse(offerData);
                    } catch (e) {
                        console.error('❌ [CallModal] Failed to parse offer data:', e);
                        return;
                    }
                }
                
                const offer = offerData?.offer || offerData;
                if (!offer || !offer.sdp) {
                    console.error('❌ [CallModal] Invalid offer format:', offerData);
                    return;
                }
                
                console.log('📥 [CallModal] Setting remote description with offer');
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                console.log('📤 [CallModal] Sending answer to:', otherUserId);
                const answerData = {
                    answer: {
                        type: answer.type,
                        sdp: answer.sdp
                    }
                };
                
                await createSignalingMessage(
                    user.id,
                    otherUserId,
                    'answer',
                    answerData
                );
                console.log('✅ [CallModal] Answer sent successfully');

                // Only update to connected if not already connected
                setCallStatus(prev => {
                    if (prev !== 'connected' && prev !== 'ended') {
                        console.log('✅ [CallModal] Call status updated to connected (answer sent)');
                        return 'connected';
                    }
                    return prev;
                });
            } else if (message.type === 'answer') {
                // We received an answer
                console.log('📥 [CallModal] Received answer');
                
                // Parse answer data correctly
                let answerData = message.data;
                if (typeof answerData === 'string') {
                    try {
                        answerData = JSON.parse(answerData);
                    } catch (e) {
                        console.error('❌ [CallModal] Failed to parse answer data:', e);
                        return;
                    }
                }
                
                const answer = answerData?.answer || answerData;
                if (!answer || !answer.sdp) {
                    console.error('❌ [CallModal] Invalid answer format:', answerData);
                    return;
                }
                
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('✅ [CallModal] Remote description set with answer');
            } else if (message.type === 'ice-candidate') {
                // We received an ICE candidate
                console.log('📥 [CallModal] Received ICE candidate');
                
                // Parse candidate data correctly
                let candidateData = message.data;
                if (typeof candidateData === 'string') {
                    try {
                        candidateData = JSON.parse(candidateData);
                    } catch (e) {
                        console.error('❌ [CallModal] Failed to parse candidate data:', e);
                        return;
                    }
                }
                
                const candidate = candidateData?.candidate || candidateData;
                if (candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('✅ [CallModal] ICE candidate added');
                }
            }

            // Delete processed message
            await deleteSignalingMessage(message.id);
        } catch (error) {
            console.error('❌ [CallModal] Error handling signaling message:', error);
        }
    }, [otherUserId, callType, user?.id, onClose, isIncoming]);

    // Update ref when handleSignalingMessage changes
    useEffect(() => {
        handleSignalingMessageRef.current = handleSignalingMessage;
    }, [handleSignalingMessage]);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = isLocalMuted;
            });
            setIsLocalMuted(!isLocalMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = isLocalVideoOff;
            });
            setIsLocalVideoOff(!isLocalVideoOff);
        }
    };

    const endCall = async () => {
        console.log('📞 [CallModal] End call clicked, current status:', callStatus);
        console.log('📞 [CallModal] isOpen:', isOpen, 'user:', user?.id, 'otherUserId:', otherUserId);
        
        // Prevent multiple calls
        if (callStatus === 'ended') {
            console.log('⚠️ [CallModal] Call already ended, ignoring');
            return;
        }
        
        try {
            // Send hangup signal to notify the other party
            if (user?.id && otherUserId) {
                try {
                    await createSignalingMessage(
                        user.id,
                        otherUserId,
                        'hangup',
                        { reason: 'user-ended' }
                    );
                    console.log('✅ [CallModal] Hangup signal sent');
                } catch (err) {
                    console.warn('⚠️ [CallModal] Could not send hangup signal:', err);
                }
            }
        } catch (error) {
            console.error('❌ [CallModal] Error ending call:', error);
        }
        
        // Always cleanup and close, regardless of errors
        console.log('🧹 [CallModal] Starting cleanup');
        setCallStatus('ended');
        cleanup();
        
        // Close after cleanup completes - use longer timeout to ensure cleanup finishes
        setTimeout(() => {
            console.log('🚪 [CallModal] Closing modal');
            onClose();
        }, 300);
    };


    // Reset state only when modal first opens - avoid resetting callStatus unnecessarily
    const hasResetStateRef = useRef(false);
    const prevIsOpenRef = useRef(isOpen);
    
    useEffect(() => {
        // Only reset when modal transitions from closed to open
        if (isOpen && !prevIsOpenRef.current && !hasResetStateRef.current) {
            console.log('🔄 [CallModal] Modal opened, resetting state');
            const initialStatus = isIncoming ? 'ringing' : 'calling';
            console.log('📊 [CallModal] Setting initial status to:', initialStatus);
            setCallStatus(initialStatus);
            setIsLocalMuted(false);
            setIsLocalVideoOff(callType === 'voice');
            setIsRemoteMuted(false);
            setIsRemoteVideoOff(false);
            hasResetStateRef.current = true;
        } else if (!isOpen && prevIsOpenRef.current) {
            // Modal just closed
            console.log('🔄 [CallModal] Modal closed, resetting flag');
            hasResetStateRef.current = false;
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, isIncoming, callType]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="call-modal-overlay">
            <div className="call-modal">
                {/* Header */}
                <div className="call-header">
                    <div className="call-user-info">
                        <Avatar 
                            src={otherUserImage} 
                            name={otherUserName || 'Người dùng'} 
                            size={60}
                        />
                        <div className="call-user-details">
                            <h3 className="call-user-name">{otherUserName || 'Người dùng'}</h3>
                            <p className="call-status-text">
                                {callStatus === 'calling' && 'Đang gọi...'}
                                {callStatus === 'ringing' && 'Đang đổ chuông...'}
                                {callStatus === 'connected' && (callType === 'video' ? 'Đang gọi video' : 'Đang gọi')}
                                {callStatus === 'ended' && 'Cuộc gọi đã kết thúc'}
                                {!['calling', 'ringing', 'connected', 'ended'].includes(callStatus) && 'Đang kết nối...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Video Area */}
                {callType === 'video' && (
                    <div className="call-video-container">
                        {/* Remote Video */}
                        <div className="call-remote-video">
                            {isRemoteVideoOff ? (
                                <div className="call-video-placeholder">
                                    <Avatar 
                                        src={otherUserImage} 
                                        name={otherUserName || 'Người dùng'} 
                                        size={120}
                                    />
                                    <p>{otherUserName || 'Người dùng'}</p>
                                </div>
                            ) : (
                                <video 
                                    ref={remoteVideoRef} 
                                    autoPlay 
                                    playsInline
                                    className="call-video"
                                />
                            )}
                        </div>

                        {/* Local Video */}
                        <div className="call-local-video">
                            {isLocalVideoOff ? (
                                <div className="call-video-placeholder-small">
                                    <Avatar 
                                        src={user?.image} 
                                        name={user?.name || 'Bạn'} 
                                        size={40}
                                    />
                                </div>
                            ) : (
                                <video 
                                    ref={localVideoRef} 
                                    autoPlay 
                                    playsInline
                                    muted
                                    className="call-video-small"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Voice Call View */}
                {callType === 'voice' && (
                    <div className="call-voice-container">
                        <div className="call-voice-avatar">
                            <Avatar 
                                src={otherUserImage} 
                                name={otherUserName || 'Người dùng'} 
                                size={150}
                            />
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="call-controls">
                    {callStatus === 'ringing' && isIncoming ? (
                        <>
                            <button 
                                className="call-control-btn accept-call"
                                onClick={acceptCall}
                                title="Chấp nhận"
                            >
                                ✓
                            </button>
                            <button 
                                className="call-control-btn end-call"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🔴 Reject call button clicked');
                                    endCall();
                                }}
                                title="Từ chối"
                                type="button"
                            >
                                ✕
                            </button>
                        </>
                    ) : (
                        <>
                            {callType === 'video' && callStatus === 'connected' && (
                                <button 
                                    className={`call-control-btn ${isLocalVideoOff ? 'off' : ''}`}
                                    onClick={toggleVideo}
                                    title={isLocalVideoOff ? 'Bật camera' : 'Tắt camera'}
                                >
                                    {isLocalVideoOff ? '📷' : '📹'}
                                </button>
                            )}
                            {callStatus === 'connected' && (
                                <button 
                                    className={`call-control-btn ${isLocalMuted ? 'muted' : ''}`}
                                    onClick={toggleMute}
                                    title={isLocalMuted ? 'Bật mic' : 'Tắt mic'}
                                >
                                    {isLocalMuted ? '🔇' : '🎤'}
                                </button>
                            )}
                            <button 
                                className="call-control-btn end-call"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🔴 End call button clicked');
                                    endCall();
                                }}
                                title={callStatus === 'ringing' ? 'Hủy cuộc gọi' : 'Kết thúc cuộc gọi'}
                                type="button"
                            >
                                📞
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;


