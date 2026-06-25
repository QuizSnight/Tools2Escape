const MAX_RESPONSE_BYTES = 2_500_000;
const REQUEST_TIMEOUT_MS = 15000;
const USER_AGENT = "Tools2EscApp room importer (+https://tools2-escape.vercel.app)";

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ ok: false, error: "Nur POST ist erlaubt." });
    return;
  }

  try {
    const body = typeof request.body === "string"
      ? JSON.parse(request.body || "{}")
      : request.body || {};
    const targetUrl = normalizeTargetUrl(body.url);

    if (!targetUrl) {
      response.status(400).json({ ok: false, error: "Bitte eine gültige http(s)-URL angeben." });
      return;
    }

    if (isBlockedHost(targetUrl.hostname)) {
      response.status(400).json({ ok: false, error: "Diese Adresse kann aus Sicherheitsgründen nicht importiert werden." });
      return;
    }

    const result = await fetchWebsite(targetUrl.href);
    response.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
    response.status(200).json({ ok: true, ...result });
  } catch (error) {
    response.status(502).json({
      ok: false,
      error: error.message || "Website konnte nicht gelesen werden.",
    });
  }
};

function normalizeTargetUrl(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

function isBlockedHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "0.0.0.0" || host === "::1") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  const private172 = host.match(/^172\.(\d{1,2})\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return true;
  return /^169\.254\./.test(host);
}

async function fetchWebsite(url) {
  const primary = await fetchSingleWebsite(url);
  const currentUrls = [url, primary.finalUrl].filter(Boolean).map((entry) => canonicalCompareUrl(new URL(entry)));
  const relatedUrls = discoverRelatedUrls(primary.html, new URL(primary.finalUrl || url))
    .filter((entry) => !currentUrls.includes(canonicalCompareUrl(new URL(entry))));
  const related = [];

  for (const relatedUrl of relatedUrls.slice(0, 5)) {
    try {
      related.push(await fetchSingleWebsite(relatedUrl));
    } catch {
      // Related pages are helpful but not required for the import.
    }
  }
  const filteredRelated = related.filter((entry) =>
    !currentUrls.includes(canonicalCompareUrl(new URL(entry.finalUrl || entry.url))));

  return {
    ...primary,
    html: combineWebsiteHtml([primary, ...filteredRelated]),
    relatedUrls: filteredRelated.map((entry) => entry.finalUrl || entry.url),
  };
}

async function fetchSingleWebsite(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const fetched = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8,fr;q=0.7,nl;q=0.6",
        "user-agent": USER_AGENT,
      },
    });

    const contentLength = Number(fetched.headers.get("content-length") || 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      throw new Error("Die Website ist zu groß für den Import.");
    }

    if (!fetched.ok) {
      throw new Error(`Website antwortet mit ${fetched.status}.`);
    }

    const contentType = fetched.headers.get("content-type") || "";
    const buffer = await fetched.arrayBuffer();
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error("Die Website ist zu groß für den Import.");
    }

    return {
      source: "server",
      url,
      finalUrl: fetched.url || url,
      contentType,
      html: new TextDecoder("utf-8").decode(buffer),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function discoverRelatedUrls(html, currentUrl) {
  const urls = new Map();
  const add = (value) => {
    try {
      const url = new URL(value, currentUrl);
      if (!["http:", "https:"].includes(url.protocol)) return;
      if (url.hostname.replace(/^www\./, "") !== currentUrl.hostname.replace(/^www\./, "")) return;
      url.hash = "";
      if (canonicalCompareUrl(url) === canonicalCompareUrl(currentUrl)) return;
      if (/\/wp-content\//i.test(url.pathname)) return;
      if (/\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|pdf|zip)$/i.test(url.pathname)) return;
      urls.set(url.href, relevanceScore(url));
    } catch {
      // Ignore malformed links.
    }
  };

  if (currentUrl.pathname !== "/") add(`${currentUrl.origin}/`);
  [...String(html || "").matchAll(/\bhref=["']([^"']+)["']/gi)].forEach((match) => {
    const href = match[1];
    if (!href || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    add(href);
  });

  return [...urls.entries()]
    .filter(([, score]) => score >= 40)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([url]) => url);
}

function canonicalCompareUrl(url) {
  const clone = new URL(url.href);
  clone.hash = "";
  clone.pathname = clone.pathname.replace(/\/+$/, "") || "/";
  return clone.href;
}

function relevanceScore(url) {
  const value = `${url.pathname} ${url.search} ${url.hash}`.toLowerCase();
  let score = url.pathname === "/" ? 60 : 0;
  if (/(faq|fragen|antwort|question)/.test(value)) score += 80;
  if (/(preis|preise|price|pricing|gutschein|voucher)/.test(value)) score += 70;
  if (/(kontakt|contact|anfahrt|adresse|address|location|standort)/.test(value)) score += 70;
  if (/(escape-room|rooms?|spiele|games?)/.test(value)) score += 15;
  return score;
}

function combineWebsiteHtml(pages) {
  return pages
    .map((page, index) => [
      index ? `<!-- Tools2EscApp related page: ${page.finalUrl || page.url} -->` : "",
      page.html,
    ].filter(Boolean).join("\n"))
    .join("\n\n");
}
