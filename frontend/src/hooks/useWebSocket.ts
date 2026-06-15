import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";

type MessageHandler = (data: any) => void;

interface UseWebSocketOptions {
  onVesselUpdate?: MessageHandler;
  onAlerts?: MessageHandler;
  onShipmentUpdate?: MessageHandler;
  onEmailUpdate?: MessageHandler;
  onDsrRemarkUpdate?: MessageHandler;
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(options);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const unmountedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => { handlersRef.current = options; });

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) { ws.close(); return; }
        setIsConnected(true);
        ["vessels", "alerts", "shipment_update", "email_update", "dsr_remark_update"].forEach(channel => {
          ws.send(JSON.stringify({ type: "subscribe", channel }));
        });
      };

      ws.onmessage = (event) => {
        if (unmountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          setLastMessage(msg);
          const { channel, data } = msg;
          if (channel === "vessels") handlersRef.current.onVesselUpdate?.(data);
          else if (channel === "alerts") handlersRef.current.onAlerts?.(data);
          else if (channel === "shipment_update") handlersRef.current.onShipmentUpdate?.(data);
          else if (channel === "email_update") handlersRef.current.onEmailUpdate?.(data);
          else if (channel === "dsr_remark_update") handlersRef.current.onDsrRemarkUpdate?.(data);
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setIsConnected(false);
        // Reconnect only if still mounted
        reconnectTimeout.current = setTimeout(() => {
          if (!unmountedRef.current) connect();
        }, 3000);
      };

      ws.onerror = () => { ws.close(); };
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (options.enabled === false) return;
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect, options.enabled]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, lastMessage, send };
}