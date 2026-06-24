import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const rootDir = process.cwd();
const config = await readAppConfig();
const planningData = await readPlanningData();
const dryRun = process.argv.includes("--dry-run");

const COUNTRY_LABELS_DE = {
  Austria: "Österreich",
  Belgium: "Belgien",
  Bulgaria: "Bulgarien",
  Canada: "Kanada",
  Croatia: "Kroatien",
  "Czech Republic": "Tschechien",
  Denmark: "Dänemark",
  Estonia: "Estland",
  Finland: "Finnland",
  France: "Frankreich",
  Germany: "Deutschland",
  Greece: "Griechenland",
  Hungary: "Ungarn",
  Ireland: "Irland",
  Italy: "Italien",
  Luxembourg: "Luxemburg",
  Netherlands: "Niederlande",
  Poland: "Polen",
  Portugal: "Portugal",
  Romania: "Rumänien",
  Spain: "Spanien",
  Switzerland: "Schweiz",
  "United Kingdom": "UK",
  "United States": "USA",
};

const REGION_LABELS_DE = {
  Belgium: "Belgien",
  Netherlands: "Niederlande",
  "North Rhine-Westphalia": "NRW",
  "Baden-Wuerttemberg": "Baden-Württemberg",
  Hamburg: "Hamburg",
  "Czech Republic": "Tschechien",
  Finland: "Finnland",
  "Island of Ireland": "Irland",
  Portugal: "Portugal",
  Poland: "Polen",
  Romania: "Rumänien",
  Spain: "Spanien",
};

const REGION_SHEET_NAMES = {
  DE: "DE",
  Athen: "Athen",
  NRW: "NRW",
  HH: "Hamburg (HH)",
  BENELUX: "BeNeLux",
  SPAIN: "Spanien",
  POLAND: "Polen",
  HUNGARY: "Ungarn",
  CZECHIA: "Tschechien",
  FRANCE: "Frankreich",
  IRELAND: "Irland",
  UK: "UK",
  PORTUGAL: "Portugal",
  ITALY: "Italien",
  FINLAND: "Finnland",
  CROATIA: "Kroatien",
};

const GENERIC_PLANNING_TITLE_KEYS = new Set([
  "asylum",
  "cabininthwoods",
  "cabininthewoods",
  "inferno",
  "orphanage",
  "theasylum",
  "theorphanage",
  "wonderland",
]);

const MANUAL_PLAYED_MATCHES = [
  { planningTitle: "Molly's Game", playedTitle: "Mollys Game" },
  { planningTitle: "Kuriosum: Artifact of Darkness", playedTitle: "Kuriosum" },
  { planningTitle: "KURIOSUM - ARTEFAKT DER FINSTERNIS", playedTitle: "Kuriosum" },
];

