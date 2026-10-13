// Tiny fetch helpers for the per-item API endpoints. They return the raw Response
// so the caller (see use-remote-state.ts) decides what counts as a failure.

export function sendJson(url: string, method: "POST" | "PATCH" | "PUT", body: unknown) {
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function sendDelete(url: string) {
  return fetch(url, { method: "DELETE" });
}
