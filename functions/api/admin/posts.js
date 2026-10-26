import { isAdmin } from "../../../lib/auth.js";
const today = () => new Date().toISOString().slice(0, 10);
const okDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
export async function onRequest({ request, env }) {
  if (!(await isAdmin(request, env))) return new Response("Forbidden", { status: 403 });
  const m = request.method, url = new URL(request.url), id = url.searchParams.get("id");
  if (m !== "GET") {
    const o = request.headers.get("Origin");
    if (o && new URL(o).host !== url.host) return new Response("Forbidden", { status: 403 });
    if (m !== "DELETE" && !(request.headers.get("Content-Type") || "").includes("application/json")) return new Response("Bad request", { status: 415 });
  }
  if (m === "GET") {
    const { results } = await env.DB.prepare("SELECT id,title,body,date,(image IS NOT NULL) AS img FROM posts ORDER BY date DESC,id DESC").all();
    return Response.json(results, { headers: { "Cache-Control": "no-store" } });
  }
  if (m === "POST" || m === "PUT") {
    const b = await request.json();
    const t = String(b.title || "").trim().slice(0, 200), body = String(b.body || "").slice(0, 50000);
    const date = okDate(String(b.date || "")) ? b.date : today();
    if (!t) return new Response("Title required", { status: 400 });
    let img;
    if (b.image !== undefined) {
      if (!b.image) img = null;
      else if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.image) && b.image.length <= 450000) img = b.image;
      else return new Response("Invalid image (max about 330 KB)", { status: 400 });
    }
    if (m === "POST") await env.DB.prepare("INSERT INTO posts(title,body,date,image) VALUES(?,?,?,?)").bind(t, body, date, img ?? null).run();
    else if (img === undefined) await env.DB.prepare("UPDATE posts SET title=?,body=?,date=? WHERE id=?").bind(t, body, date, id).run();
    else await env.DB.prepare("UPDATE posts SET title=?,body=?,date=?,image=? WHERE id=?").bind(t, body, date, img, id).run();
    return Response.json({ ok: true });
  }
  if (m === "DELETE") { await env.DB.prepare("DELETE FROM posts WHERE id=?").bind(id).run(); return Response.json({ ok: true }); }
  return new Response("Method not allowed", { status: 405 });
}