const WISH_INFO = [
  {
    match: ["Monster Mashers (Dark Mode)", "Tales of Torchdale"],
    country: "Belgien",
    link: "https://torchdale.be/en/monster-mashers",
    info: ["Dauer 150 Min. (TERPECA; EscapeRoomers listet 120 Min.)", "Schauspieler: ja"],
  },
  {
    match: ["The Movies 2.0", "The Push"],
    link: "https://www.pushpushpush.be/rooms/the-movies-experience/",
    info: ["Dauer 100 Min."],
  },
  {
    match: ["Houdinis Workshop", "The Push"],
    title: "Houdini's Workshop",
    link: "https://www.pushpushpush.be/rooms/spoilers/houdini/",
    info: ["Dauer ca. 100 Min."],
  },
  {
    match: ["Qualen", "Geheimdepot"],
    provider: "Mining Adventure World",
    link: "https://www.miningadventureworld.de/dorsten/escape-rooms/qualen",
    info: ["Dauer 90 Min.", "Schauspieler: ja"],
  },
  {
    match: ["Kammerflimmern", "Geheimdepot"],
    provider: "Mining Adventure World",
    link: "https://lock.me/de/germany/nordrhein-westfalen/dorsten/escape-room/geheimdepot/11587-kammerflimmern-der-engel-des-todes",
    info: ["Dauer 120 Min."],
  },
  {
    match: ["Gefangen im Schacht", "Geheimdepot"],
    provider: "Mining Adventure World",
    link: "https://www.miningadventureworld.de/dorsten/escape-rooms/gefangen-im-schacht",
    info: ["Dauer 90 Min.", "Schauspieler: ja"],
  },
  {
    match: ["Hotel der geheimnisvollen Uhren", "Geheimdepot"],
    provider: "Mining Adventure World",
    link: "https://www.miningadventureworld.de/dorsten/escape-rooms",
    info: ["Dauer 90 Min.", "Schauspiel im Hintergrund"],
  },
  {
    match: ["Countdown to Meltdown", "Adventure Team"],
    info: ["Dauer 60 Min."],
  },
  {
    match: ["Der Meister der Zeit", "Hidden"],
    info: ["Dauer 60 Min."],
  },
  {
    match: ["Der Goldene Schädel", "Hidden"],
    info: ["Dauer 60 Min."],
  },
  {
    match: ["Cabin in the Woods", "Team Breakout"],
    info: ["Dauer 60 Min."],
  },
  {
    match: ["Kapitän Flynn und der Schatz der Poseidon", "Exodus"],
    link: "https://www.exodus-hn.de/",
    info: ["Dauer 60 Min.", "Schauspieler: ja"],
  },
  {
    match: ["Das ewige Licht", "kleines Theater Herne"],
    link: "https://www.theater-herne.de/eigenproduktion/theater-escape-das-ewige-licht/",
    info: ["Dauer 60 Min.", "Theater-Escape"],
  },
  {
    match: ["The Sacrifice", "EscapeAll"],
    provider: "Disappear Escape Rooms",
    link: "https://www.escapeall.gr/en/EscapeRoom/Details/the-sacrifice",
    info: ["Dauer 110 Min.", "Schauspieler: ja"],
  },
  {
    match: ["Soup du Jour", "Rock City Escape Room"],
    link: "https://rockcityescape.nl/en/soup-du-jour-eng/",
    info: ["Dauer 75 Min.", "keine Live-Schauspieler"],
  },
  {
    match: ["What happened to Eliza's heart?", "Logic Locks"],
    link: "https://www.logiclocks.com/secrets-of-elizas-heart",
    info: ["laut Anbieter geschlossen"],
  },
  {
    match: ["The Orphanage", "Dark Park"],
    provider: "DarkPark",
    city: "Zoetermeer",
    link: "https://www.darkpark.com/en/escape-rooms/the-orphanage/",
    info: ["Dauer 60 Min.", "keine Schauspieler"],
  },
  {
    match: ["Here I am", "Escape Room Katwijk"],
    link: "https://escaperoomkatwijk.com/en/here-i-am/",
    info: ["Dauer 65 Min.", "Schauspieler: Intro"],
  },
  {
    match: ["Wonderland", "Escape from Wonderland"],
    link: "https://www.escapefromwonderland.nl/en/",
    info: ["Dauer 60 Min. (70 Min. bei 2-3 Personen)"],
  },
  {
    match: ["Inferno", "Timed Adventures"],
    link: "https://timed-adventures.nl/english/",
    info: ["Dauer 65 Min. (70 Min. bei 2 Personen)"],
  },
  {
    match: ["Kamer 237", "Kamer 237"],
    provider: "Hotel Veloria",
    link: "https://hotelveloria.nl/en/escaperoom/kamer-237/",
    info: ["Dauer 70-75 Min."],
  },
  {
    match: ["De Concierge", "Kamer 237"],
    title: "De Conciërge",
    provider: "Hotel Veloria",
    link: "https://hotelveloria.nl/en/escaperoom/the-concierge/",
    info: ["Dauer 80 Min."],
  },
  {
    match: ["Lost and Found", "Kamer 237"],
    provider: "Hotel Veloria",
    link: "https://hotelveloria.nl/en/escaperoom/lost-and-found/",
    info: ["Dauer 80 Min."],
  },
  {
    match: ["The Asylum", "Silent Town"],
    link: "https://silenttown.nl/reserveren/",
    info: ["Dauer 90 Min.", "Schauspieler: ja"],
  },
  {
    match: ["Blackwell and the ancient order", "Silent Town"],
    title: "Blackwell and the Ancient Order",
    link: "https://silenttown.nl/",
  },
  {
    match: ["The Crimsons Recipe", "Escape Schijndel"],
    title: "The Crimson's Recipe",
    link: "https://escapeschijndel.nl/en/home-english/",
    info: ["Dauer 80 Min.", "keine Schauspieler"],
  },
  {
    match: ["House of Nowhere", "Skunx Escape Rooms"],
    link: "https://skunxescaperooms.com/products/escape-room-house-of-nowhere",
    info: ["Dauer 60 Min."],
  },
  {
    match: ["Sleep", "Down the hatch"],
    provider: "Down the Hatch",
    link: "https://www.down-the-hatch.nl/sleep/",
    info: ["Dauer 180 Min.", "Schauspieler: ja"],
  },
  {
    match: ["Zoltar spreekt", "Escape Cafe"],
    provider: "Escape Cafe Hilversum",
    link: "https://escapecafehilversum.nl/en/escaperooms/zoltar-speaks",
    info: ["Dauer 75 Min.", "Schauspieler: ja"],
  },
  {
    match: ["House of twisted minds", "Escape Room Amersfoort"],
    title: "House of Twisted Minds",
    link: "https://escaperoomamersfoort.nl/en/",
    info: ["Dauer 90 Min.", "Schauspieler: ja"],
  },
  {
    match: ["Expedition Bermuda", "One hour lockup"],
    provider: "One Hour Lockup",
    link: "https://www.onehourlockup.nl/en/",
    info: ["Dauer 80 Min."],
  },
  {
    match: ["botanist manor", "Escape rush"],
    title: "Botanist Manor",
    provider: "Escape Rush",
    country: "Belgien",
    link: "https://escaperush.com/botanist-manor-escape-game-brussels",
    info: ["Dauer 80 Min."],
  },
  {
    match: ["I can hear you", "entered"],
    title: "I Can Hear You",
    provider: "Entered",
    country: "Belgien",
    link: "https://entered.be/en/belevingen/i-can-hear-you/",
    info: ["Dauer 135 Min.", "Schauspieler: ja"],
  },
  {
    match: ["Abreville", "de gouden kooi"],
    title: "Arbreville",
    provider: "De Gouden Kooi",
    country: "Belgien",
    link: "https://www.degoudenkooi.be/en",
    info: ["Dauer ca. 70 Min."],
  },
  {
    match: ["Der Cocktail des Arztes", "Insomnia Corp"],
    link: "https://www.insomniacorp.com/el-coctel-del-doctor/",
    info: ["Dauer 60 Min.", "Schauspieler: ja"],
  },
];

