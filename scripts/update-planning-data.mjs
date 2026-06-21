import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const workspace = process.cwd();
const outputPath = path.join(workspace, "src", "planning-data.js");
const linkCachePath = path.join(workspace, "data", "planning-link-cache.json");
const shouldEnrichLinks = process.argv.includes("--enrich-links");
const shouldEnrichReviews = process.argv.includes("--enrich-reviews");
const TERPECA_YEAR = 2025;
const TERPECA_PAGE = "https://terpeca.com/2025/";
const TERPECA_CSV = "https://terpeca.com/data/finalists-2025.csv";
const ESCAPEROOMERS_INDEX = "https://escaperoomers.de/ranked-playlists/";
const USER_AGENT = "Tools2EscApp planning catalog updater (personal trip planning)";
const EXCLUDED_SEARCH_HOSTS = [
  "escaperoomers.de",
  "escape-maniac.com",
  "morty.app",
  "terpeca.com",
  "tripadvisor.",
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "lock.me",
  "escapetalk.nl",
  "the-escapers.com",
  "worldofescapes.",
  "everyescaperoom.",
  "escapethereview.",
  "google.",
];

await main();

async function main() {
  const [terpecaHtml, terpecaCsv, escapeRoomersIndex, seedLinks, cachedLinks] = await Promise.all([
    fetchText(TERPECA_PAGE),
    fetchText(TERPECA_CSV),
    fetchText(ESCAPEROOMERS_INDEX),
    loadSeedLinks(),
    readJson(linkCachePath, {}),
  ]);

  const terpeca = parseTerpeca(terpecaCsv, terpecaHtml);
  const rankedListUrls = extractRankedListUrls(escapeRoomersIndex);
  const listPages = await mapLimit(rankedListUrls, 5, async (url) => {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) return null;
      return { url: response.url, html: await response.text() };
    } catch (error) {
      console.warn("Could not fetch EscapeRoomers list", url, error.message);
      return null;
    }
  });

  const uniqueListPages = [...new Map(listPages.filter(Boolean).map((page) => [page.url, page])).values()];
  const escapeRoomers = uniqueListPages
    .flatMap((page) => parseEscapeRoomersList(page.html, page.url))
    .filter((room) => room.rank <= 20);

  applyKnownWebsites(escapeRoomers, terpeca, seedLinks, cachedLinks);
  if (shouldEnrichReviews) {
    await enrichWebsitesFromReviews(escapeRoomers, cachedLinks);
    await fs.mkdir(path.dirname(linkCachePath), { recursive: true });
    await fs.writeFile(linkCachePath, JSON.stringify(cachedLinks, null, 2) + "\n");
  }
  if (shouldEnrichLinks) {
    await enrichOfficialWebsites(escapeRoomers, cachedLinks);
    await fs.mkdir(path.dirname(linkCachePath), { recursive: true });
    await fs.writeFile(linkCachePath, JSON.stringify(cachedLinks, null, 2) + "\n");
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    terpecaYear: TERPECA_YEAR,
    sources: {
      terpeca: TERPECA_PAGE,
      escaperoomers: ESCAPEROOMERS_INDEX,
    },
    terpeca: terpeca.sort((a, b) => a.rank - b.rank),
    escaperoomers: escapeRoomers.sort((a, b) =>
      a.region.localeCompare(b.region, "en") || a.rank - b.rank || a.title.localeCompare(b.title, "en")),
  };

  await fs.writeFile(outputPath, "window.T2E_PLANNING_DATA = " + JSON.stringify(payload, null, 2) + ";\n");
  console.log(JSON.stringify({
    output: outputPath,
    terpeca: payload.terpeca.length,
    escaperoomers: payload.escaperoomers.length,
    lists: new Set(payload.escaperoomers.map((room) => room.region)).size,
    officialLinks: payload.escaperoomers.filter((room) => room.website).length,
  }, null, 2));
}

