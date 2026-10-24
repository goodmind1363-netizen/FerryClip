// Public list: only short excerpts, so the page stays light however many posts exist.
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT id,title,substr(body,1,160) AS body,date FROM posts ORDER BY id DESC LIMIT 100").all();
  return Response.json(results, { headers: { "Cache-Control": "public, max-age=60" } });
}
