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
      finalUrl: fetched.url || url,
      contentType,
      html: new TextDecoder("utf-8").decode(buffer),
    };
  } finally {
    clearTimeout(timeout);
  }
}
