const SPREADSHEET_ID = "1tzOIKEW1I3HiYNOFfcG6Ou60Uldqu2kminmb1nQ7uUI";
const SUPABASE_URL = "https://iasvzuadtjdqrfdilyun.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_30t1T306Yq-vSOVUNLKdsw_rcYQgjTm";
const TEAM_ID = "ksch-spiele";
const SCRIPT_WRITE_GUARD_KEY = "tools2escapp_script_write_until";
const MEMBERS = ["Sebi", "Elisa", "Lara", "Nikolai", "Ari"];

const REGION_TABS = [
  { name: "DE", sheet: "Gespielt (DE)", cities: [
    "aachen", "bad salzuflen", "bad steben", "balingen", "bamberg", "berlin", "bielefeld",
    "bochum", "bonn", "bottrop", "braunschweig", "bruhl", "castrop rauxel", "dorsten",
    "dortmund", "duisburg", "dusseldorf", "essen", "frankfurt", "frechen", "friedrichshafen",
    "gelnhausen", "gelsenkirchen", "gottingen", "hagen", "hamburg", "hannover", "heilbronn",
    "herne", "koblenz", "koln", "krefeld", "langenfeld", "limburg", "lippstadt",
    "monchengladbach", "munchen", "neuwied", "niederkassel", "oberhausen", "obernkirchen",
    "paderborn", "remscheid", "reutlingen", "siegburg", "tubingen", "witten", "wuppertal",
  ] },
  { name: "Athen", sheet: "Gespielt (Athen)", cities: ["athen", "athens"] },
  { name: "NRW", sheet: "Gespielt (NRW)", cities: [
    "aachen", "bad salzuflen", "bielefeld", "bochum", "bonn", "bottrop", "bruhl",
    "castrop rauxel", "dorsten", "dortmund", "duisburg", "dusseldorf", "essen", "frechen",
    "gelsenkirchen", "hagen", "herne", "koln", "krefeld", "langenfeld", "lippstadt",
    "monchengladbach", "niederkassel", "oberhausen", "paderborn", "remscheid", "siegburg",
    "witten", "wuppertal",
  ] },
  { name: "HH", sheet: "Gespielt (HH)", cities: ["hamburg"] },
  { name: "BENELUX", sheet: "Gespielt (BENELUX)", cities: [
    "amersfoort", "amsterdam", "as", "baarn", "bemmel", "brugge", "brussel", "burgum",
    "den haag", "hilversum", "katwijk", "leiden", "lier", "luxembourg", "luxemburg",
    "maaseik", "mechelen", "moordrecht", "naarden", "retie", "rijswijk", "schijndel",
    "utrecht", "volkel", "voorburg", "waalwijk", "zoersel",
  ] },
  { name: "SPAIN", sheet: "Gespielt (Spanien)", cities: ["barcelona", "berga"] },
  { name: "POLAND", sheet: "Gespielt (Polen)", cities: ["breslau", "posen", "warschau"] },
  { name: "HUNGARY", sheet: "Gespielt (Ungarn)", cities: ["budapest"] },
  { name: "CZECHIA", sheet: "Gespielt (Tschechien)", cities: ["prag"] },
  { name: "FRANCE", sheet: "Gespielt (Frankreich)", cities: ["paris", "strassbourg", "strasbourg"] },
  { name: "IRELAND", sheet: "Gespielt (Irland)", cities: ["dublin"] },
  { name: "UK", sheet: "Gespielt (UK)", cities: ["london"] },
  { name: "PORTUGAL", sheet: "Gespielt (Portugal)", cities: ["lissabon", "lisbon", "lisboa"] },
  { name: "ITALY", sheet: "Gespielt (Italien)", cities: ["rom", "roma"] },
  { name: "FINLAND", sheet: "Gespielt (Finnland)", cities: ["helsinki"] },
  { name: "CROATIA", sheet: "Gespielt (Kroatien)", cities: ["zagreb"] },
];

function doPost(e) {
  const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  setScriptWriteGuard_(20000);
  (payload.sheets || []).forEach((tab) => writeTab_(spreadsheet, tab.name, tab.rows || []));
  return jsonResponse_({ ok: true, updatedAt: new Date().toISOString() });
}

function installEditTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "syncSheetToApp")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger("syncSheetToApp").forSpreadsheet(SPREADSHEET_ID).onEdit().create();
}

function syncSheetToApp(e) {
  if (isScriptWriteGuarded_()) return;
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const editedSheetName = e && e.range ? e.range.getSheet().getName() : "";
  const existingPayload = fetchCurrentPayload_();
  const payload = parseSpreadsheet_(spreadsheet, existingPayload, editedSheetName);
  updateSupabase_(payload);
  setScriptWriteGuard_(20000);
  sheetsForPayload_(payload).forEach((tab) => writeTab_(spreadsheet, tab.name, tab.rows));
}

function parseSpreadsheet_(spreadsheet, existingPayload, editedSheetName) {
  const allPlayedSheets = spreadsheet.getSheets()
    .map((sheet) => sheet.getName())
    .filter((name) => /^Gespielt \(/.test(name));
  const playedSheets = editedSheetName === "Gespielt (Welt)" ? ["Gespielt (Welt)"] : allPlayedSheets
    .sort((a, b) => {
      if (a === editedSheetName) return 1;
      if (b === editedSheetName) return -1;
      if (a === "Gespielt (Welt)") return -1;
      if (b === "Gespielt (Welt)") return 1;
      return a.localeCompare(b);
    });
  const members = detectMembers_(spreadsheet.getSheetByName("Gespielt (Welt)")) || MEMBERS;
  const existingRooms = mapByKey_(existingPayload.played || [], roomKey_);
  const existingWishes = mapByKey_(existingPayload.wishList || [], wishKey_);
  const existingOther = mapByKey_(existingPayload.other || [], otherKey_);
  const roomsByKey = {};

  playedSheets.forEach((sheetName) => {
    parsePlayedSheet_(spreadsheet.getSheetByName(sheetName), members, existingRooms).forEach((room) => {
      const key = roomKey_(room);
      if (key) roomsByKey[key] = room;
    });
  });

  return {
    ...(existingPayload || {}),
    version: existingPayload.version || 2,
    sourceFile: "Google Sheets",
    updatedAt: new Date().toISOString(),
    members,
    played: Object.keys(roomsByKey).map((key) => roomsByKey[key]),
    wishList: parseWishSheet_(spreadsheet.getSheetByName("Up Next"), existingWishes),
    other: parseOtherSheet_(spreadsheet.getSheetByName("Anderes"), existingOther),
    regionPresets: existingPayload.regionPresets || [],
  };
}

function parsePlayedSheet_(sheet, members, existingRooms) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(clean_);
  const avgIndex = headers.findIndex((header) => clean_(header) === "Ø" || normalize_(header) === "ø" || normalize_(header) === "o");
  const dateIndex = headerIndex_(headers, ["datum"]);
  const notesIndex = headerIndex_(headers, ["bemerkung"]);
  const tagsIndex = headerIndex_(headers, ["tags"]);
  const scareIndex = headerIndex_(headers, ["scarefaktor", "scarefactor", "horror"]);
  const difficultyIndex = headerIndex_(headers, ["schwierigkeit", "difficulty"]);
  const memberStart = difficultyIndex >= 0 ? difficultyIndex + 1 : 5;

  return values.slice(1).map((row) => {
    const title = clean_(row[0]);
    if (!title) return null;
    const provider = clean_(row[1]);
    const city = clean_(row[2]);
    const ratings = {};
    const playedBy = [];
    members.forEach((member, offset) => {
      const parsed = ratingFromCell_(row[memberStart + offset]);
      ratings[member] = parsed.rating;
      if (parsed.played) playedBy.push(member);
    });
    const ratingValues = Object.keys(ratings).map((member) => ratings[member]).filter((value) => typeof value === "number");
    const average = numberFromCell_(row[avgIndex]);
    const room = {
      id: "",
      title,
      provider,
      city,
      scare: numberFromCell_(row[scareIndex]),
      difficulty: numberFromCell_(row[difficultyIndex]),
      ratings,
      playedBy,
      average: typeof average === "number" ? average : averageOf_(ratingValues),
      importedAverage: null,
      date: formatDateCell_(row[dateIndex]),
      notes: clean_(row[notesIndex]),
      tags: splitTags_(row[tagsIndex]),
      sourceSheets: [sheet.getName()],
      regions: regionsForCity_(city),
    };
    const existing = existingRooms[roomKey_(room)];
    room.id = existing ? existing.id : makeId_("room");
    return room;
  }).filter(Boolean);
}

