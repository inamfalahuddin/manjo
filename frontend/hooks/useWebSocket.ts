// hooks/useWebSocket.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 5000);
    }, []);

    const connectWebSocket = useCallback(() => {
        // Pastikan kita di client side
        if (typeof window === 'undefined') return;

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//localhost:8000/ws`;

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                showNotification('Connected to real-time updates', 'success');
            };

            ws.current.onclose = () => {
                console.log('❌ WebSocket disconnected');
                setIsConnected(false);
                attemptReconnect();
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            attemptReconnect();
        }
    }, [showNotification]);

    const attemptReconnect = useCallback(() => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }

        reconnectTimeout.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect WebSocket...');
            connectWebSocket();
        }, 3000);
    }, [connectWebSocket]);

    const reconnectWebSocket = useCallback(() => {
        if (ws.current) {
            ws.current.close();
        }
        connectWebSocket();
    }, [connectWebSocket]);

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [connectWebSocket]);

    return {
        isConnected,
        notification,
        reconnectWebSocket,
        ws: ws.current
    };
}