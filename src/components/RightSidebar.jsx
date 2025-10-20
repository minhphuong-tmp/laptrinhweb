import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import GroupAvatar from './GroupAvatar';
import ChatPopup from './ChatPopup';
import { useAuth } from '../context/AuthContext';
import { getConversations } from '../services/chatService';
import { getAllUnreadMessageCounts, markConversationAsRead } from '../services/unreadMessagesService';
import { supabase } from '../lib/supabase';
import '../pages/FacebookLayout.css';

const RightSidebar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [chatPopupOpen, setChatPopupOpen] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);

    // Load conversations cho right sidebar
    const loadConversations = async (showLoading = false) => {
        if (!user?.id) {
            console.log('RightSidebar: No user ID, skipping conversation load');
            return;
        }
        
        try {
            if (showLoading) {
                setConversationsLoading(true);
            }
            console.log('RightSidebar: Loading conversations for user:', user.id);
            const result = await getConversations(user.id);
            console.log('RightSidebar: Conversations result:', result);
            if (result.success) {
                const conversations = result.data.slice(0, 5); // Chỉ hiển thị 5 cuộc trò chuyện gần nhất
                setConversations(conversations);
                console.log('RightSidebar: Set conversations:', conversations);
                // Load unread counts sau khi load conversations
                loadUnreadCounts();
            }
        } catch (error) {
            console.error('RightSidebar: Error loading conversations:', error);
        } finally {
            if (showLoading) {
                setConversationsLoading(false);
            }
        }
    };

    // Load unread message counts
    const loadUnreadCounts = async () => {
        if (!user?.id) return;
        
        try {
            const counts = await getAllUnreadMessageCounts(user.id);
            console.log('RightSidebar: Unread counts:', counts);
            setUnreadCounts(counts);
            
            const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
            setTotalUnreadCount(total);
            console.log('RightSidebar: Total unread count:', total);
        } catch (error) {
            console.error('RightSidebar: Error loading unread counts:', error);
        }
    };

    // Load conversations on mount
    useEffect(() => {
        loadConversations(true);
    }, [user?.id]);

    // Real-time subscription for new messages
    useEffect(() => {
        if (!user?.id) return;

        console.log('RightSidebar: Setting up real-time subscription for user:', user.id);
        
        // Subscribe to messages table changes
        const messagesSubscription = supabase
            .channel('messages_changes')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages',
                    filter: `conversation_id=in.(${conversations.map(c => c.id).join(',')})`
                }, 
                (payload) => {
                    console.log('RightSidebar: New message received:', payload);
                    // Reload conversations to get updated data
                    loadConversations(false);
                }
            )
            .subscribe();

        // Subscribe to conversation members changes (for new conversations)
        const conversationsSubscription = supabase
            .channel('conversations_changes')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'conversation_members',
                    filter: `user_id=eq.${user.id}`
                }, 
                (payload) => {
                    console.log('RightSidebar: New conversation member added:', payload);
                    // Reload conversations to get new conversation
                    loadConversations(false);
                }
            )
            .subscribe();

        return () => {
            console.log('RightSidebar: Cleaning up real-time subscriptions');
            supabase.removeChannel(messagesSubscription);
            supabase.removeChannel(conversationsSubscription);
        };
    }, [user?.id, conversations]);

    // Handle opening chat popup
    const handleOpenChatPopup = async (conversationId) => {
        setSelectedConversationId(conversationId);
        setChatPopupOpen(true);
        
        // Mark conversation as read
        if (user?.id) {
            try {
                await markConversationAsRead(conversationId, user.id);
                // Update unread counts
                loadUnreadCounts();
            } catch (error) {
                console.error('Error marking conversation as read:', error);
            }
        }
    };

    // Handle closing chat popup
    const handleCloseChatPopup = () => {
        setChatPopupOpen(false);
        setSelectedConversationId(null);
    };

    // Get conversation avatar
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

    // Get conversation name
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

    // Format conversation time
    const formatConversationTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} ngày trước`;
        if (diff < 2592000000) return `${Math.floor(diff / 604800000)} tuần trước`;
        return `${Math.floor(diff / 2592000000)} tháng trước`;
    };

    return (
        <>
            {/* Right Sidebar - Conversations */}
            <div className="right-sidebar">
                <div className="right-sidebar-content">
                    <div className="sidebar-header">
                        <div className="sidebar-title">
                            <h3>Cuộc trò chuyện</h3>
                        </div>
                        <button 
                            className="create-group-btn"
                            onClick={() => navigate('/new-chat')}
                            title="Tạo nhóm mới"
                        >
                            <span className="create-group-icon">👥</span>
                        </button>
                    </div>
                    <div className="conversations-list">
                        {conversationsLoading ? (
                            <div className="loading-conversations">
                                <div className="loading-spinner">⏳</div>
                                <p>Đang tải...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="no-conversations">
                                <div className="empty-icon">💬</div>
                                <p>Chưa có cuộc trò chuyện nào</p>
                            </div>
                        ) : (
                            conversations.map((conversation) => {
                                const hasUnreadMessages = unreadCounts[conversation.id] > 0;
                                return (
                                <div
                                    key={conversation.id}
                                    className={`conversation-item ${hasUnreadMessages ? 'unread' : 'read'}`}
                                    onClick={() => handleOpenChatPopup(conversation.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="conversation-avatar">
                                        {getConversationAvatar(conversation)}
                                    </div>
                                    <div className="conversation-info">
                                        <div className="conversation-name">
                                            {getConversationName(conversation)}
                                        </div>
                                        <div className="conversation-preview">
                                            {(() => {
                                                const hasUnreadMessages = unreadCounts[conversation.id] > 0;
                                                if (conversation.last_message) {
                                                    const isCurrentUser = conversation.last_message.sender?.id === user?.id;
                                                    return (
                                                        <>
                                                            <span className={`conversation-sender ${hasUnreadMessages ? 'unread' : 'read'}`}>
                                                                {isCurrentUser ? 'Tôi' : (conversation.last_message.sender?.name || 'Người dùng')}: 
                                                            </span>
                                                            <span className="conversation-content">
                                                                {conversation.last_message.content}
                                                            </span>
                                                        </>
                                                    );
                                                } else if (conversation.messages && conversation.messages.length > 0) {
                                                    const lastMsg = conversation.messages[conversation.messages.length - 1];
                                                    const isCurrentUser = lastMsg.sender?.id === user?.id;
                                                    return (
                                                        <>
                                                            <span className={`conversation-sender ${hasUnreadMessages ? 'unread' : 'read'}`}>
                                                                {isCurrentUser ? 'Tôi' : (lastMsg.sender?.name || 'Người dùng')}: 
                                                            </span>
                                                            <span className="conversation-content">
                                                                {lastMsg.content}
                                                            </span>
                                                        </>
                                                    );
                                                } else {
                                                    return 'Chưa có tin nhắn';
                                                }
                                            })()}
                                        </div>
                                    </div>
                                    <div className="conversation-right">
                                        <div className="conversation-time">
                                            {conversation.last_message?.created_at 
                                                ? formatConversationTime(conversation.last_message.created_at)
                                                : formatConversationTime(conversation.updated_at)
                                            }
                                        </div>
                                        {unreadCounts[conversation.id] > 0 && (
                                            <div className="unread-badge">
                                                {unreadCounts[conversation.id] > 99 ? '99+' : unreadCounts[conversation.id]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>
                    
                    <div className="right-sidebar-footer">
                        <button 
                            className="new-chat-btn"
                            onClick={() => navigate('/chat')}
                        >
                            <span className="btn-icon">💬</span>
                            <span>Xem tất cả</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Popup */}
            {chatPopupOpen && selectedConversationId && (
                <ChatPopup
                    conversationId={selectedConversationId}
                    onClose={handleCloseChatPopup}
                />
            )}
        </>
    );
};

export default RightSidebar;