const payload = await fetchPayload();
const allPlanningRooms = [...planningData.terpeca, ...planningData.escaperoomers];
const ambiguousTitles = buildAmbiguousTitleSet(allPlanningRooms);
const summary = enrichPayload(payload);

if (!dryRun) {
  await updatePayload(payload);
  if (config.googleSheetsWebhookUrl) await syncGoogleSheets(payload);
}

console.log(JSON.stringify({ dryRun, ...summary }, null, 2));

function enrichPayload(data) {
  const rankingByPlayedId = new Map();
  const rankingByWishId = new Map();
  const playedLinks = { ...(data.planningLinks || {}) };

  for (const room of allPlanningRooms) {
    const playedMatch = findManualPlayedMatch(room, data.played || []) || findPlanningMatch(room, data.played || []);
    if (playedMatch) {
      addRanking(rankingByPlayedId, playedMatch.id, room);
      playedLinks[room.id] = playedMatch.id;
      continue;
    }

    const wishMatch = findPlanningMatch(room, data.wishList || []);
    if (wishMatch) addRanking(rankingByWishId, wishMatch.id, room);
  }

  const wishInfoByKey = new Map();
  WISH_INFO.forEach((entry) => {
    wishInfoByKey.set(wishInfoKey(entry.match[0], entry.match[1]), entry);
    wishInfoByKey.set(wishInfoKey(entry.title || entry.match[0], entry.provider || entry.match[1]), entry);
  });
  let playedNotesUpdated = 0;
  let wishNotesUpdated = 0;
  let wishLinksUpdated = 0;
  let wishInfoUpdated = 0;
  let planningLinksUpdated = 0;

  data.played = (data.played || []).map((room) => {
    const additions = rankingNoteParts(rankingByPlayedId.get(room.id));
    if (!additions.length) return room;
    const notes = mergeManagedNotes(room.notes, { ranking: additions });
    if (notes !== clean(room.notes)) playedNotesUpdated += 1;
    return { ...room, notes };
  });

  data.wishList = (data.wishList || []).map((wish) => {
    const info = wishInfoByKey.get(wishInfoKey(wish.title, wish.provider));
    const ranking = rankingNoteParts(rankingByWishId.get(wish.id));
    const itemInfo = info?.info || [];
    let next = {
      ...wish,
      country: germanCountry(info?.country || wish.country),
    };

    if (info?.title) next.title = info.title;
    if (info?.provider) next.provider = info.provider;
    if (info?.city) next.city = info.city;
    if (info?.link && !sameUrl(next.link, info.link)) {
      next.link = info.link;
      wishLinksUpdated += 1;
    }

    const notes = mergeManagedNotes(next.notes, { ranking, info: itemInfo });
    if (notes !== clean(next.notes)) {
      next.notes = notes;
      wishNotesUpdated += 1;
    }
    if (info && (itemInfo.length || info.link || info.title || info.provider || info.city || info.country)) wishInfoUpdated += 1;
    return next;
  });

  for (const [planningId, playedId] of Object.entries(playedLinks)) {
    if (data.planningLinks?.[planningId] !== playedId) planningLinksUpdated += 1;
  }
  data.planningLinks = playedLinks;
  data.updatedAt = new Date().toISOString();

  return {
    playedNotesUpdated,
    wishNotesUpdated,
    wishLinksUpdated,
    wishInfoUpdated,
    planningLinksUpdated,
    playedRankingMatches: rankingByPlayedId.size,
    wishRankingMatches: rankingByWishId.size,
  };
}

