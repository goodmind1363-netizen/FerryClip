export async function onRequestGet({ request }) {
  const o = new URL(request.url).origin;
  return new Response(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${o}/sitemap.xml\n`, { headers: { "content-type": "text/plain", "Cache-Control": "public, max-age=3600" } });
}
