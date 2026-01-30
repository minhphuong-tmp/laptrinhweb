import { supabase } from '../lib/supabase';

const API_URL = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

// Tạo signaling message (offer, answer, ice-candidate)
export const createSignalingMessage = async (senderId, receiverId, type, data) => {
    try {
        console.log('📨 [webrtcService] Creating signaling message:', {
            senderId,
            receiverId,
            type,
            dataSize: JSON.stringify(data).length
        });

        // Ensure data is properly stringified if it's an object
        const dataPayload = typeof data === 'string' ? data : JSON.stringify(data);

        const response = await fetch(`${API_URL}/webrtc_signaling`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                sender_id: senderId,
                receiver_id: receiverId,
                type: type, // 'offer', 'answer', 'ice-candidate', 'hangup'
                data: dataPayload
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [webrtcService] HTTP error:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ [webrtcService] Signaling message created:', result);
        return result;
    } catch (error) {
        console.error('❌ [webrtcService] Error creating signaling message:', error);
        throw error;
    }
};

// Lấy signaling messages cho một user
export const getSignalingMessages = async (userId) => {
    try {
        const response = await fetch(
            `${API_URL}/webrtc_signaling?receiver_id=eq.${userId}&order=created_at.desc&limit=50`,
            {
                method: 'GET',
                headers: {
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching signaling messages:', error);
        throw error;
    }
};

// Xóa signaling message sau khi đã xử lý
export const deleteSignalingMessage = async (messageId) => {
    try {
        const response = await fetch(`${API_URL}/webrtc_signaling?id=eq.${messageId}`, {
            method: 'DELETE',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting signaling message:', error);
        throw error;
    }
};

// Subscribe to real-time signaling messages
export const subscribeToSignaling = (userId, callback) => {
    console.log('📡 [webrtcService] Subscribing to signaling for user:', userId);
    
    const channelName = `webrtc_signaling:${userId}`;
    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'webrtc_signaling',
                filter: `receiver_id=eq.${userId}`
            },
            (payload) => {
                console.log('📨 [webrtcService] New signaling message received:', {
                    id: payload.new.id,
                    type: payload.new.type,
                    sender_id: payload.new.sender_id,
                    receiver_id: payload.new.receiver_id,
                    created_at: payload.new.created_at,
                    dataType: typeof payload.new.data
                });
                
                // Parse data if it's a string
                let messageData = { ...payload.new };
                if (typeof messageData.data === 'string') {
                    try {
                        messageData.data = JSON.parse(messageData.data);
                        console.log('✅ [webrtcService] Parsed message data successfully');
                    } catch (e) {
                        console.warn('⚠️ [webrtcService] Failed to parse message data:', e, messageData.data);
                        // Keep as string if parsing fails
                    }
                }
                
                console.log('📨 [webrtcService] Calling callback with message:', messageData.type);
                callback(messageData);
            }
        )
        .subscribe((status) => {
            console.log('📡 [webrtcService] Signaling subscription status:', status, 'for channel:', channelName);
            if (status === 'SUBSCRIBED') {
                console.log('✅ [webrtcService] Successfully subscribed to signaling');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ [webrtcService] Channel subscription error');
            }
        });

    return () => {
        console.log('📡 [webrtcService] Unsubscribing from signaling channel:', channelName);
        supabase.removeChannel(channel);
    };
};

