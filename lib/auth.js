const enc = new TextEncoder();
async function sign(msg, secret) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const same = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
export const passwordOk = (input, secret) => same(input, secret);
export async function makeToken(env) { const exp = Date.now() + 8 * 3600e3; return exp + "." + await sign("admin." + exp, env.ADMIN_PASSWORD); }
export async function isAdmin(request, env) {
  try {
    if (!env.ADMIN_PASSWORD) return false;
    const m = (request.headers.get("Cookie") || "").match(/(?:^|; )fc_admin=([^;]+)/);
    if (!m) return false;
    const [exp, sig] = m[1].split(".");
    if (!exp || !sig || Number(exp) < Date.now()) return false;
    return same(sig, await sign("admin." + exp, env.ADMIN_PASSWORD));
  } catch (e) { return false; }
}
