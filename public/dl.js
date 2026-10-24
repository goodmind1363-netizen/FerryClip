const YQ = ["360p", "720p", "1080p"];
let YL = "";
async function getLinks(v, fmt) {
  let tk = "";
  if (TS) { tk = window.turnstile ? turnstile.getResponse() : ""; if (!tk) return { error: "Please complete the security check first." }; }
  try {
    const r = await fetch("/api/resolve?url=" + encodeURIComponent(v) + (fmt ? "&format=" + fmt : ""), { headers: { "X-TS": tk } });
    const d = await r.json();
    if (TS && window.turnstile) turnstile.reset();
    return d;
  } catch (e) { return { error: "Something went wrong. Please try again." }; }
}
function showLinks(d, el, q) {
  const ls = (d.links || []).map(x => typeof x === "string" ? { url: x, label: "" } : x).filter(x => /^https?:/.test(x.url));
  el.innerHTML = (d.thumbnail ? `<img class="th" loading="lazy" referrerpolicy="no-referrer" src="${esc(d.thumbnail)}" alt="">` : "") + (d.title ? `<div>${esc(d.title)}</div>` : "") +
    (ls.length ? `<div class="dls">${ls.map(x => { const l = x.label === "Download" && q ? q : x.label; return `<a class="gbtn" href="${esc(x.url)}" target="_blank" rel="noopener nofollow" download>Download${l && l !== "Download" ? " · " + esc(l) : ""}</a>`; }).join("")}</div>` : `<div>${esc(d.error || "No downloadable file was found for this link.")}</div>`);
}
window.dl = async function () {
  const v = $("lk").value.trim(), t = DL.includes(cur) ? cur : tab, R = $("res");
  let ok = false;
  try { const h = new URL(v).hostname; ok = HOST[t].some(x => h.endsWith(x)); } catch (e) {}
  if (!ok) { R.textContent = "Please paste a valid " + PL[t] + " link."; return; }
  if (t === "youtube") {
    YL = v;
    R.innerHTML = `<div>Choose a quality:</div><div class="dls">${YQ.map(q => `<button class="gbtn" onclick="dlq('${q}')">${q}</button>`).join("")}</div><div id="yr" style="margin-top:12px"></div>`;
    return;
  }
  R.textContent = "Working on it...";
  showLinks(await getLinks(v), R);
};
window.dlq = async function (q) {
  const el = $("yr"); el.textContent = "Working on it...";
  showLinks(await getLinks(YL, q), el, q);
};
