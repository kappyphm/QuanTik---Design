type Intent = { kind: "plan" | "order"; id: string };
const key = "quantik.purchase.resume";
export function rememberPurchase(kind: Intent["kind"], id: string) {
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) return;
  try { sessionStorage.setItem(key, JSON.stringify({ kind, id })); } catch { /* Optional navigation metadata. */ }
}
export function readPurchase(): Intent | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    return value && ["plan", "order"].includes(value.kind) && /^[a-zA-Z0-9-]{1,64}$/.test(value.id) ? value : null;
  } catch { return null; }
}
export function clearPurchase() { try { sessionStorage.removeItem(key); } catch { /* Optional navigation metadata. */ } }
