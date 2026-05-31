import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "src/seed-data.js";

if (!inputPath) {
  console.error("Usage: node scripts/export-seed.mjs <input.xlsx> [src/seed-data.js]");
  process.exit(1);
}

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheetList = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 20000,
});

const sheetNames = sheetList.ndjson
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line).name)
  .filter(Boolean);

const knownMembers = ["Sebi", "Elisa", "Lara", "Nikolai", "Ari"];

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

function hash(inputValue) {
  let value = 2166136261;
  for (let index = 0; index < inputValue.length; index += 1) {
    value ^= inputValue.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(36);
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = clean(value).replace(",", ".");
  if (!text || text === "-") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function isPlayedValue(value) {
  return typeof numberOrNull(value) === "number" || clean(value) === "-";
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && value > 20000) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return date.toISOString().slice(0, 10);
  }

  const text = clean(value);
  if (!text || text === "-") return "";

  const germanDate = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (germanDate) {
    const [, day, month, year] = germanDate;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const isoDate = new Date(text);
  return Number.isNaN(isoDate.valueOf()) ? text : isoDate.toISOString().slice(0, 10);
}

function splitTags(value) {
  return clean(value)
    .split(",")
    .map((tag) => clean(tag))
    .filter(Boolean);
}

function findColumn(headers, matcher) {
  return headers.findIndex((header) => matcher(normalize(header), clean(header)));
}

function getRows(sheetName) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const usedRange = sheet.getUsedRange(true);
  return usedRange ? usedRange.values : [];
}

function roomKey(room) {
  return [room.title, room.provider, room.city].map(normalize).join("|");
}

function titleCityKey(room) {
  return [room.title, room.city].map(normalize).join("|");
}

function editDistance(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + (a[row - 1] === b[col - 1] ? 0 : 1),
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarity(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a && !b) return 1;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length, 1);
}

function includesTitleVariant(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  return shorter.length >= 10 && longer.includes(shorter);
}

function findFuzzyMatch(room, candidates) {
  const sameCity = candidates.filter((candidate) => normalize(candidate.city) === normalize(room.city));
  const scored = sameCity
    .map((candidate) => {
      const titleScore = similarity(room.title, candidate.title);
      const providerScore = similarity(room.provider, candidate.provider);
      const titleVariant = includesTitleVariant(room.title, candidate.title);

      return {
        candidate,
        titleScore,
        providerScore,
        titleVariant,
        score: titleScore * 0.7 + providerScore * 0.3,
      };
    })
    .filter(({ titleScore, providerScore, titleVariant }) => (
      (titleScore >= 0.82 && providerScore >= 0.7)
      || (titleScore >= 0.72 && providerScore >= 0.88)
      || (titleVariant && providerScore >= 0.7)
    ))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.candidate ?? null;
}

function regionName(sheetName) {
  const match = sheetName.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : sheetName;
}

function parsePlayedSheet(sheetName) {
  const values = getRows(sheetName);
  if (values.length < 2) return { members: [], rooms: [] };

  const headers = values[0].map(clean);
  const columns = {
    title: findColumn(headers, (header) => header === "game"),
    provider: findColumn(headers, (header) => header === "anbieter"),
    city: findColumn(headers, (header) => header === "stadt"),
    scare: findColumn(headers, (header) => header === "scarefactor" || header === "scarefaktor"),
    difficulty: findColumn(headers, (header) => header.startsWith("schwierigkeit")),
    average: findColumn(headers, (_header, raw) => raw === "Ø"),
    date: findColumn(headers, (header) => header === "datum"),
    notes: findColumn(headers, (header) => header === "bemerkung"),
    tags: findColumn(headers, (header) => header === "tags"),
  };

  const memberColumns = headers
    .map((header, column) => {
      const member = knownMembers.find((candidate) => normalize(header).startsWith(normalize(candidate)));
      return member ? { member, column } : null;
    })
    .filter(Boolean);

  const rooms = values.slice(1).map((row, index) => {
    const ratings = Object.fromEntries(
      memberColumns.map(({ member, column }) => [member, numberOrNull(row[column])]),
    );
    const playedBy = memberColumns
      .filter(({ column }) => isPlayedValue(row[column]))
      .map(({ member }) => member);
    const computedRatings = Object.values(ratings).filter((value) => typeof value === "number");
    const importedAverage = numberOrNull(row[columns.average]);
    const computedAverage = computedRatings.length
      ? computedRatings.reduce((sum, value) => sum + value, 0) / computedRatings.length
      : importedAverage;

    const title = clean(row[columns.title]);
    const provider = clean(row[columns.provider]);
    const city = clean(row[columns.city]);

    return {
      id: `room-${hash(`${sheetName}|${index}|${title}|${provider}|${city}`)}`,
      title,
      provider,
      city,
      scare: numberOrNull(row[columns.scare]),
      difficulty: numberOrNull(row[columns.difficulty]),
      ratings,
      playedBy,
      average: computedAverage === null ? null : Number(computedAverage.toFixed(2)),
      importedAverage,
      date: parseDate(row[columns.date]),
      notes: clean(row[columns.notes]),
      tags: splitTags(row[columns.tags]),
      sourceSheets: [sheetName],
      regions: [],
    };
  }).filter((room) => room.title || room.provider || room.city);

  return { members: memberColumns.map(({ member }) => member), rooms };
}

