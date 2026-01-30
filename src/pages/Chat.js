import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import GroupAvatar from '../components/GroupAvatar';
import CallModal from '../components/CallModal';
import { useAuth } from '../context/AuthContext';
import { getConversationById, getMessages, markConversationAsRead, sendMessage } from '../services/chatService';
import { subscribeToSignaling } from '../services/webrtcService';
import './Chat.css';

const Chat = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);
    const [callType, setCallType] = useState(null); // 'voice' or 'video'
    const [incomingCall, setIncomingCall] = useState(null);
    const messagesEndRef = useRef(null);
    const signalingUnsubscribeRef = useRef(null);

    useEffect(() => {
        if (id && user) {
            loadConversation();
            loadMessages();
            setupPolling();
            setupIncomingCallListener();
        }
        
        // Cleanup on unmount
        return () => {
            if (signalingUnsubscribeRef.current) {
                signalingUnsubscribeRef.current();
                signalingUnsubscribeRef.current = null;
            }
        };
    }, [id, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversation = async () => {
        try {
            const result = await getConversationById(id);
            if (result.success) {
                setConversation(result.data);
            } else {
                console.error('❌ Failed to load conversation:', result.msg);
            }
        } catch (error) {
            console.error('❌ Error loading conversation:', error);
        }
    };

    const loadMessages = async () => {
        try {
            console.log('💬 Loading messages for conversation:', id);
            const result = await getMessages(id);
            console.log('📨 Messages result:', result);
            if (result.success) {
                setMessages(result.data);
                console.log('✅ Messages loaded:', result.data.length, 'messages');
                // Đánh dấu đã đọc
                await markConversationAsRead(id, user.id);
            } else {
                console.error('❌ Failed to load messages:', result.msg);
            }
        } catch (error) {
            console.error('❌ Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupPolling = () => {
        // Polling thay vì real-time subscription
        const pollInterval = setInterval(() => {
            loadMessages();
        }, 3000); // Poll mỗi 3 giây cho messages

        return () => {
            clearInterval(pollInterval);
        };
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const result = await sendMessage({
                conversation_id: id,
                sender_id: user.id,
                content: newMessage.trim(),
                message_type: 'text'
            });

            if (result.success) {
                setNewMessage('');
                // Tin nhắn sẽ được thêm qua realtime subscription
            } else {
                alert(result.msg);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Không thể gửi tin nhắn');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getConversationName = () => {
        if (!conversation) return 'Chat';

        if (conversation.type === 'group') {
            return conversation.name || 'Nhóm chat';
        }

        const otherMember = conversation.conversation_members?.find(
            member => member.user_id !== user.id
        );
        return otherMember?.user?.name || 'Người dùng';
    };

    const getConversationAvatar = () => {
        if (!conversation) return <Avatar src={undefined} name="Chat" size={40} />;

        if (conversation.type === 'group') {
            return <GroupAvatar members={conversation.conversation_members || []} size={40} />;
        }

        const otherMember = conversation.conversation_members?.find(
            member => member.user_id !== user.id
        );

        return (
            <Avatar
                src={otherMember?.user?.image}
                name={otherMember?.user?.name || 'User'}
                size={40}
            />
        );
    };

    const getOtherUser = () => {
        if (!conversation || conversation.type === 'group') return null;
        return conversation.conversation_members?.find(
            member => member.user_id !== user.id
        );
    };

    const setupIncomingCallListener = () => {
        if (!user?.id) return null;

        console.log('📞 [Chat] Setting up incoming call listener for user:', user.id);
        
        const unsubscribe = subscribeToSignaling(user.id, (message) => {
            console.log('📨 [Chat] Received signaling message:', message);
            
            if (message.type === 'offer') {
                console.log('📞 [Chat] Incoming call offer received from:', message.sender_id);
                
                // Check if this is for current conversation
                // Use setConversation to access latest state
                setConversation(currentConversation => {
                    if (!currentConversation || currentConversation.type === 'group') {
                        console.log('⚠️ [Chat] No conversation or group chat, ignoring call');
                        return currentConversation;
                    }
                    
                    const otherUser = currentConversation.conversation_members?.find(
                        member => member.user_id !== user.id
                    );
                    
                    console.log('👤 [Chat] Other user in conversation:', otherUser?.user_id);
                    
                    if (otherUser && message.sender_id === otherUser.user_id) {
                        console.log('✅ [Chat] Incoming call matches current conversation');
                        // Determine call type from offer data
                        const offerData = typeof message.data === 'string' 
                            ? JSON.parse(message.data) 
                            : message.data;
                        const hasVideo = offerData?.offer?.sdp?.includes('video') || 
                                       offerData?.offer?.sdp?.includes('m=video');
                        
                        console.log('📹 [Chat] Call type determined:', hasVideo ? 'video' : 'voice');
                        
                        setCallType(hasVideo ? 'video' : 'voice');
                        setIncomingCall({
                            senderId: message.sender_id,
                            messageId: message.id
                        });
                        setShowCallModal(true);
                        console.log('✅ [Chat] CallModal opened for incoming call');
                    } else {
                        console.log('⚠️ [Chat] Incoming call from different user, ignoring');
                    }
                    
                    return currentConversation;
                });
            } else if (message.type === 'hangup') {
                console.log('📞 [Chat] Received hangup signal');
                // Close call modal if open
                setShowCallModal(false);
                setCallType(null);
                setIncomingCall(null);
            }
        });

        signalingUnsubscribeRef.current = unsubscribe;
        return unsubscribe;
    };

    if (loading) {
        return (
            <div className="facebook-layout">
                <div className="chat-container">
                    <div className="loading">Đang tải...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="facebook-layout">
            <div className="chat-container">
            <header className="chat-header">
                <Link to="/chat" className="back-button">
                    ← Quay lại
                </Link>
                <div className="chat-info">
                    <div className="chat-avatar">
                        {getConversationAvatar()}
                    </div>
                    <div className="chat-details">
                        <h1 className="chat-title">{getConversationName()}</h1>
                        <p className="chat-subtitle">
                            {conversation?.type === 'group' ? 'Nhóm chat' : 'Tin nhắn riêng'}
                        </p>
                    </div>
                </div>
                <div className="chat-actions">
                    <button 
                        className="chat-action-btn"
                        onClick={() => {
                            setCallType('voice');
                            setShowCallModal(true);
                        }}
                        title="Gọi điện"
                    >
                        📞
                    </button>
                    <button 
                        className="chat-action-btn"
                        onClick={() => {
                            setCallType('video');
                            setShowCallModal(true);
                        }}
                        title="Gọi video"
                    >
                        📹
                    </button>
                </div>
            </header>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-messages">
                        <div className="empty-icon">💬</div>
                        <p>Chưa có tin nhắn nào</p>
                        <p>Hãy gửi tin nhắn đầu tiên!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${message.sender_id === user.id ? 'own' : 'other'}`}
                        >
                            <div className="message-content">
                                {message.sender_id !== user.id && (
                                    <div className="message-sender">
                                        {message.sender?.name || 'Người dùng'}
                                    </div>
                                )}
                                <p className="message-text">{message.content}</p>
                                <span className="message-time">
                                    {formatTime(message.created_at)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
                <div className="input-group">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="message-input"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        className="send-button"
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? '⏳' : '📤'}
                    </button>
                </div>
            </form>
            </div>

            {/* Call Modal */}
            {showCallModal && callType && (() => {
                const otherUser = getOtherUser();
                if (!otherUser) {
                    console.warn('⚠️ [Chat] No other user found for call');
                    return null;
                }
                
                return (
                    <CallModal
                        key={`call-${id}-${callType}-${Date.now()}`}
                        isOpen={showCallModal}
                        onClose={() => {
                            console.log('🚪 [Chat] CallModal onClose called, resetting state');
                            setShowCallModal(false);
                            setCallType(null);
                            setIncomingCall(null);
                            // Force a small delay to ensure cleanup completes
                            setTimeout(() => {
                                console.log('✅ [Chat] State reset complete');
                            }, 200);
                        }}
                        callType={callType}
                        otherUserId={otherUser.user_id}
                        otherUserName={otherUser.user?.name}
                        otherUserImage={otherUser.user?.image}
                        conversationId={id}
                        isIncoming={!!incomingCall}
                    />
                );
            })()}
        </div>
    );
};

export default Chat;

