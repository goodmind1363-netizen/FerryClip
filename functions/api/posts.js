export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT id,title,substr(body,1,160) AS body,date,(image IS NOT NULL) AS img FROM posts WHERE date<=date('now') ORDER BY date DESC,id DESC LIMIT 100").all();
  return Response.json(results, { headers: { "Cache-Control": "public, max-age=60" } });
}
