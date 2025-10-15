import { useState, useEffect, useRef } from 'react';
import { getConversations } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './MessageDropdown.css';

const MessageDropdown = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
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
                // Lấy 5 cuộc trò chuyện gần nhất
                const recentConversations = result.data.slice(0, 5);
                console.log('🔍 Recent conversations:', recentConversations);
                console.log('🔍 First conversation structure:', recentConversations[0]);
                console.log('🔍 Conversation members:', recentConversations.map(c => c.conversation_members));
                console.log('🔍 Conversation keys:', recentConversations.map(c => Object.keys(c)));
                setConversations(recentConversations);
            } else {
                console.error('Error loading conversations:', result.msg);
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
            return null; // Sử dụng avatar mặc định cho nhóm
        } else {
            // Tìm avatar người khác trong cuộc trò chuyện
            const otherMember = conversation.conversation_members?.find(member => 
                member.user_id !== user?.id
            );
            return otherMember?.user?.image;
        }
    };

    const handleConversationClick = (conversationId) => {
        // Đóng dropdown và chuyển đến trang chat
        onClose();
        window.location.href = `/chat/${conversationId}`;
    };

    if (!isOpen) return null;

    return (
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
                                    <Avatar 
                                        src={getConversationAvatar(conversation) || null}
                                        name={getConversationName(conversation)}
                                        size={40}
                                    />
                                </div>
                                <div className="conversation-info">
                                    <div className="conversation-name">
                                        {getConversationName(conversation)}
                                    </div>
                                    <div className="conversation-preview">
                                        {conversation.last_message?.content || 'Chưa có tin nhắn'}
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

            <div className="message-footer">
                <button 
                    className="view-all-btn"
                    onClick={() => {
                        onClose();
                        window.location.href = '/chat';
                    }}
                >
                    Xem tất cả tin nhắn
                </button>
            </div>
        </div>
    );
};

export default MessageDropdown;