async function enrichWebsitesFromReviews(rooms, cachedLinks) {
  const unresolvedGroups = new Map();
  rooms.filter((room) => !room.website).forEach((room) => {
    const key = websiteCacheKey(room);
    if (!unresolvedGroups.has(key)) unresolvedGroups.set(key, room);
  });
  const groups = [...unresolvedGroups.entries()];
  let completed = 0;
  await mapLimit(groups, 5, async ([key, room]) => {
    try {
      const source = await fetchText(room.detailUrl);
      const website = extractReviewWebsite(source);
      if (website) cachedLinks[key] = website;
    } catch (error) {
      console.warn("Review lookup failed", room.detailUrl, error.message);
    }
    completed += 1;
    if (completed % 50 === 0) console.log("Review lookups", completed, "/", groups.length);
  });
  applyCachedWebsites(rooms, cachedLinks);
}

function extractReviewWebsite(source) {
  const patterns = [
    /<a[^>]+href=["']([^"']+)["'][^>]+title=["']Escape Room Host["']/i,
    /This is a review[\s\S]{0,700}?offered by\s*<a[^>]+href=["']([^"']+)["']/i,
    /<b>\s*<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]{0,150}?<\/a>\s*<\/b>[\s\S]{0,100}?(?:USA|Germany|France|Spain|Belgium|Netherlands|Austria|Canada|United Kingdom)/i,
  ];
  for (const pattern of patterns) {
    const value = decodeHtml(source.match(pattern)?.[1] || "");
    if (!value) continue;
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      if (!EXCLUDED_SEARCH_HOSTS.some((excluded) => host.includes(excluded))) return url.href;
    } catch {
      // Ignore malformed external links.
    }
  }
  return "";
}

function applyCachedWebsites(rooms, cachedLinks) {
  rooms.forEach((room) => {
    if (!room.website) room.website = cachedLinks[websiteCacheKey(room)] || "";
  });
}

function parseTerpeca(csvSource, htmlSource) {
  const rows = parseCsv(csvSource);
  const headings = rows.shift() || [];
  const columns = Object.fromEntries(headings.map((heading, index) => [heading.trim(), index]));
  const details = parseTerpecaDetails(htmlSource);

  return rows
    .map((row) => {
      const rank = toNumber(row[columns.Rank]);
      if (!rank || rank > 100) return null;
      const location = clean(row[columns.Location]);
      const coordinates = clean(row[columns.Coordinates]).split(",").map(Number);
      const detail = details.get(rank) || {};
      return {
        id: "terpeca-" + TERPECA_YEAR + "-" + slug(row[columns["Game Title"]]) + "-" + rank,
        source: "terpeca",
        rank,
        year: TERPECA_YEAR,
        title: clean(row[columns["Game Title"]]),
        provider: clean(row[columns.Company]),
        city: clean(location.split(",")[0]),
        country: clean(row[columns.Country]),
        region: clean(row[columns.Country]),
        coords: coordinates.length === 2 && coordinates.every(Number.isFinite) ? coordinates : null,
        duration: detail.duration || null,
        scare: detail.scare,
        scareScale: 5,
        scareLabel: detail.scareLabel || "",
        website: clean(row[columns.URL]),
        detailUrl: TERPECA_PAGE + "#collapseR" + rank,
        sourceUrl: TERPECA_PAGE,
      };
    })
    .filter(Boolean);
}

function parseTerpecaDetails(source) {
  const positions = [...source.matchAll(/id="headingR(\d+)"/g)]
    .map((match) => ({ rank: Number(match[1]), index: match.index }));
  const details = new Map();

  positions.forEach((position, index) => {
    const block = source.slice(position.index, positions[index + 1]?.index || source.length);
    const durationLabel = extractAfterIcon(block, "icon-clock3");
    const scareLabel = extractAfterIcon(block, "icon-eye2");
    details.set(position.rank, {
      duration: toNumber(durationLabel.match(/\d+/)?.[0]),
      scare: terpecaScareValue(scareLabel),
      scareLabel: clean(stripTags(scareLabel)),
    });
  });
  return details;
}

function extractAfterIcon(block, iconClass) {
  const match = block.match(new RegExp(iconClass + "[\\s\\S]{0,500}?<strong>([\\s\\S]*?)<\\/strong>", "i"));
  return match?.[1] || "";
}

