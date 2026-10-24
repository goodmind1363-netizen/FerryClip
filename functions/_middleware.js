const M = {
  "/tiktok-video-downloader": ["TikTok Video Downloader - Free and Fast | Ferryclip", "Download public TikTok videos online for free. Paste the link, press Download and save the file."],
  "/instagram-reels-downloader": ["Instagram Reels Downloader - Free | Ferryclip", "Save public Instagram Reels online for free. Paste the link and download in seconds."],
  "/youtube-video-downloader": ["YouTube Video Downloader - Free | Ferryclip", "Paste a YouTube link and download videos you own or have permission to use."],
  "/video-to-mp3-converter": ["Video to MP3 Converter - Free, in Your Browser | Ferryclip", "Convert video to MP3 in your browser. Files are never uploaded."],
  "/influencer-price-calculator": ["Influencer Price Calculator | Ferryclip", "Estimate a fair price per sponsored post from followers and engagement rate."],
  "/engagement-rate-calculator": ["Engagement Rate Calculator for Instagram and TikTok | Ferryclip", "Calculate engagement rate from followers, likes, comments and shares."],
  "/fake-follower-checker": ["Fake Follower Checker | Ferryclip", "Estimate the risk of fake followers from a few public numbers."],
  "/blog": ["Blog | Ferryclip", "Guides and tips for creators: backups, engagement, copyright and more."],
  "/faq": ["FAQ | Ferryclip", "Answers to common questions about Ferryclip."],
  "/about": ["About | Ferryclip", "About Ferryclip and what we do."],
  "/contact": ["Contact | Ferryclip", "Contact the Ferryclip team."],
  "/privacy": ["Privacy Policy | Ferryclip", "How Ferryclip handles data and cookies."],
  "/terms": ["Terms of Use | Ferryclip", "Terms for using Ferryclip."],
  "/dmca": ["Copyright / DMCA | Ferryclip", "How to report a copyright concern."]
};
export async function onRequest({ request, next }) {
  const res = await next();
  const u = new URL(request.url), path = u.pathname.replace(/\/$/, ""), m = M[path];
  if (!(res.headers.get("content-type") || "").includes("text/html") || path.startsWith("/admin") || path.startsWith("/blog/")) return res;
  const rw = new HTMLRewriter().on("body", { element(el) { el.append('<script src="/dl.js" defer></script>', { html: true }); } });
  if (m) rw
    .on("title", { element(el) { el.setInnerContent(m[0]); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute("content", m[1]); } })
    .on("head", { element(el) { el.append(`<link rel="canonical" href="${u.origin}${path}">`, { html: true }); } });
  return rw.transform(res);
}
