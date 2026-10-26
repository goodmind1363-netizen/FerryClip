const PAGES = ["", "tiktok-video-downloader", "instagram-reels-downloader", "youtube-video-downloader", "video-to-mp3-converter", "influencer-price-calculator", "engagement-rate-calculator", "fake-follower-checker", "blog", "faq", "about", "contact", "privacy", "terms", "dmca"];
export async function onRequestGet({ request, env }) {
  const o = new URL(request.url).origin;
  const { results } = await env.DB.prepare("SELECT id,date FROM posts WHERE date<=date('now') ORDER BY id DESC LIMIT 1000").all();
  const u = PAGES.map(s => `<url><loc>${o}/${s}</loc></url>`).concat(results.map(p => `<url><loc>${o}/blog/${p.id}</loc><lastmod>${p.date}</lastmod></url>`));
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.join("")}</urlset>`, { headers: { "content-type": "application/xml", "Cache-Control": "public, max-age=3600" } });
}