function terpecaScareValue(label) {
  const value = normalize(stripTags(label));
  if (!value || value.includes("no horror")) return 0;
  if (value.includes("terrifying") || value.includes("extreme")) return 5;
  if (value.includes("very scary") || value.includes("horror")) return 4;
  if (value.includes("scary")) return 3;
  if (value.includes("spooky") || value.includes("creepy")) return 2;
  return 1;
}

function extractRankedListUrls(source) {
  const urls = new Set();
  for (const match of source.matchAll(/href=["']([^"']*ranked-playlist[^"']*)["']/gi)) {
    try {
      const url = new URL(decodeHtml(match[1]), ESCAPEROOMERS_INDEX);
      if (url.hostname !== "escaperoomers.de") continue;
      if (url.pathname.replace(/\/+$/, "") === "/ranked-playlists") continue;
      urls.add(url.href);
    } catch {
      // Ignore malformed links in WordPress widgets.
    }
  }
  return [...urls];
}

function parseEscapeRoomersList(source, sourceUrl) {
  const table = source.match(/<table[^>]*>([\s\S]*?)<\/table>/i)?.[1];
  if (!table) return [];
  const title = clean(stripTags(source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ""));
  const region = title.replace(/^Ranked Playlist\s*/i, "").trim() || regionFromUrl(sourceUrl);
  const country = countryForEscapeRoomersRegion(region, sourceUrl);
  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1);

  return rows.map((rowMatch) => {
    const cells = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => match[1]);
    const rank = toNumber(stripTags(cells[0] || ""));
    if (!rank || rank > 20 || cells.length < 6) return null;
    const companyLocation = clean(stripTags(cells[1]));
    const companyMatch = companyLocation.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    const provider = clean(companyMatch?.[1] || companyLocation);
    const city = clean(companyMatch?.[2] || "");
    const detailUrl = decodeHtml(cells[2].match(/href=["']([^"']+)["']/i)?.[1] || sourceUrl);
    const titleText = clean(stripTags(cells[2]));
    const scare = toNumber(stripTags(cells[3]));
    const duration = toNumber(stripTags(cells[5]));

    return {
      id: "er-" + slug(region) + "-" + rank + "-" + slug(titleText),
      source: "escaperoomers",
      rank,
      title: titleText,
      provider,
      city,
      country,
      region,
      coords: null,
      duration,
      scare,
      scareScale: 10,
      scareLabel: Number.isFinite(scare) ? scare + "/10" : "",
      actors: normalize(stripTags(cells[4])) === "yes",
      website: "",
      detailUrl: new URL(detailUrl, sourceUrl).href,
      sourceUrl,
    };
  }).filter(Boolean);
}

function countryForEscapeRoomersRegion(region, sourceUrl) {
  const key = normalize(region + " " + sourceUrl);
  const mappings = [
    [["austria"], "Austria"],
    [["belgium"], "Belgium"],
    [["sofia", "bulgaria"], "Bulgaria"],
    [["quebec", "canada"], "Canada"],
    [["croatia"], "Croatia"],
    [["prague", "czech"], "Czech Republic"],
    [["scandinavia"], "Scandinavia"],
    [["tallinn", "estonia"], "Estonia"],
    [["finland"], "Finland"],
    [["annecy", "lyon", "montpellier", "paris", "strassbourg", "strasbourg", "toulouse", "/france/"], "France"],
    [["baden", "bavaria", "berlin", "bremen", "hamburg", "hesse", "saxony", "rhine", "germany"], "Germany"],
    [["athens", "thessaloniki", "greece"], "Greece"],
    [["budapest", "hungary"], "Hungary"],
    [["ireland"], "Ireland"],
    [["israel"], "Israel"],
    [["rome", "milan", "italy"], "Italy"],
    [["pristina", "kosovo"], "Kosovo"],
    [["riga", "latvia"], "Latvia"],
    [["netherlands"], "Netherlands"],
    [["skopje", "macedonia"], "North Macedonia"],
    [["poland"], "Poland"],
    [["portugal"], "Portugal"],
    [["bucharest", "romania"], "Romania"],
    [["belgrade", "serbia"], "Serbia"],
    [["bratislava", "slovakia"], "Slovakia"],
    [["slovenia"], "Slovenia"],
    [["barcelona", "madrid", "north spain", "south east spain", "/spain/"], "Spain"],
    [["switzerland"], "Switzerland"],
    [["england", "united kingdom"], "United Kingdom"],
    [["golf south", "gulf south", "south atlantic", "west coast", "/usa/"], "United States"],
  ];
  return mappings.find(([needles]) => needles.some((needle) => key.includes(needle)))?.[1] || region;
}

