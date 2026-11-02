export async function postJson<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "请求失败，请重试";
    throw new Error(message);
  }
  return data as T;
}

export async function deleteJson(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(typeof data.error === "string" ? data.error : "操作失败");
  }
}
