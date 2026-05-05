"use client";

import { useEffect } from "react";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p
            className="text-4xl font-semibold text-zinc-200"
            aria-hidden="true"
          >
            Oops
          </p>
          <h1 className="text-xl font-semibold text-zinc-900">
            Something went wrong
          </h1>
          <p className="text-sm text-zinc-500">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
