"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";

export default function RootPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "authenticated") {
      router.replace("/dashboard");
    } else if (auth.status === "unauthenticated") {
      router.replace("/login");
    }
  }, [auth.status, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
    </div>
  );
}
