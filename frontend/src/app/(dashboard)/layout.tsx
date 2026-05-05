"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "../../components/auth-guard";
import { useAuth } from "../../contexts/auth-context";
import { AlertsToast } from "./_components/alerts-toast";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <div className="flex flex-1 flex-col">{children}</div>
        <AlertsToast />
      </div>
    </AuthGuard>
  );
}

function Nav() {
  const auth = useAuth();
  const pathname = usePathname();
  const user = auth.status === "authenticated" ? auth.user : null;

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/transactions", label: "Transactions" },
    { href: "/categories", label: "Categories" },
  ];

  return (
    <header className="border-b border-zinc-100 bg-white px-4">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-zinc-900">
            Expense Tracker
          </span>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  pathname === link.href
                    ? "bg-zinc-100 font-medium text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user?.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={28}
              height={28}
              referrerPolicy="no-referrer"
              className="rounded-full object-cover"
            />
          )}
          <span className="text-sm text-zinc-600">{user?.displayName}</span>
          <button
            onClick={() => void auth.logout()}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
