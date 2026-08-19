import { supabase } from "../supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function callBackend<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Backend request to ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<TResponse>;
}
