import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import GroupAvatar from './GroupAvatar';
import CallModal from './CallModal';
import { useAuth } from '../context/AuthContext';
import { getConversationById, getMessages, markConversationAsRead, sendMessage } from '../services/chatService';
import { subscribeToSignaling } from '../services/webrtcService';
import './ChatPopup.css';

const ChatPopup = ({ conversationId, onClose }) => {
    const { user } = useAuth();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);
    const [callType, setCallType] = useState(null); // 'voice' or 'video'
    const [incomingCall, setIncomingCall] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const pollingRef = useRef(null);
    const signalingUnsubscribeRef = useRef(null);

    useEffect(() => {
        console.log('🔍 ChatPopup useEffect triggered:', { conversationId, userId: user?.id });
        if (conversationId && user?.id) {
            console.log('✅ Loading conversation and messages for:', conversationId);
            // Reset state khi conversationId thay đổi
            setHasLoadedMessages(false);
            setMessages([]);
            setLoading(true);
            
            loadConversation();
            loadMessages();
            setupPolling();
            
            // Setup incoming call listener
            const unsubscribe = setupIncomingCallListener();
            if (unsubscribe) {
                signalingUnsubscribeRef.current = unsubscribe;
            }
            
            // Focus vào input khi mở
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            console.warn('⚠️ ChatPopup: Missing conversationId or user:', { conversationId, userId: user?.id });
        }
        
        // Cleanup on unmount
        return () => {
            if (signalingUnsubscribeRef.current) {
                signalingUnsubscribeRef.current();
                signalingUnsubscribeRef.current = null;
            }
        };
    }, [conversationId, user?.id]);

    const setupIncomingCallListener = () => {
        if (!user?.id || !conversationId) return null;

        console.log('📞 Setting up incoming call listener for user:', user.id, 'conversation:', conversationId);
        
        const unsubscribe = subscribeToSignaling(user.id, (message) => {
            console.log('📨 [ChatPopup] Received signaling message:', message);
            
            if (message.type === 'offer') {
                console.log('📞 [ChatPopup] Incoming call offer received from:', message.sender_id);
                
                // Check if this is for current conversation
                // Use a function to get otherUser to ensure we have latest conversation state
                setConversation(currentConversation => {
                    if (!currentConversation || currentConversation.type === 'group') {
                        console.log('⚠️ [ChatPopup] No conversation or group chat, ignoring call');
                        return currentConversation;
                    }
                    
                    const otherUser = currentConversation.conversation_members?.find(
                        member => member.user_id !== user.id
                    );
                    
                    console.log('👤 [ChatPopup] Other user in conversation:', otherUser?.user_id, 'vs sender:', message.sender_id);
                    
                    if (otherUser && message.sender_id === otherUser.user_id) {
                        console.log('✅ [ChatPopup] Incoming call matches current conversation');
                        // Determine call type from offer data
                        const offerData = typeof message.data === 'string' 
                            ? JSON.parse(message.data) 
                            : message.data;
                        const hasVideo = offerData?.offer?.sdp?.includes('video') || 
                                       offerData?.offer?.sdp?.includes('m=video');
                        
                        console.log('📹 [ChatPopup] Call type determined:', hasVideo ? 'video' : 'voice');
                        
                        // Use setTimeout to ensure state updates properly
                        setTimeout(() => {
                            setCallType(hasVideo ? 'video' : 'voice');
                            setIncomingCall({
                                senderId: message.sender_id,
                                messageId: message.id
                            });
                            setShowCallModal(true);
                            console.log('✅ [ChatPopup] CallModal opened for incoming call');
                        }, 100);
                    } else {
                        console.log('⚠️ [ChatPopup] Incoming call from different user, ignoring');
                    }
                    
                    return currentConversation;
                });
            } else if (message.type === 'hangup') {
                console.log('📞 [ChatPopup] Received hangup signal');
                // Close call modal if open
                setShowCallModal(false);
                setCallType(null);
                setIncomingCall(null);
            }
        });

        return unsubscribe;
    };

    // Scroll xuống cuối khi mở ChatPopup để hiển thị tin nhắn cuối cùng
    useLayoutEffect(() => {
        if (conversationId && !loading && messages.length > 0) {
            scrollToBottom();
        }
    }, [conversationId, loading, messages.length]);

    // Cleanup polling khi component unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Chỉ scroll khi gửi tin nhắn mới (có tin nhắn tạm)
        if (messages.length > 0 && !loading) {
            const hasTemporaryMessage = messages.some(msg => msg.isTemporary);
            if (hasTemporaryMessage) {
                scrollToBottom();
            }
        }
    }, [messages, loading]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            requestAnimationFrame(() => {
                messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            });
        }
    };

    const loadConversation = async () => {
        try {
            console.log('📞 Loading conversation:', conversationId);
            const result = await getConversationById(conversationId);
            console.log('📞 Conversation result:', result);
            if (result.success) {
                setConversation(result.data);
                console.log('✅ Conversation loaded:', result.data);
            } else {
                console.error('❌ Failed to load conversation:', result.msg);
            }
        } catch (error) {
            console.error('❌ Error loading conversation:', error);
        }
    };

    const loadMessages = async () => {
        try {
            console.log('💬 Loading messages for conversation:', conversationId);
            const result = await getMessages(conversationId);
            console.log('💬 Messages result:', result);
            if (result.success) {
                setMessages(result.data || []);
                setHasLoadedMessages(true);
                console.log('✅ Messages loaded:', result.data?.length || 0, 'messages');
                // Đánh dấu đã đọc
                if (user?.id) {
                    await markConversationAsRead(conversationId, user.id);
                }
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
        // Clear existing polling
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }
        
        // Polling thay vì real-time subscription
        pollingRef.current = setInterval(() => {
            loadMessages();
        }, 3000); // Poll mỗi 3 giây cho messages
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Optimistic update - thêm tin nhắn vào UI ngay lập tức
        const tempMessage = {
            id: `temp_${Date.now()}`,
            content: messageText,
            sender_id: user.id,
            sender: { name: user.name },
            created_at: new Date().toISOString(),
            isTemporary: true
        };
        
        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();

        try {
            const result = await sendMessage({
                conversation_id: conversationId,
                sender_id: user.id,
                content: messageText,
                message_type: 'text'
            });

            if (result.success) {
                // Xóa tin nhắn tạm và thêm tin nhắn thật
                setMessages(prev => {
                    const withoutTemp = prev.filter(msg => msg.id !== tempMessage.id);
                    return [...withoutTemp, result.data];
                });
            } else {
                // Xóa tin nhắn tạm nếu gửi thất bại
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
                alert(result.msg);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Xóa tin nhắn tạm nếu có lỗi
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            alert('Không thể gửi tin nhắn');
        } finally {
            setSending(false);
            // Focus lại input sau khi gửi tin nhắn
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
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
        if (!conversation) return <Avatar src={undefined} name="Chat" size={24} />;

        if (conversation.type === 'group') {
            return <GroupAvatar members={conversation.conversation_members || []} size={24} />;
        }

        const otherMember = conversation.conversation_members?.find(
            member => member.user_id !== user.id
        );
        return (
            <Avatar
                src={otherMember?.user?.image}
                name={otherMember?.user?.name || 'User'}
                size={24}
            />
        );
    };

    const getOtherUser = () => {
        if (!conversation || conversation.type === 'group') return null;
        return conversation.conversation_members?.find(
            member => member.user_id !== user.id
        );
    };

    if (!conversationId) return null;

    return (
        <div className="chat-popup-overlay">
            <div className={`chat-popup ${isMinimized ? 'minimized' : ''}`}>
                {/* Header */}
                <div className="chat-popup-header">
                    <div className="chat-popup-info">
                        <div className="chat-popup-avatar">
                            {getConversationAvatar()}
                        </div>
                        <div className="chat-popup-details">
                            <h3 className="chat-popup-title">{getConversationName()}</h3>
                            <p className="chat-popup-subtitle">
                                {conversation?.type === 'group' ? 'Nhóm chat' : 'Tin nhắn riêng'}
                            </p>
                        </div>
                    </div>
                    <div className="chat-popup-controls">
                        <button 
                            className="chat-popup-action-btn"
                            onClick={() => {
                                console.log('📞 [ChatPopup] Voice call button clicked');
                                const otherUser = getOtherUser();
                                console.log('📞 [ChatPopup] Other user:', otherUser);
                                setCallType('voice');
                                setShowCallModal(true);
                                console.log('📞 [ChatPopup] CallModal state set to open');
                            }}
                            title="Gọi điện"
                        >
                            📞
                        </button>
                        <button 
                            className="chat-popup-action-btn"
                            onClick={() => {
                                console.log('📹 [ChatPopup] Video call button clicked');
                                const otherUser = getOtherUser();
                                console.log('📹 [ChatPopup] Other user:', otherUser);
                                setCallType('video');
                                setShowCallModal(true);
                                console.log('📹 [ChatPopup] CallModal state set to open');
                            }}
                            title="Gọi video"
                        >
                            📹
                        </button>
                        <button 
                            className="chat-popup-minimize" 
                            onClick={() => setIsMinimized(!isMinimized)}
                            title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                        >
                            {isMinimized ? '⬆' : '⬇'}
                        </button>
                        <button className="chat-popup-close" onClick={onClose} title="Đóng">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Messages - chỉ hiển thị khi không minimized */}
                {!isMinimized && (
                    <>
                        <div className="chat-popup-messages">
                            {loading ? (
                                <div className="chat-popup-loading">
                                    <div className="loading-spinner">⏳</div>
                                    <p>Đang tải tin nhắn...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="chat-popup-empty">
                                    <div className="empty-icon">💬</div>
                                    <p>Chưa có tin nhắn nào</p>
                                    <p>Hãy gửi tin nhắn đầu tiên!</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`chat-popup-message ${message.sender_id === user.id ? 'own' : 'other'} ${message.isTemporary ? 'temporary' : ''}`}
                                    >
                                        {message.sender_id !== user.id && (
                                            <div className="chat-popup-message-avatar">
                                                <Avatar
                                                    src={message.sender?.image}
                                                    name={message.sender?.name || 'Người dùng'}
                                                    size={32}
                                                />
                                            </div>
                                        )}
                                        <div className="chat-popup-message-content">
                                            {message.sender_id !== user.id && (
                                                <div className="chat-popup-message-sender">
                                                    {message.sender?.name || 'Người dùng'}
                                                </div>
                                            )}
                                            <p className="chat-popup-message-text">{message.content}</p>
                                            <span className="chat-popup-message-time">
                                                {message.isTemporary ? 'Đang gửi...' : formatTime(message.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="chat-popup-form">
                            <div className="chat-popup-input-group">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="chat-popup-input"
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    className="chat-popup-send"
                                    disabled={!newMessage.trim() || sending}
                                >
                                    {sending ? '⏳' : '📤'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>

            {/* Call Modal */}
            {showCallModal && callType && (() => {
                const otherUser = getOtherUser();
                if (!otherUser) {
                    console.warn('⚠️ [ChatPopup] No other user found for call');
                    return null;
                }
                
                return (
                    <CallModal
                        key={`call-${conversationId}-${callType}`}
                        isOpen={showCallModal}
                        onClose={() => {
                            console.log('🚪 [ChatPopup] CallModal onClose called, resetting state');
                            setShowCallModal(false);
                            setCallType(null);
                            setIncomingCall(null);
                            // Force a small delay to ensure cleanup completes
                            setTimeout(() => {
                                console.log('✅ [ChatPopup] State reset complete');
                            }, 200);
                        }}
                        callType={callType}
                        otherUserId={otherUser.user_id}
                        otherUserName={otherUser.user?.name}
                        otherUserImage={otherUser.user?.image}
                        conversationId={conversationId}
                        isIncoming={!!incomingCall}
                    />
                );
            })()}
        </div>
    );
};

export default ChatPopup;
