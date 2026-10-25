export async function onRequestGet({ env }) {
  return Response.json({ tsKey: env.TS_SITEKEY || "" }, { headers: { "Cache-Control": "public, max-age=300" } });
}
