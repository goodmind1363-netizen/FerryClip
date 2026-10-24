const HOSTS = { tiktok: ["tiktok.com"], instagram: ["instagram.com"], youtube: ["youtube.com", "youtu.be"] };
const OEMBED = { tiktok: "https://www.tiktok.com/oembed?url=", youtube: "https://www.youtube.com/oembed?format=json&url=" };
const j = (o, s = 200) => Response.json(o, { status: s, headers: { "Cache-Control": "no-store" } });
const platform = u => { const h = u.hostname.replace(/^www\./, ""); return Object.keys(HOSTS).find(k => HOSTS[k].some(x => h === x || h.endsWith("." + x))) || null; };
function collect(o, acc = [], d = 0) {
  if (d > 6 || acc.length > 20) return acc;
  if (typeof o === "string") { if (/^https?:\/\//.test(o) && /(\.mp4|\.m4a|\.mp3|\.webm|download|video)/i.test(o)) acc.push(o); }
  else if (o && typeof o === "object") for (const k in o) collect(o[k], acc, d + 1);
  return acc;
}
async function human(request, env) {
  if (!env.TURNSTILE_SECRET) return true;
  const t = request.headers.get("X-TS"); if (!t) return false;
  const f = new FormData(); f.append("secret", env.TURNSTILE_SECRET); f.append("response", t); f.append("remoteip", request.headers.get("CF-Connecting-IP") || "");
  try { const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: f }); return !!(await r.json()).success; } catch { return false; }
}
const cfg = (env, p, k) => env[`DL_${p.toUpperCase()}_${k}`] ?? (p === "tiktok" ? env[`DL_INSTAGRAM_${k}`] : undefined);
function call(env, p, raw) {
  const u = new URL(cfg(env, p, "URL").replace("{url}", encodeURIComponent(raw)));
  const method = (cfg(env, p, "METHOD") || "GET").toUpperCase();
  const headers = { "x-rapidapi-key": env.RAPIDAPI_KEY, "x-rapidapi-host": u.hostname };
  const init = { method, headers };
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    init.body = (cfg(env, p, "BODY") || '{"url":"{url}"}').replace("{url}", JSON.stringify(raw).slice(1, -1));
  }
  return fetch(u, init);
}
export async function onRequestGet({ request, env, waitUntil }) {
  const raw = (new URL(request.url).searchParams.get("url") || "").trim().slice(0, 500);
  let u; try { u = new URL(raw); } catch { return j({ error: "Invalid link." }, 400); }
  if (!/^https?:$/.test(u.protocol)) return j({ error: "Invalid link." }, 400);
  const p = platform(u); if (!p) return j({ error: "Unsupported link." }, 400);
  const cache = caches.default, key = new Request("https://cache.local/resolve?u=" + encodeURIComponent(raw));
  const hit = await cache.match(key); if (hit) return hit;
  if (!(await human(request, env))) return j({ error: "Security check failed. Please try again." }, 403);
  const out = { platform: p, title: "", thumbnail: "", links: [] };
  try {
    if (OEMBED[p]) { const r = await fetch(OEMBED[p] + encodeURIComponent(raw)); if (r.ok) { const d = await r.json(); out.title = d.title || ""; out.thumbnail = d.thumbnail_url || ""; } }
  } catch {}
  if (!cfg(env, p, "URL") || !env.RAPIDAPI_KEY) return j({ ...out, error: "Download service is not configured yet." }, 503);
  try {
    const r = await call(env, p, raw);
    if (!r.ok) return j({ ...out, error: "The download service could not process this link (" + r.status + ")." }, 502);
    out.links = [...new Set(collect(await r.json()))].slice(0, 6);
    if (!out.links.length) return j({ ...out, error: "No downloadable file was found for this link." });
    const res = Response.json(out, { headers: { "Cache-Control": "public, max-age=600" } });
    if (waitUntil) waitUntil(cache.put(key, res.clone()));
    return res;
  } catch { return j({ ...out, error: "The download service is unavailable." }, 502); }
      }
