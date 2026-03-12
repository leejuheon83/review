"use client";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const actorId = window.localStorage.getItem("coaching-log-actor-id") || "";
  const headers = new Headers(options.headers || {});
  headers.set("x-actor-id", actorId);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...options, headers, cache: "no-store" });
  let data: T & { error?: string };
  try {
    const text = await res.text();
    data = (text ? JSON.parse(text) : {}) as T & { error?: string };
  } catch {
    data = { error: "응답 파싱 실패" } as T & { error?: string };
  }
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`);
  }
  return data as T;
}
