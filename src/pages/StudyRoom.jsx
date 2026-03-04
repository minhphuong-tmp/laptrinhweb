import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import './StudyRoom.css';

const StudyRoom = () => {
    const { user } = useAuth();
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'Chào mừng bạn đến phòng học! Gõ @chatbot để hỏi AI 🤖', user: 'Hệ thống', isSystem: true, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [myStream, setMyStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [mediaError, setMediaError] = useState(null);
    const [participants] = useState([
        { id: 'me', name: null, isMe: true },
        { id: 'p2', name: 'Nguyễn Văn A', isMe: false },
        { id: 'p3', name: 'Trần Thị B', isMe: false },
    ]);
    const [elapsed, setElapsed] = useState(0);

    const myVideoRef = useRef();
    const screenVideoRef = useRef();
    const chatEndRef = useRef();

    const displayName = user?.name || user?.email?.split('@')[0] || 'Khách';

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (s) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    // Camera & mic
    useEffect(() => {
        let localStream = null;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                setMyStream(stream);
                if (myVideoRef.current) myVideoRef.current.srcObject = stream;
            })
            .catch(err => {
                setMediaError(err.name === 'NotAllowedError'
                    ? 'Chưa cấp quyền camera/microphone. Phòng học chạy chế độ nghe.'
                    : 'Không thể kết nối camera. Kiểm tra thiết bị.');
            });
        return () => {
            if (localStream) localStream.getTracks().forEach(t => t.stop());
        };
    }, []);


    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Gán screen stream vào video ref sau khi render
    useEffect(() => {
        if (screenVideoRef.current && screenStream) {
            screenVideoRef.current.srcObject = screenStream;
        }
    }, [screenStream]);

    // Re-gán camera stream vào myVideoRef khi component remount (khi toggle screen share)
    useEffect(() => {
        if (myVideoRef.current && myStream) {
            myVideoRef.current.srcObject = myStream;
        }
    }, [isScreenSharing, myStream]);


    const toggleMute = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
            setIsMuted(p => !p);
        }
    };

    const toggleCam = () => {
        if (myStream) {
            myStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
            setIsCamOff(p => !p);
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenStream) screenStream.getTracks().forEach(t => t.stop());
            setScreenStream(null);
            setIsScreenSharing(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });
                setScreenStream(stream);
                setIsScreenSharing(true);
                // Video ref sẽ được gán qua useEffect phía trên

                stream.getVideoTracks()[0].onended = () => {
                    setScreenStream(null);
                    setIsScreenSharing(false);
                };
            } catch (err) {
                if (err.name !== 'NotAllowedError') {
                    console.error('Screen share error:', err);
                }
            }
        }
    };

    const leaveRoom = () => {
        if (myStream) myStream.getTracks().forEach(t => t.stop());
        if (screenStream) screenStream.getTracks().forEach(t => t.stop());
        navigate('/study-support');
    };

    const sendMessage = () => {
        const trimmed = newMessage.trim();
        if (!trimmed) return;

        const msg = {
            id: Date.now(),
            text: trimmed,
            user: displayName,
            isMe: true,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, msg]);
        setNewMessage('');

        if (trimmed.toLowerCase().startsWith('@chatbot')) {
            const question = trimmed.substring(8).trim();
            const tempBotId = Date.now() + 1;
            setMessages(prev => [...prev, {
                id: tempBotId,
                text: '⏳ Đang suy nghĩ...',
                user: '🤖 KMA AI',
                isMe: false,
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            }]);

            fetch('http://localhost:3001/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: question, context: roomId || 'Hỗ trợ chung' })
            })
                .then(r => r.json())
                .then(data => {
                    setMessages(prev => prev.map(m =>
                        m.id === tempBotId ? { ...m, text: data.reply || 'Xin lỗi, AI gặp lỗi.' } : m
                    ));
                })
                .catch(() => {
                    setMessages(prev => prev.map(m =>
                        m.id === tempBotId ? { ...m, text: '❌ Không kết nối được AI.' } : m
                    ));
                });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const togglePanel = (panel) => {
        if (panel === 'chat') {
            setShowChat(p => !p);
            setShowParticipants(false);
        } else {
            setShowParticipants(p => !p);
            setShowChat(false);
        }
    };

    const activePanel = showChat ? 'chat' : showParticipants ? 'people' : null;

    return (
        <div className="sr-wrap">
            {/* ── TOP BAR ── */}
            <div className="sr-topbar">
                <div className="sr-topbar-left">
                    <span className="sr-live-dot" />
                    <span className="sr-room-name">{roomId || 'Phòng học'}</span>
                    <span className="sr-timer">{formatTime(elapsed)}</span>
                </div>
                <div className="sr-topbar-right">
                    <span className="sr-participant-count">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                        {participants.length}
                    </span>
                    <button className="sr-leave-btn" onClick={leaveRoom}>Rời phòng</button>
                </div>
            </div>

            {/* ── MAIN AREA ── */}
            <div className="sr-main">
                {/* VIDEO AREA */}
                <div className="sr-video-area">
                    {mediaError && (
                        <div className="sr-media-error">⚠️ {mediaError}</div>
                    )}

                    {/* Screen share spotlight */}
                    {isScreenSharing && (
                        <div className="sr-screen-spotlight">
                            <div className="sr-screen-badge">🖥️ Bạn đang chia sẻ màn hình</div>
                            <video ref={screenVideoRef} autoPlay playsInline className="sr-screen-video" />
                            <div className="sr-thumb-strip">
                                <div className={`sr-thumb is-me${isCamOff ? ' cam-off' : ''}`}>
                                    {!isCamOff ? (
                                        <video ref={myVideoRef} autoPlay muted playsInline />
                                    ) : (
                                        <div className="sr-avatar-fallback">{displayName.charAt(0).toUpperCase()}</div>
                                    )}
                                    <span className="sr-thumb-name">{displayName} {isMuted ? '🔇' : ''}</span>
                                </div>
                                {participants.filter(p => !p.isMe).map(p => (
                                    <div key={p.id} className="sr-thumb">
                                        <div className="sr-avatar-fallback">{p.name.charAt(0)}</div>
                                        <span className="sr-thumb-name">{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Normal video grid */}
                    {!isScreenSharing && (
                        <div className={`sr-grid count-${participants.length}`}>
                            {/* My video */}
                            <div className={`sr-video-tile is-me${isCamOff ? ' cam-off' : ''}`}>
                                {!isCamOff && !mediaError ? (
                                    <video ref={myVideoRef} autoPlay muted playsInline />
                                ) : (
                                    <div className="sr-avatar-fallback large">{displayName.charAt(0).toUpperCase()}</div>
                                )}
                                <div className="sr-tile-name">
                                    {isMuted && <span className="sr-muted-icon">🔇</span>}
                                    {displayName} (Bạn)
                                </div>
                            </div>

                            {/* Other participants */}
                            {participants.filter(p => !p.isMe).map(p => (
                                <div key={p.id} className="sr-video-tile">
                                    <div className="sr-avatar-fallback large">{p.name.charAt(0)}</div>
                                    <div className="sr-tile-name">{p.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SIDE PANEL */}
                {activePanel && (
                    <div className="sr-side-panel">
                        <div className="sr-panel-header">
                            <span>{activePanel === 'chat' ? '💬 Chat' : '👥 Người tham gia'}</span>
                            <button className="sr-panel-close" onClick={() => activePanel === 'chat' ? setShowChat(false) : setShowParticipants(false)}>✕</button>
                        </div>

                        {activePanel === 'people' && (
                            <div className="sr-people-list">
                                {participants.map(p => (
                                    <div key={p.id} className="sr-person-item">
                                        <div className="sr-person-avatar">{(p.isMe ? displayName : p.name).charAt(0).toUpperCase()}</div>
                                        <div className="sr-person-info">
                                            <span className="sr-person-name">{p.isMe ? displayName : p.name}</span>
                                            {p.isMe && <span className="sr-you-badge">Bạn</span>}
                                        </div>
                                        <div className="sr-person-status">
                                            <span title="Mic">{isMuted && p.isMe ? '🔇' : '🎤'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activePanel === 'chat' && (
                            <>
                                <div className="sr-chat-messages">
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`sr-chat-msg ${msg.isMe ? 'me' : ''} ${msg.isSystem ? 'system' : ''}`}>
                                            {!msg.isMe && !msg.isSystem && (
                                                <span className="sr-msg-sender">{msg.user}</span>
                                            )}
                                            <div className="sr-msg-bubble">{msg.text}</div>
                                            <span className="sr-msg-time">{msg.time}</span>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="sr-chat-input">
                                    <input
                                        type="text"
                                        placeholder="Nhắn tin... (@chatbot để hỏi AI)"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <button onClick={sendMessage}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── CONTROLS BAR ── */}
            <div className="sr-controls">
                <button
                    className={`sr-ctrl-btn ${isMuted ? 'off' : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? 'Bật mic' : 'Tắt mic'}
                >
                    <span className="sr-ctrl-icon">{isMuted ? '🔇' : '🎤'}</span>
                    <span className="sr-ctrl-label">{isMuted ? 'Bật mic' : 'Tắt mic'}</span>
                </button>

                <button
                    className={`sr-ctrl-btn ${isCamOff ? 'off' : ''}`}
                    onClick={toggleCam}
                    title={isCamOff ? 'Bật camera' : 'Tắt camera'}
                >
                    <span className="sr-ctrl-icon">📷</span>
                    <span className="sr-ctrl-label">{isCamOff ? 'Bật cam' : 'Tắt cam'}</span>
                </button>

                <button
                    className={`sr-ctrl-btn ${isScreenSharing ? 'sharing' : ''}`}
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
                >
                    <span className="sr-ctrl-icon">🖥️</span>
                    <span className="sr-ctrl-label">{isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ'}</span>
                </button>

                <div className="sr-ctrl-divider" />

                <button
                    className={`sr-ctrl-btn ${showParticipants ? 'active' : ''}`}
                    onClick={() => togglePanel('people')}
                    title="Người tham gia"
                >
                    <span className="sr-ctrl-icon">👥</span>
                    <span className="sr-ctrl-label">Người dùng</span>
                </button>

                <button
                    className={`sr-ctrl-btn ${showChat ? 'active' : ''}`}
                    onClick={() => togglePanel('chat')}
                    title="Chat"
                >
                    <span className="sr-ctrl-icon">💬</span>
                    <span className="sr-ctrl-label">Chat</span>
                </button>

                <div className="sr-ctrl-divider" />

                <button className="sr-ctrl-btn end-call" onClick={leaveRoom} title="Rời phòng">
                    <span className="sr-ctrl-icon">📞</span>
                    <span className="sr-ctrl-label">Kết thúc</span>
                </button>
            </div>
        </div>
    );
};

export default StudyRoom;
