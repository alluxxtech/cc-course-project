import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-4 px-4">
        <p className="text-6xl font-semibold text-zinc-200" aria-hidden="true">
          404
        </p>
        <h1 className="text-xl font-semibold text-zinc-900">Page not found</h1>
        <p className="text-sm text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