function parseWishSheet_(sheet, existingWishes) {
  if (!sheet) return [];
  return sheet.getDataRange().getValues().slice(1).map((row) => {
    const title = clean_(row[0]);
    if (!title) return null;
    const entry = {
      id: "",
      title,
      provider: clean_(row[1]),
      country: clean_(row[2]),
      city: clean_(row[3]),
      link: clean_(row[4]),
      notes: clean_(row[5]),
      status: "interessant",
      priority: "normal",
    };
    const existing = existingWishes[wishKey_(entry)];
    entry.id = existing ? existing.id : makeId_("wish");
    return entry;
  }).filter(Boolean);
}

function parseOtherSheet_(sheet, existingOther) {
  if (!sheet) return [];
  return sheet.getDataRange().getValues().slice(1).map((row) => {
    const title = clean_(row[0]);
    if (!title) return null;
    const entry = {
      id: "",
      title,
      provider: clean_(row[1]),
      city: clean_(row[2]),
      rating: row[3],
      date: formatDateCell_(row[4]),
      notes: clean_(row[5]),
    };
    const existing = existingOther[otherKey_(entry)];
    entry.id = existing ? existing.id : makeId_("other");
    return entry;
  }).filter(Boolean);
}

function sheetsForPayload_(payload) {
  const members = payload.members || MEMBERS;
  const sheets = [{ name: "Gespielt (Welt)", rows: playedRows_(payload.played || [], members) }];
  REGION_TABS.forEach((region) => {
    const rooms = (payload.played || []).filter((room) => roomInRegion_(room, region));
    sheets.push({ name: region.sheet, rows: playedRows_(rooms, members) });
  });
  sheets.push({
    name: "Up Next",
    rows: [
      ["Game", "Anbieter", "Land", "Stadt", "Link", "Anmerkungen"],
      ...(payload.wishList || []).map((entry) => [entry.title, entry.provider, entry.country, entry.city, entry.link, entry.notes]),
    ],
  });
  sheets.push({
    name: "Anderes",
    rows: [
      ["Game", "Anbieter", "Stadt", "Bewertung", "Datum", "Bemerkung"],
      ...(payload.other || []).map((entry) => [entry.title, entry.provider, entry.city, entry.rating, entry.date, entry.notes]),
    ],
  });
  return sheets;
}

function playedRows_(rooms, members) {
  const memberStart = 5;
  const firstMember = columnLetter_(memberStart);
  const lastMember = columnLetter_(memberStart + members.length - 1);
  return [
    [
      "Game", "Anbieter", "Stadt", "Scarefaktor", "Schwierigkeit",
      ...members.map((member, index) => {
        const column = columnLetter_(memberStart + index);
        return `="${member} ("&COUNTA(${column}2:${column}999)&")"`;
      }),
      "Ø", "Datum", "Bemerkung", "Tags",
    ],
    ...rooms.map((room, index) => {
      const rowNumber = index + 2;
      return [
        room.title,
        room.provider,
        room.city,
        valueOrBlank_(room.scare),
        valueOrBlank_(room.difficulty),
        ...members.map((member) => memberRatingForSheet_(room, member)),
        `=IF(COUNT(${firstMember}${rowNumber}:${lastMember}${rowNumber})>0,SUM(${firstMember}${rowNumber}:${lastMember}${rowNumber})/COUNT(${firstMember}${rowNumber}:${lastMember}${rowNumber}),"")`,
        room.date,
        room.notes,
        (room.tags || []).join(", "),
      ];
    }),
  ];
}

