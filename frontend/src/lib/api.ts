const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: unknown };
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(message);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export { BACKEND_URL };
