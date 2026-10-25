import { makeToken, passwordOk } from "../../../lib/auth.js";
async function human(request, env, token) {
  if (!env.ADMIN_TS_SECRET) return true;
  if (!token) return false;
  const f = new FormData(); f.append("secret", env.ADMIN_TS_SECRET); f.append("response", token); f.append("remoteip", request.headers.get("CF-Connecting-IP") || "");
  try { const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: f }); return !!(await r.json()).success; } catch { return false; }
}
export async function onRequest({ request, env }) {
  const url = new URL(request.url), o = request.headers.get("Origin");
  if (o && new URL(o).host !== url.host) return new Response("Forbidden", { status: 403 });
  const cookie = (v, age) => `fc_admin=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
  if (request.method === "DELETE") return new Response("ok", { headers: { "Set-Cookie": cookie("", 0) } });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 12) return new Response("Admin password is not set (minimum 12 characters).", { status: 503 });
  let b = {}; try { b = await request.json(); } catch {}
  if (!(await human(request, env, b.ts))) return new Response("Security check failed. Please try again.", { status: 403 });
  await new Promise(r => setTimeout(r, 1200));
  if (!passwordOk(String(b.password || ""), env.ADMIN_PASSWORD)) return new Response("Wrong password", { status: 401 });
  return new Response("ok", { headers: { "Set-Cookie": cookie(await makeToken(env), 8 * 3600) } });
}