function parseWishList(sheetName) {
  const values = getRows(sheetName);
  if (values.length < 2) return [];

  const headers = values[0].map(clean);
  const columns = {
    title: findColumn(headers, (header) => header === "game"),
    provider: findColumn(headers, (header) => header === "anbieter"),
    country: findColumn(headers, (header) => header === "land"),
    city: findColumn(headers, (header) => header === "stadt"),
    link: findColumn(headers, (header) => header === "link"),
    notes: findColumn(headers, (header) => header === "anmerkungen" || header === "bemerkung"),
  };

  return values.slice(1).map((row, index) => {
    const title = clean(row[columns.title]);
    const provider = clean(row[columns.provider]);
    const city = clean(row[columns.city]);
    const country = clean(row[columns.country]);

    return {
      id: `wish-${hash(`${index}|${title}|${provider}|${city}|${country}`)}`,
      title,
      provider,
      country,
      city,
      link: clean(row[columns.link]),
      notes: clean(row[columns.notes]),
      status: "interessant",
      priority: "normal",
    };
  }).filter((entry) => entry.title || entry.provider || entry.city || entry.link);
}

function parseOther(sheetName) {
  const values = getRows(sheetName);
  if (values.length < 2) return [];

  const headers = values[0].map(clean);
  const columns = {
    title: findColumn(headers, (header) => header === "game"),
    provider: findColumn(headers, (header) => header === "anbieter"),
    city: findColumn(headers, (header) => header === "stadt"),
    rating: findColumn(headers, (header) => header === "bewertung"),
    date: findColumn(headers, (header) => header === "datum"),
    notes: findColumn(headers, (header) => header === "bemerkung"),
  };

  return values.slice(1).map((row, index) => ({
    id: `other-${hash(`${index}|${clean(row[columns.title])}|${clean(row[columns.provider])}`)}`,
    title: clean(row[columns.title]),
    provider: clean(row[columns.provider]),
    city: clean(row[columns.city]),
    rating: clean(row[columns.rating]),
    date: parseDate(row[columns.date]),
    notes: clean(row[columns.notes]),
  })).filter((entry) => entry.title || entry.provider || entry.city || entry.rating);
}

const playedSheetNames = sheetNames.filter((name) => name.startsWith("Gespielt"));
const masterSheetName = playedSheetNames.includes("Gespielt (Welt)")
  ? "Gespielt (Welt)"
  : playedSheetNames[0];

const master = parsePlayedSheet(masterSheetName);
const members = knownMembers.filter((member) => master.members.includes(member));
const played = master.rooms;
const byFullKey = new Map();
const byTitleCityKey = new Map();

for (const room of played) {
  byFullKey.set(roomKey(room), room);
  const shortKey = titleCityKey(room);
  if (!byTitleCityKey.has(shortKey)) byTitleCityKey.set(shortKey, room);
}

const regionPresets = [];
for (const sheetName of playedSheetNames.filter((name) => name !== masterSheetName)) {
  const parsed = parsePlayedSheet(sheetName);
  const region = regionName(sheetName);
  const matchedRoomIds = [];
  let fuzzyRows = 0;
  let addedRows = 0;

  for (const room of parsed.rooms) {
    let match = byFullKey.get(roomKey(room)) ?? byTitleCityKey.get(titleCityKey(room));

    if (!match) {
      match = findFuzzyMatch(room, played);
      if (match) fuzzyRows += 1;
    }

    if (!match) {
      match = {
        ...room,
        id: `room-${hash(`${sheetName}|regional-only|${room.title}|${room.provider}|${room.city}`)}`,
        sourceSheets: [sheetName],
        regions: [],
      };
      played.push(match);
      byFullKey.set(roomKey(match), match);
      if (!byTitleCityKey.has(titleCityKey(match))) byTitleCityKey.set(titleCityKey(match), match);
      addedRows += 1;
    }

    if (!match.regions.includes(region)) match.regions.push(region);
    if (!match.sourceSheets.includes(sheetName)) match.sourceSheets.push(sheetName);
    matchedRoomIds.push(match.id);
  }

  regionPresets.push({
    id: `region-${hash(sheetName)}`,
    name: region,
    sheetName,
    importedRows: parsed.rooms.length,
    matchedRows: new Set(matchedRoomIds).size,
    fuzzyRows,
    addedRows,
    roomIds: [...new Set(matchedRoomIds)],
  });
}

const seed = {
  version: 2,
  sourceFile: path.basename(inputPath),
  importedAt: new Date().toISOString(),
  members,
  played,
  wishList: sheetNames.includes("Up Next") ? parseWishList("Up Next") : [],
  other: sheetNames.includes("Anderes") ? parseOther("Anderes") : [],
  regionPresets,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(
  outputPath,
  `window.T2E_SEED_DATA = ${JSON.stringify(seed, null, 2)};\n`,
  "utf8",
);

console.log(JSON.stringify({
  outputPath,
  played: seed.played.length,
  wishList: seed.wishList.length,
  other: seed.other.length,
  regions: seed.regionPresets.map(({ name, importedRows, matchedRows }) => ({ name, importedRows, matchedRows })),
}, null, 2));