function writeTab_(spreadsheet, name, rows) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  sheet.clear();
  if (!rows.length) return;
  const width = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => {
    const copy = row.slice();
    while (copy.length < width) copy.push("");
    return copy;
  });
  sheet.getRange(1, 1, normalizedRows.length, width).setValues(normalizedRows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, width).setFontWeight("bold").setBackground("#817de0").setFontColor("#ffffff");
  sheet.autoResizeColumns(1, Math.min(width, 14));
}

function fetchCurrentPayload_() {
  const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/team_state?id=eq.${encodeURIComponent(TEAM_ID)}&select=payload`, {
    method: "get",
    headers: supabaseHeaders_(),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 300) throw new Error(response.getContentText());
  const rows = JSON.parse(response.getContentText());
  return rows.length && rows[0].payload ? rows[0].payload : {};
}

function updateSupabase_(payload) {
  const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/team_state?id=eq.${encodeURIComponent(TEAM_ID)}`, {
    method: "patch",
    headers: { ...supabaseHeaders_(), Prefer: "return=minimal" },
    contentType: "application/json",
    payload: JSON.stringify({ payload }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 300) throw new Error(response.getContentText());
}

function supabaseHeaders_() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

function detectMembers_(sheet) {
  if (!sheet) return null;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(clean_);
  const avgIndex = headers.findIndex((header) => clean_(header) === "Ø" || normalize_(header) === "ø" || normalize_(header) === "o");
  if (avgIndex < 7) return null;
  return headers.slice(5, avgIndex).map((header) => clean_(header).replace(/\s*\(.+\)$/, "")).filter(Boolean);
}

function headerIndex_(headers, candidates) {
  const normalizedCandidates = candidates.map(normalize_);
  return headers.findIndex((header) => normalizedCandidates.includes(normalize_(header)));
}

function ratingFromCell_(value) {
  if (clean_(value) === "-") return { rating: null, played: true };
  const rating = numberFromCell_(value);
  return { rating, played: typeof rating === "number" };
}

function numberFromCell_(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(clean_(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function memberRatingForSheet_(room, member) {
  const rating = room.ratings && room.ratings[member];
  if (typeof rating === "number") return rating;
  return (room.playedBy || []).includes(member) ? "-" : "";
}

function roomInRegion_(room, region) {
  const city = normalizeCity_(room.city);
  return (room.regions || []).includes(region.name) || region.cities.some((entry) => city === entry || city.startsWith(`${entry} `));
}

function regionsForCity_(city) {
  return REGION_TABS.filter((region) => roomInRegion_({ city, regions: [] }, region)).map((region) => region.name);
}

function formatDateCell_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !Number.isNaN(value.valueOf())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  const text = clean_(value);
  const match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!match) return text;
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function splitTags_(value) {
  return clean_(value).split(",").map(clean_).filter(Boolean);
}

function averageOf_(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function valueOrBlank_(value) {
  return typeof value === "number" ? value : "";
}

function mapByKey_(items, keyFn) {
  return (items || []).reduce((map, item) => {
    const key = keyFn(item);
    if (key) map[key] = item;
    return map;
  }, {});
}

function roomKey_(room) {
  return [room.title, room.provider, room.city].map(normalize_).join("|");
}

function wishKey_(entry) {
  return [entry.title, entry.provider, entry.city].map(normalize_).join("|");
}

function otherKey_(entry) {
  return [entry.title, entry.provider, entry.city].map(normalize_).join("|");
}

function normalizeCity_(value) {
  return normalize_(value).replace(/\s+(be|belgien|de|deutschland|hh|lu|luxemburg|luxembourg|nl|niederlande)$/, "");
}

function normalize_(value) {
  return clean_(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ø]+/g, " ")
    .trim();
}

function clean_(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function makeId_(prefix) {
  return `${prefix}-${Utilities.getUuid().slice(0, 8)}`;
}

function columnLetter_(index) {
  let value = index + 1;
  let column = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - 1) / 26);
  }
  return column;
}

function setScriptWriteGuard_(ms) {
  PropertiesService.getScriptProperties().setProperty(SCRIPT_WRITE_GUARD_KEY, String(Date.now() + ms));
}

function isScriptWriteGuarded_() {
  return Number(PropertiesService.getScriptProperties().getProperty(SCRIPT_WRITE_GUARD_KEY) || 0) > Date.now();
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