function addRanking(map, entryId, room) {
  if (!map.has(entryId)) map.set(entryId, []);
  map.get(entryId).push(room);
}

function rankingNoteParts(rooms = []) {
  return rooms
    .sort((a, b) => sourceOrder(a.source) - sourceOrder(b.source) || a.rank - b.rank)
    .map((room) => {
      if (room.source === "terpeca") return `TERPECA ${room.year || planningData.terpecaYear} Platz ${room.rank}`;
      return `EscapeRoomers ${planningRegionLabel(room.region || room.country)} Platz ${room.rank}`;
    });
}

function sourceOrder(source) {
  return source === "terpeca" ? 0 : 1;
}

function mergeManagedNotes(notes, { ranking = [], info = [] }) {
  const base = stripManagedNotes(notes);
  const parts = [];
  if (base) parts.push(base);
  if (ranking.length) parts.push(`Ranking: ${unique(ranking).join("; ")}`);
  if (info.length) parts.push(`Info: ${unique(info).join("; ")}`);
  return parts.join(" | ");
}

function stripManagedNotes(notes) {
  return clean(notes)
    .split("|")
    .map(clean)
    .filter(Boolean)
    .filter((part) => !/^Ranking:/i.test(part))
    .filter((part) => !/^Info:/i.test(part))
    .filter((part) => !/^TERPECA\s+\d{4}\s*·\s*Platz/i.test(part))
    .filter((part) => !/^EscapeRoomers\s+.+Platz/i.test(part))
    .join(" | ");
}

