import { isAdmin } from "../../../lib/auth.js";
export async function onRequest({ request, env }) {
  if (!(await isAdmin(request, env))) return new Response("Forbidden", { status: 403 });
  const m = request.method, url = new URL(request.url), id = url.searchParams.get("id");
  if (m !== "GET") { // CSRF protection: same-origin requests with a JSON content type only
    const o = request.headers.get("Origin");
    if (o && new URL(o).host !== url.host) return new Response("Forbidden", { status: 403 });
    if (m !== "DELETE" && !(request.headers.get("Content-Type") || "").includes("application/json")) return new Response("Bad request", { status: 415 });
  }
  if (m === "GET") {
    const { results } = await env.DB.prepare("SELECT id,title,body,date FROM posts ORDER BY id DESC").all();
    return Response.json(results, { headers: { "Cache-Control": "no-store" } });
  }
  if (m === "POST" || m === "PUT") {
    const b = await request.json();
    const t = String(b.title || "").trim().slice(0, 200), body = String(b.body || "").slice(0, 50000);
    if (!t) return new Response("Title required", { status: 400 });
    if (m === "POST") await env.DB.prepare("INSERT INTO posts(title,body,date) VALUES(?,?,date('now'))").bind(t, body).run();
    else await env.DB.prepare("UPDATE posts SET title=?,body=? WHERE id=?").bind(t, body, id).run();
    return Response.json({ ok: true });
  }
  if (m === "DELETE") { await env.DB.prepare("DELETE FROM posts WHERE id=?").bind(id).run(); return Response.json({ ok: true }); }
  return new Response("Method not allowed", { status: 405 });
}
