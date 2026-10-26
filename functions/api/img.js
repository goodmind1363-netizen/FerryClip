export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id");
  const p = await env.DB.prepare("SELECT image FROM posts WHERE id=?").bind(id).first();
  const m = p && p.image && p.image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return new Response("Not found", { status: 404 });
  const bin = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  return new Response(bin, { headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" } });
}
