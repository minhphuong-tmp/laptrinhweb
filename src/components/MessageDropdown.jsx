import { useState, useEffect, useRef } from 'react';
import { getConversations } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import GroupAvatar from './GroupAvatar';
import ChatPopup from './ChatPopup';
import './MessageDropdown.css';

const MessageDropdown = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chatPopupOpen, setChatPopupOpen] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Load conversations when dropdown opens
    useEffect(() => {
        console.log('🔍 MessageDropdown useEffect - isOpen:', isOpen, 'user:', user);
        if (isOpen && user?.id) {
            loadConversations();
        }
    }, [isOpen, user?.id]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            // Lấy user ID từ context
            const userId = user?.id;
            console.log('🔍 Loading conversations for userId:', userId);
            console.log('🔍 User object:', user);
            
            if (!userId) {
                console.error('No user ID found in context');
                return;
            }

            const result = await getConversations(userId);
            console.log('🔍 getConversations result:', result);
            
            if (result.success) {
                // Load tất cả cuộc trò chuyện
                const allConversations = result.data || [];
                console.log('🔍 All conversations loaded:', allConversations.length);
                console.log('🔍 First conversation structure:', allConversations[0]);
                console.log('🔍 Conversation members:', allConversations.map(c => c.conversation_members));
                console.log('🔍 Conversation keys:', allConversations.map(c => Object.keys(c)));
                setConversations(allConversations);
            } else {
                console.error('❌ Error loading conversations:', result.msg);
                setConversations([]);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        
        console.log('🔍 MessageDropdown formatTime called with:', timestamp);
        
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
        
        console.log('🔍 diffInMinutes:', diffInMinutes);
        
        if (diffInMinutes < 1) {
            console.log('🔍 Returning: Bây giờ');
            return 'Bây giờ';
        }
        if (diffInMinutes < 60) {
            const result = `${diffInMinutes} phút trước`;
            console.log('🔍 Returning:', result);
            return result;
        }
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            const result = `${diffInHours} giờ trước`;
            console.log('🔍 Returning:', result);
            return result;
        }
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            const result = `${diffInDays} ngày trước`;
            console.log('🔍 Returning:', result);
            return result;
        }
        
        const result = messageTime.toLocaleDateString('vi-VN');
        console.log('🔍 Returning:', result);
        return result;
    };

    const getConversationName = (conversation) => {
        if (conversation.type === 'group') {
            return conversation.name || 'Nhóm chat';
        } else {
            // Tìm tên người khác trong cuộc trò chuyện
            const otherMember = conversation.conversation_members?.find(member => 
                member.user_id !== user?.id
            );
            return otherMember?.user?.name || 'Người dùng';
        }
    };

    const getConversationAvatar = (conversation) => {
        if (conversation.type === 'group') {
            return <GroupAvatar members={conversation.conversation_members || []} size={40} />;
        } else {
            // Tìm avatar người khác trong cuộc trò chuyện
            const otherMember = conversation.conversation_members?.find(member => 
                member.user_id !== user?.id
            );
            return (
                <Avatar 
                    src={otherMember?.user?.image || null}
                    name={otherMember?.user?.name || 'User'}
                    size={40}
                />
            );
        }
    };

    const handleConversationClick = (conversationId) => {
        console.log('🔔 Clicking conversation:', conversationId);
        // Mở ChatPopup trước, sau đó đóng dropdown
        setSelectedConversationId(conversationId);
        setChatPopupOpen(true);
        // Đóng dropdown sau một chút để đảm bảo ChatPopup đã được mount
        setTimeout(() => {
            onClose();
        }, 100);
    };

    const handleCloseChatPopup = () => {
        setChatPopupOpen(false);
        setSelectedConversationId(null);
    };

    return (
        <>
        {isOpen && (
        <div className="message-dropdown" ref={dropdownRef}>
            <div className="message-header">
                <h3>Tin nhắn</h3>
                <div className="message-actions">
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>
            </div>

            <div className="message-content">
                {loading ? (
                    <div className="message-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải tin nhắn...</p>
                    </div>
                ) : conversations.length > 0 ? (
                    <div className="conversation-list">
                        {conversations.map((conversation) => (
                            <div 
                                key={conversation.id}
                                className="conversation-item"
                                onClick={() => handleConversationClick(conversation.id)}
                            >
                                <div className="conversation-avatar">
                                    {getConversationAvatar(conversation)}
                                </div>
                                <div className="conversation-info">
                                    <div className="conversation-name">
                                        {getConversationName(conversation)}
                                    </div>
                                    <div className="conversation-preview">
                                        {conversation.last_message?.content 
                                            ? (() => {
                                                const senderId = conversation.last_message.sender_id || conversation.last_message.sender?.id;
                                                const senderName = conversation.last_message.sender?.name || 'Người dùng';
                                                const isOwnMessage = senderId === user?.id;
                                                const displayName = isOwnMessage ? 'Tôi' : senderName;
                                                const messageContent = conversation.last_message.content;
                                                const fullMessage = `${displayName}: ${messageContent}`;
                                                return fullMessage.length > 50 
                                                    ? fullMessage.substring(0, 50) + '...'
                                                    : fullMessage;
                                            })()
                                            : 'Chưa có tin nhắn'}
                                    </div>
                                </div>
                                <div className="conversation-time">
                                    {conversation.last_message?.created_at 
                                        ? formatTime(conversation.last_message.created_at)
                                        : ''
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="message-empty">
                        <div className="empty-icon">💬</div>
                        <p>Chưa có cuộc trò chuyện nào</p>
                    </div>
                )}
            </div>
        </div>
        )}

            {/* Chat Popup - Render outside dropdown để không bị ảnh hưởng khi dropdown đóng */}
            {chatPopupOpen && selectedConversationId && (
                <ChatPopup
                    conversationId={selectedConversationId}
                    onClose={handleCloseChatPopup}
                />
            )}
        </>
    );
};

export default MessageDropdown;
