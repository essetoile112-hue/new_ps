import { useEffect, useRef, useState } from 'react';

export interface WSMessage {
  type: string;
  data?: any;
}

export function useWebSocket(token: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);

  useEffect(() => {
    if (!token) return;

    const apiUrl = (import.meta as any).env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const wsUrl = apiUrl.replace('http', 'ws');

    try {
      wsRef.current = new WebSocket(`${wsUrl}/ws?token=${token}`);

      wsRef.current.onopen = () => {
        setConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev, msg]);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setConnected(false);
      };

      wsRef.current.onerror = (err) => {
        // eslint-disable-next-line no-console
        console.error('WebSocket error:', err);
      };

      return () => {
        if (wsRef.current) wsRef.current.close();
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('WebSocket connection error:', err);
    }
  }, [token]);

  const subscribe = (sensorIds: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', sensorIds }));
    }
  };

  const unsubscribe = (sensorIds: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', sensorIds }));
    }
  };

  const ping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  };

  return { connected, messages, subscribe, unsubscribe, ping };
}
