// hooks/use-websocket.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { environment } from '../config/environment';

interface WebSocketNotification {
    message: string;
    type: 'success' | 'error' | 'info';
}

interface UseWebSocketReturn {
    isConnected: boolean;
    notification: WebSocketNotification | null;
    reconnectWebSocket: () => void;
    disconnectWebSocket: () => void;
    lastMessage: any;
}

export function useWebSocket(): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [notification, setNotification] = useState<WebSocketNotification | null>(null);
    const [lastMessage, setLastMessage] = useState<any>(null);

    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttempts = useRef<number>(0);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        if (environment.DEBUG) {
            console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        }

        setNotification({ message, type });

        setTimeout(() => {
            setNotification(null);
        }, 5000);
    }, []);

    const connectWebSocket = useCallback(() => {
        try {
            // Close existing connection if exists
            if (ws.current) {
                if (ws.current.readyState === WebSocket.OPEN) {
                    ws.current.close();
                }
                ws.current = null;
            }

            const wsUrl = environment.getWebSocketUrl();

            if (environment.DEBUG) {
                console.log('🔗 Connecting to WebSocket:', wsUrl);
            }

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                if (environment.DEBUG) {
                    console.log('✅ WebSocket connected successfully');
                }

                setIsConnected(true);
                reconnectAttempts.current = 0;
                showNotification('Connected to real-time updates', 'success');
            };

            ws.current.onclose = (event) => {
                if (environment.DEBUG) {
                    console.log('❌ WebSocket disconnected:', {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean,
                        attempts: reconnectAttempts.current
                    });
                }

                setIsConnected(false);

                // Attempt reconnect only if not a manual close
                if (event.code !== 1000 && !event.wasClean) {
                    attemptReconnect();
                }
            };

            ws.current.onerror = (error) => {
                console.error('💥 WebSocket error:', error);
                setIsConnected(false);
                showNotification('WebSocket connection error', 'error');
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    setLastMessage(message);

                    if (environment.DEBUG) {
                        console.log('📨 WebSocket message received:', message);
                    }
                } catch (err) {
                    console.error('❌ Error parsing WebSocket message:', err);
                }
            };

        } catch (error) {
            console.error('💥 Failed to create WebSocket connection:', error);
            setIsConnected(false);
            showNotification('Failed to establish connection', 'error');
            attemptReconnect();
        }
    }, [showNotification]);

    const attemptReconnect = useCallback(() => {
        const maxAttempts = environment.MAX_RECONNECT_ATTEMPTS;

        if (reconnectAttempts.current >= maxAttempts) {
            if (environment.DEBUG) {
                console.log('🚫 Max reconnection attempts reached:', maxAttempts);
            }
            showNotification('Unable to connect to server after multiple attempts', 'error');
            return;
        }

        // Clear existing timeout
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }

        // Exponential backoff with max delay of 30 seconds
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        if (environment.DEBUG) {
            console.log(`🔄 Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts.current}/${maxAttempts})`);
        }

        reconnectTimeout.current = setTimeout(() => {
            connectWebSocket();
        }, delay);
    }, [connectWebSocket, showNotification]);

    const reconnectWebSocket = useCallback(() => {
        if (environment.DEBUG) {
            console.log('🔄 Manual reconnect triggered');
        }

        // Reset reconnect attempts for manual reconnect
        reconnectAttempts.current = 0;

        // Clear any pending reconnection
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }

        connectWebSocket();
    }, [connectWebSocket]);

    const disconnectWebSocket = useCallback(() => {
        if (environment.DEBUG) {
            console.log('🔌 Disconnecting WebSocket...');
        }

        // Clear reconnection timeout
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }

        // Close WebSocket connection
        if (ws.current) {
            ws.current.close(1000, 'Manual disconnect');
            ws.current = null;
        }

        setIsConnected(false);
        reconnectAttempts.current = 0;
        setLastMessage(null);
    }, []);

    // Auto-connect when component mounts
    useEffect(() => {
        if (environment.DEBUG) {
            console.log('🚀 Initializing WebSocket connection...');
        }

        connectWebSocket();

        return () => {
            disconnectWebSocket();
        };
    }, [connectWebSocket, disconnectWebSocket]);

    return {
        isConnected,
        notification,
        reconnectWebSocket,
        disconnectWebSocket,
        lastMessage
    };
}