function findPlanningMatch(room, entries) {
  const title = normalize(room.title);
  const provider = normalize(room.provider);
  const city = normalizeCity(room.city);
  if (!title) return null;

  const candidates = entries
    .map((entry) => ({ entry, score: planningTitleMatchScore(title, normalize(entry.title)) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!candidates.length) return null;

  const contextualMatch = candidates.find(({ entry }) => {
    const entryProvider = normalize(entry.provider);
    const entryCity = normalizeCity(entry.city);
    const roomCountry = normalize(germanCountry(room.country || room.region));
    const entryCountry = normalize(germanCountry(entry.country || ""));
    if (entryCountry && roomCountry && entryCountry !== roomCountry) return false;
    const providerMatches = provider && entryProvider && (
      provider === entryProvider
      || (provider.length >= 5 && entryProvider.length >= 5 && (provider.includes(entryProvider) || entryProvider.includes(provider)))
    );
    const cityMatches = city && entryCity && city === entryCity;
    return providerMatches || cityMatches;
  });
  if (contextualMatch) return contextualMatch.entry;

  const exactMatches = candidates.filter((candidate) => candidate.score >= 100);
  if (exactMatches.length === 1 && title.length >= 6 && !ambiguousTitles.has(planningCompactTitle(room.title))) {
    const roomCountry = normalize(germanCountry(room.country || room.region));
    const entryCountry = normalize(germanCountry(exactMatches[0].entry.country || ""));
    if (!entryCountry || !roomCountry || entryCountry === roomCountry) return exactMatches[0].entry;
  }

  return null;
}

function findManualPlayedMatch(room, played) {
  const manual = MANUAL_PLAYED_MATCHES.find((entry) => normalize(entry.planningTitle) === normalize(room.title));
  if (!manual) return null;
  return played.find((entry) => normalize(entry.title) === normalize(manual.playedTitle)) || null;
}

function planningTitleMatchScore(planningTitle, entryTitle) {
  if (!planningTitle || !entryTitle) return 0;
  if (planningTitle === entryTitle) return 120;
  const compactPlanningTitle = planningCompactTitle(planningTitle);
  const compactEntryTitle = planningCompactTitle(entryTitle);
  if (compactPlanningTitle.length >= 6 && compactPlanningTitle === compactEntryTitle) return 115;
  const shorter = planningTitle.length < entryTitle.length ? planningTitle : entryTitle;
  const longer = planningTitle.length < entryTitle.length ? entryTitle : planningTitle;
  if (shorter.length < 6) return 0;
  if (longer.startsWith(`${shorter} `)) return 80;
  if (longer.includes(` ${shorter} `) || longer.endsWith(` ${shorter}`)) return 60;
  const compactShorter = compactPlanningTitle.length < compactEntryTitle.length ? compactPlanningTitle : compactEntryTitle;
  const compactLonger = compactPlanningTitle.length < compactEntryTitle.length ? compactEntryTitle : compactPlanningTitle;
  if (compactShorter.length >= 8 && compactLonger.startsWith(compactShorter)) return 65;
  return 0;
}

function buildAmbiguousTitleSet(rooms) {
  const groups = new Map();
  for (const room of rooms) {
    const key = planningCompactTitle(room.title);
    if (!key || key.length < 6) continue;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(planningRoomIdentity(room));
  }
  return new Set([
    ...GENERIC_PLANNING_TITLE_KEYS,
    ...[...groups.entries()].filter(([, identities]) => identities.size > 1).map(([key]) => key),
  ]);
}

function planningRoomIdentity(room) {
  const city = normalizeCity(room.city);
  const country = normalize(germanCountry(room.country || room.region));
  if (city || country) return [city, country].join("|");
  return [normalize(room.provider), country].join("|");
}

function sheetsForPayload(data) {
  const members = data.members || ["Sebi", "Elisa", "Lara", "Nikolai", "Ari"];
  const sheets = [
    { name: "Welt", rows: playedRows(data.played || [], members) },
    {
      name: "Up Next",
      rows: [
        ["Game", "Anbieter", "Land", "Stadt", "Link", "Anmerkungen"],
        ...(data.wishList || []).map((entry) => [entry.title, entry.provider, entry.country, entry.city, entry.link, entry.notes]),
      ],
    },
  ];

  for (const regionName of Object.keys(REGION_SHEET_NAMES)) {
    const rooms = (data.played || []).filter((room) => roomInRegion(room, regionName));
    sheets.push({ name: REGION_SHEET_NAMES[regionName], rows: playedRows(rooms, members) });
  }

  sheets.push({
    name: "Anderes",
    rows: [
      ["Game", "Anbieter", "Stadt", "Bewertung", "Datum", "Bemerkung"],
      ...(data.other || []).map((entry) => [entry.title, entry.provider, entry.city, entry.rating, entry.date, entry.notes]),
    ],
  });
  return sheets;
}

function playedRows(rooms, members) {
  return [
    [
      "Game",
      "Anbieter",
      "Stadt",
      "Scarefaktor",
      "Schwierigkeit",
      ...members.map((member) => `${member} (${rooms.filter((room) => memberPlayedRoom(room, member)).length})`),
      "Ø",
      "Datum",
      "Bemerkung",
      "Tags",
    ],
    ...rooms.map((room) => [
      room.title,
      room.provider,
      room.city,
      valueOrBlank(room.scare),
      valueOrBlank(room.difficulty),
      ...members.map((member) => memberRatingForSheet(room, member)),
      averageForSheet(room, members),
      room.date,
      room.notes,
      (room.tags || []).join(", "),
    ]),
  ];
}

function roomInRegion(room, regionName) {
  return Array.isArray(room.regions) && room.regions.includes(regionName);
}

function memberPlayedRoom(room, member) {
  return (room.playedBy || []).includes(member) || typeof room.ratings?.[member] === "number";
}

function memberRatingForSheet(room, member) {
  const rating = room.ratings?.[member];
  if (typeof rating === "number") return rating;
  return memberPlayedRoom(room, member) ? "-" : "";
}

function averageForSheet(room, members) {
  const values = members.map((member) => room.ratings?.[member]).filter((value) => typeof value === "number");
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : "";
}

function valueOrBlank(value) {
  return typeof value === "number" ? value : "";
}

async function fetchPayload() {
  const endpoint = new URL("/rest/v1/team_state", config.supabaseUrl);
  endpoint.searchParams.set("id", `eq.${config.teamId}`);
  endpoint.searchParams.set("select", "payload");
  const rows = await supabaseRequest(endpoint);
  if (!Array.isArray(rows) || !rows[0]?.payload) throw new Error("Supabase payload not found.");
  return rows[0].payload;
}

async function updatePayload(payload) {
  const endpoint = new URL("/rest/v1/team_state", config.supabaseUrl);
  endpoint.searchParams.set("id", `eq.${config.teamId}`);
  const result = await supabaseRequest(endpoint, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ payload }),
  });
  return result;
}