function regionFromUrl(value) {
  return value.split("/").filter(Boolean).pop()
    .replace(/^ranked-playlist-/, "")
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function applyKnownWebsites(rooms, terpeca, seedLinks, cachedLinks) {
  const titleLinks = new Map();
  const providerLinks = new Map();
  [...terpeca, ...seedLinks].forEach((entry) => {
    if (!entry.website) return;
    titleLinks.set(normalize(entry.title), entry.website);
    if (!providerLinks.has(normalize(entry.provider))) providerLinks.set(normalize(entry.provider), entry.website);
  });

  rooms.forEach((room) => {
    const cacheKey = websiteCacheKey(room);
    room.website = cachedLinks[cacheKey]
      || titleLinks.get(normalize(room.title))
      || providerLinks.get(normalize(room.provider))
      || "";
    const terpecaMatch = terpeca.find((entry) =>
      normalize(entry.title) === normalize(room.title)
      || (normalize(entry.provider) === normalize(room.provider) && fuzzyIncludes(entry.title, room.title)));
    if (terpecaMatch?.coords) room.coords = terpecaMatch.coords;
  });
}

async function enrichOfficialWebsites(rooms, cachedLinks) {
  const unresolvedGroups = new Map();
  rooms.filter((room) => !room.website).forEach((room) => {
    const key = websiteCacheKey(room);
    if (!unresolvedGroups.has(key)) unresolvedGroups.set(key, room);
  });

  let completed = 0;
  for (const [key, room] of unresolvedGroups) {
    try {
      const query = [room.provider, room.city, room.title, "escape room"].filter(Boolean).join(" ");
      const result = await searchOfficialWebsite(query);
      if (result) {
        cachedLinks[key] = result;
        rooms.filter((entry) => websiteCacheKey(entry) === key).forEach((entry) => {
          entry.website = result;
        });
      }
    } catch (error) {
      console.warn("Website lookup failed", room.provider, error.message);
    }
    completed += 1;
    if (completed % 25 === 0) console.log("Website lookups", completed, "/", unresolvedGroups.size);
    await sleep(450);
  }
}

async function searchOfficialWebsite(query) {
  const url = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query);
  const source = await fetchText(url);
  const results = [...source.matchAll(/result__a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      const redirect = decodeHtml(match[1]);
      const target = new URL(redirect, "https://duckduckgo.com").searchParams.get("uddg") || redirect;
      return { url: target, title: clean(stripTags(match[2])) };
    })
    .filter((result) => {
      try {
        const host = new URL(result.url).hostname.toLowerCase();
        return !EXCLUDED_SEARCH_HOSTS.some((excluded) => host.includes(excluded));
      } catch {
        return false;
      }
    });
  return results[0]?.url || "";
}

async function loadSeedLinks() {
  const source = await fs.readFile(path.join(workspace, "src", "seed-data.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const seed = context.window.T2E_SEED_DATA || {};
  return (seed.wishList || [])
    .filter((entry) => entry.link)
    .map((entry) => ({ title: entry.title, provider: entry.provider, website: entry.link }));
}

function websiteCacheKey(room) {
  return normalize(room.provider) + "|" + normalize(room.city);
}

function fuzzyIncludes(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  return a.length >= 5 && b.length >= 5 && (a.includes(b) || b.includes(a));
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(response.status + " " + response.statusText + " for " + url);
  return response.text();
}

async function mapLimit(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]*>/g, " "));
}

function decodeHtml(value) {
  const entities = {
    amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
    auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß",
    eacute: "é", egrave: "è", ecirc: "ê", aacute: "á", iacute: "í", oacute: "ó", uacute: "ú",
  };
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name] ?? match);
}

function clean(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function slug(value) {
  return normalize(value).replace(/\s+/g, "-").slice(0, 80) || "room";
}

function toNumber(value) {
  const number = Number(String(value || "").replace(",", ".").match(/-?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? number : null;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
