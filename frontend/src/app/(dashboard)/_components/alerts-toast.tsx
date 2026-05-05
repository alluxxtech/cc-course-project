"use client";

import { useAuth } from "../../../contexts/auth-context";
import { useAlerts } from "../../../hooks/use-alerts";
import type { AlertThreshold } from "../../../hooks/use-alerts";

const THRESHOLD_CONFIG: Record<
  AlertThreshold,
  { label: string; bg: string; icon: string; text: string }
> = {
  50: {
    label: "50% of budget spent",
    bg: "bg-yellow-50 border-yellow-200",
    icon: "⚠️",
    text: "text-yellow-800",
  },
  80: {
    label: "80% of budget spent",
    bg: "bg-orange-50 border-orange-200",
    icon: "🔶",
    text: "text-orange-800",
  },
  100: {
    label: "Budget limit reached",
    bg: "bg-red-50 border-red-200",
    icon: "🚨",
    text: "text-red-800",
  },
};

export function AlertsToast() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const { alerts, dismiss } = useAlerts(userId);

  if (alerts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 flex w-80 flex-col gap-2"
    >
      {alerts.map((alert) => {
        const config = THRESHOLD_CONFIG[alert.threshold];
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-lg border p-3 shadow-sm ${config.bg}`}
          >
            <span className="text-lg leading-none">{config.icon}</span>
            <p className={`flex-1 text-sm font-medium ${config.text}`}>
              {config.label}
            </p>
            <button
              onClick={() => dismiss(alert.id)}
              className={`shrink-0 text-sm leading-none opacity-60 hover:opacity-100 ${config.text}`}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