async function syncGoogleSheets(payload) {
  const response = await fetch(config.googleSheetsWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheets: sheetsForPayload(payload) }),
  });
  if (!response.ok) throw new Error(`Google Sheets sync failed with ${response.status}: ${await response.text()}`);
}

async function supabaseRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase request failed with ${response.status}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function readAppConfig() {
  const source = await fs.readFile(path.join(rootDir, "src", "config.js"), "utf8");
  const values = Object.fromEntries([...source.matchAll(/([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*"([^"]*)"/g)].map((match) => [match[1], match[2]]));
  for (const key of ["supabaseUrl", "supabaseAnonKey", "teamId"]) {
    if (!values[key]) throw new Error(`Missing ${key} in src/config.js.`);
  }
  return values;
}

async function readPlanningData() {
  const source = await fs.readFile(path.join(rootDir, "src", "planning-data.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.window.T2E_PLANNING_DATA || { terpeca: [], escaperoomers: [] };
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeCity(value) {
  return normalize(value).replace(/\s+(be|belgien|de|deutschland|hh|lu|luxemburg|luxembourg|nl|niederlande)$/, "");
}

function planningCompactTitle(value) {
  return normalize(value).replace(/\s+/g, "");
}

function germanCountry(value) {
  const text = clean(value);
  if (!text) return "";
  const match = Object.entries(COUNTRY_LABELS_DE).find(([english, german]) =>
    normalize(text) === normalize(english) || normalize(text) === normalize(german));
  return match ? match[1] : text;
}

function planningRegionLabel(value) {
  const text = clean(value);
  return REGION_LABELS_DE[text] || germanCountry(text);
}

function wishInfoKey(title, provider) {
  return `${normalize(title)}|${normalize(provider)}`;
}

function sameUrl(a, b) {
  return clean(a).replace(/\/+$/, "") === clean(b).replace(/\/+$/, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(clean))];
}
