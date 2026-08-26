import { supabase } from "../supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class BackendError extends Error {
  status: number;
  path: string;
  body: unknown;

  constructor(status: number, path: string, body: unknown) {
    super(`Backend request to ${path} failed: ${status}`);
    this.name = "BackendError";
    this.status = status;
    this.path = path;
    this.body = body;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not logged in");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function requestBackend<TResponse>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<TResponse> {
  const method = options?.method ?? (options?.body !== undefined ? "POST" : "GET");
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: await authHeaders(),
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const body = await parseBody(res);
  if (!res.ok) {
    throw new BackendError(res.status, path, body);
  }
  return body as TResponse;
}

export async function callBackend<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  return requestBackend<TResponse>(path, { method: "POST", body });
}
