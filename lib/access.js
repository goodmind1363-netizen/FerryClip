// Verifies the Cloudflare Access JWT so only you can use the admin API.
const b64 = x => Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
let KEYS = null, KEYS_AT = 0; // keys are cached for one hour to keep admin calls fast
async function keys(env) {
  if (!KEYS || Date.now() - KEYS_AT > 3600e3) {
    KEYS = (await (await fetch(`https://${env.ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`)).json()).keys;
    KEYS_AT = Date.now();
  }
  return KEYS;
}
export async function isAdmin(request, env) {
  try {
    const t = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!t || !env.ACCESS_AUD || !env.ACCESS_TEAM) return false;
    const [h, p, s] = t.split(".");
    const hd = JSON.parse(new TextDecoder().decode(b64(h)));
    const pl = JSON.parse(new TextDecoder().decode(b64(p)));
    if (pl.exp * 1000 < Date.now() || ![].concat(pl.aud).includes(env.ACCESS_AUD)) return false;
    const jwk = (await keys(env)).find(k => k.kid === hd.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64(s), new TextEncoder().encode(h + "." + p));
  } catch (e) { return false; }
}
