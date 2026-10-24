window.dl = async function () {
  const v = $("lk").value.trim(), t = DL.includes(cur) ? cur : tab, R = $("res");
  let ok = false;
  try { const h = new URL(v).hostname; ok = HOST[t].some(x => h.endsWith(x)); } catch (e) {}
  if (!ok) { R.textContent = "Please paste a valid " + PL[t] + " link."; return; }
  let tk = "";
  if (TS) { tk = window.turnstile ? turnstile.getResponse() : ""; if (!tk) { R.textContent = "Please complete the security check first."; return; } }
  R.textContent = "Working on it...";
  try {
    const r = await fetch("/api/resolve?url=" + encodeURIComponent(v), { headers: { "X-TS": tk } }), d = await r.json();
    const ls = (d.links || []).map(x => typeof x === "string" ? { url: x, label: "" } : x).filter(x => /^https?:/.test(x.url));
    R.innerHTML = (d.thumbnail ? `<img class="th" loading="lazy" referrerpolicy="no-referrer" src="${esc(d.thumbnail)}" alt="">` : "") + (d.title ? `<div>${esc(d.title)}</div>` : "") +
      (ls.length ? `<div class="dls">${ls.map(x => `<a class="gbtn" href="${esc(x.url)}" target="_blank" rel="noopener nofollow" download>Download${x.label && x.label !== "Download" ? " · " + esc(x.label) : ""}</a>`).join("")}</div>` : `<div>${esc(d.error || "No downloadable file was found for this link.")}</div>`);
  } catch (e) { R.textContent = "Something went wrong. Please try again."; }
  if (TS && window.turnstile) turnstile.reset();
};
