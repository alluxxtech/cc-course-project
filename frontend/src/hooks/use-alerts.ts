import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

const VALID_THRESHOLDS = [50, 80, 100] as const;

export type AlertThreshold = (typeof VALID_THRESHOLDS)[number];

export type BudgetAlert = {
  id: string;
  threshold: AlertThreshold;
};

function isValidThreshold(value: unknown): value is AlertThreshold {
  return VALID_THRESHOLDS.includes(value as AlertThreshold);
}

export function useAlerts(userId: string | null) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const idCounterRef = useRef(0);

  useEffect(() => {
    if (!userId) return;

    const socket = io(`${WS_URL}/alerts`, {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe");
    });

    socket.on("budget-alert", (payload: unknown) => {
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("threshold" in payload) ||
        !isValidThreshold((payload as Record<string, unknown>)["threshold"])
      )
        return;

      const threshold = (payload as { threshold: AlertThreshold }).threshold;
      // Deduplicate within the same session — server only sends unacked, but guard against duplicates
      setAlerts((prev) => {
        if (prev.some((a) => a.threshold === threshold)) return prev;
        const id = `${threshold}-${++idCounterRef.current}`;
        return [...prev, { id, threshold }];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  function dismiss(id: string) {
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      socketRef.current?.emit("ack", { threshold: alert.threshold });
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return { alerts, dismiss };
}
