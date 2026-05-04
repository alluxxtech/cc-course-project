"use client";

import { useAuth } from "../../../contexts/auth-context";

export default function DashboardPage() {
  const auth = useAuth();
  const user = auth.status === "authenticated" ? auth.user : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-lg font-medium">
        Welcome, {user?.displayName ?? "..."}
      </p>
      <button
        onClick={() => void auth.logout()}
        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        Sign out
      </button>
    </main>
  );
}
