(function () {
  "use strict";

  const STORAGE_KEY = "tools2escape:v2";
  const config = window.T2E_CONFIG || {};
  const seed = window.T2E_SEED_DATA || {
    version: 1,
    sourceFile: "",
    importedAt: "",
    members: ["Sebi", "Elisa", "Lara", "Nikolai", "Ari"],
    played: [],
    wishList: [],
    other: [],
    regionPresets: [],
  };
  const REGION_ORDER = ["DE", "Athen", "NRW", "HH", "BENELUX", "SPAIN", "POLAND", "HUNGARY", "CZECHIA", "FRANCE", "IRELAND", "UK", "PORTUGAL", "ITALY", "FINLAND", "CROATIA"];
  const REGION_LABELS = {
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
  const ATHENS_CITIES = new Set(["athen", "athens"]);
  const HAMBURG_CITIES = new Set(["hamburg"]);
  const NRW_CITIES = new Set([
    "aachen",
    "arnsberg",
    "bad salzuflen",
    "bergisch gladbach",
    "bielefeld",
    "bocholt",
    "bochum",
    "bonn",
    "bottrop",
    "bruhl",
    "bruehl",
    "castrop rauxel",
    "detmold",
    "dinslaken",
    "dormagen",
    "dorsten",
    "dortmund",
    "dueren",
    "duisburg",
    "duren",
    "dusseldorf",
    "duesseldorf",
    "erkelenz",
    "essen",
    "frechen",
    "gelsenkirchen",
    "grevenbroich",
    "gutersloh",
    "guetersloh",
    "hagen",
    "hamm",
    "herne",
    "huerth",
    "hurth",
    "iserlohn",
    "kerpen",
    "koln",
    "koeln",
    "krefeld",
    "langenfeld",
    "leverkusen",
    "lippstadt",
    "marl",
    "minden",
    "moenchengladbach",
    "moers",
    "monchengladbach",
    "mulheim",
    "mulheim an der ruhr",
    "muelheim",
    "muelheim an der ruhr",
    "munster",
    "muenster",
    "munster westfalen",
    "muenster westfalen",
    "neuss",
    "niederkassel",
    "oberhausen",
    "paderborn",
    "ratingen",
    "recklinghausen",
    "remscheid",
    "rheine",
    "siegen",
    "siegburg",
    "solingen",
    "troisdorf",
    "unna",
    "velbert",
    "viersen",
    "warendorf",
    "wesel",
    "witten",
    "wuppertal",
  ]);
  const BENELUX_CITIES = new Set([
    "amersfoort",
    "amsterdam",
    "as",
    "baarn",
    "bemmel",
    "brugge",
    "brussel",
    "bruxelles",
    "burgum",
    "den haag",
    "hilversum",
    "katwijk",
    "leiden",
    "lier",
    "luxembourg",
    "luxemburg",
    "maaseik",
    "mechelen",
    "moordrecht",
    "naarden",
    "retie",
    "rijswijk",
    "schijndel",
    "utrecht",
    "volkel",
    "voorburg",
    "waalwijk",
    "zoersel",
  ]);
  const SPAIN_CITIES = new Set([
    "alicante",
    "barcelona",
    "berga",
    "bilbao",
    "cordoba",
    "girona",
    "granada",
    "madrid",
    "malaga",
    "murcia",
    "palma",
    "salamanca",
    "segovia",
    "sevilla",
    "seville",
    "sitges",
    "tarragona",
    "toledo",
    "valencia",
    "zaragoza",
  ]);
  const POLAND_CITIES = new Set([
    "breslau",
    "poznan",
    "posen",
    "warsaw",
    "warschau",
    "wroclaw",
  ]);
  const HUNGARY_CITIES = new Set(["budapest"]);
  const CZECHIA_CITIES = new Set(["prag", "prague", "praha"]);
  const FRANCE_CITIES = new Set(["paris", "strasbourg", "strassbourg"]);
  const IRELAND_CITIES = new Set(["dublin"]);
  const UK_CITIES = new Set(["london"]);
  const PORTUGAL_CITIES = new Set(["lisbon", "lisboa", "lissabon"]);
  const ITALY_CITIES = new Set(["rom", "roma", "rome"]);
  const FINLAND_CITIES = new Set(["helsinki"]);
  const CROATIA_CITIES = new Set(["zagreb"]);
  const GERMANY_CITIES = new Set([
    ...NRW_CITIES,
    ...HAMBURG_CITIES,
    "augsburg",
    "bad steben",
    "balingen",
    "bamberg",
    "berlin",
    "braunschweig",
    "bremen",
    "darmstadt",
    "dresden",
    "erfurt",
    "flensburg",
    "frankfurt",
    "frankfurt am main",
    "frankfurt main",
    "freiburg",
    "friedrichshafen",
    "fulda",
    "gelnhausen",
    "gelnhausen frankfurt",
    "gottingen",
    "goettingen",
    "halle",
    "hannover",
    "heidelberg",
    "jena",
    "karlsruhe",
    "kassel",
    "kiel",
    "koblenz",
    "konstanz",
    "leipzig",
    "limburg",
    "limburg an der lahn",
    "lubeck",
    "luebeck",
    "magdeburg",
    "mainz",
    "mannheim",
    "munchen",
    "muenchen",
    "munich",
    "nurnberg",
    "nuernberg",
    "nuremberg",
    "obernkirchen",
    "oldenburg",
    "osnabruck",
    "osnabrueck",
    "potsdam",
    "regensburg",
    "reutlingen",
    "rostock",
    "saarbrucken",
    "saarbruecken",
    "stuttgart",
    "trier",
    "tubingen",
    "tuebingen",
    "ulm",
    "wiesbaden",
    "wurzburg",
    "wuerzburg",
  ]);
  const CITY_REGION_SETS = {
    Athen: ATHENS_CITIES,
    NRW: NRW_CITIES,
    HH: HAMBURG_CITIES,
    BENELUX: BENELUX_CITIES,
    SPAIN: SPAIN_CITIES,
    POLAND: POLAND_CITIES,
    HUNGARY: HUNGARY_CITIES,
    CZECHIA: CZECHIA_CITIES,
    FRANCE: FRANCE_CITIES,
    IRELAND: IRELAND_CITIES,
    UK: UK_CITIES,
    PORTUGAL: PORTUGAL_CITIES,
    ITALY: ITALY_CITIES,
    FINLAND: FINLAND_CITIES,
    CROATIA: CROATIA_CITIES,
  };
  const VIRTUAL_REGION_NAMES = ["SPAIN", "POLAND", "HUNGARY", "CZECHIA", "FRANCE", "IRELAND", "UK", "PORTUGAL", "ITALY", "FINLAND", "CROATIA"];

  const ui = {
    view: "played",
    search: "",
    region: "all",
    sort: "rating-desc",
    selectedMembers: [],
    wishSearch: "",
    wishCountry: "all",
    notice: "",
    modal: null,
  };

  const cloud = {
    enabled: hasSupabaseConfig(),
    client: null,
    loading: false,
    saving: false,
    error: "",
    lastSyncedAt: "",
    channel: null,
  };

  let saveQueued = false;
  let applyingRemoteData = false;
  let data = loadData();

  const app = document.getElementById("app");

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    render();
    if (cloud.enabled) await initCloud();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === seed.version) return normalizeData(parsed);
      }
    } catch (error) {
      console.warn(error);
    }
    return normalizeData(clone(seed));
  }

  function normalizeData(input) {
    const base = clone(seed);
    const seedRoomsById = new Map(base.played.map((room) => [room.id, room]));
    const merged = {
      ...base,
      ...input,
      members: Array.isArray(input.members) && input.members.length ? input.members : base.members,
      played: Array.isArray(input.played) ? input.played : [],
      wishList: Array.isArray(input.wishList) ? input.wishList : [],
      other: Array.isArray(input.other) ? input.other : [],
      regionPresets: Array.isArray(input.regionPresets) ? input.regionPresets : [],
    };

    merged.played = merged.played.map((room) => {
      const id = room.id || makeId("room");
      const ratings = normalizeRatings(room.ratings, merged.members);
      const seedRoom = seedRoomsById.get(id);
      const fallbackPlayedBy = Array.isArray(room.playedBy) ? [] : seedRoom?.playedBy;

      return {
        id,
        title: clean(room.title),
        provider: clean(room.provider),
        city: clean(room.city),
        scare: numberOrNull(room.scare),
        difficulty: numberOrNull(room.difficulty),
        ratings,
        playedBy: normalizePlayedBy(room.playedBy, ratings, merged.members, fallbackPlayedBy),
        average: numberOrNull(room.average),
        importedAverage: numberOrNull(room.importedAverage),
        date: clean(room.date),
        notes: clean(room.notes),
        tags: Array.isArray(room.tags) ? room.tags.map(clean).filter(Boolean) : splitTags(room.tags),
        sourceSheets: Array.isArray(room.sourceSheets) ? room.sourceSheets : [],
        regions: Array.isArray(room.regions) ? room.regions : [],
      };
    });

    merged.wishList = merged.wishList.map((entry) => ({
      id: entry.id || makeId("wish"),
      title: clean(entry.title),
      provider: clean(entry.provider),
      country: clean(entry.country),
      city: clean(entry.city),
      link: clean(entry.link),
      notes: clean(entry.notes),
      status: clean(entry.status) || "interessant",
      priority: clean(entry.priority) || "normal",
    }));

    merged.updatedAt = input.updatedAt || new Date().toISOString();
    return merged;
  }

  function normalizeRatings(ratings, members) {
    const source = ratings && typeof ratings === "object" ? ratings : {};
    return Object.fromEntries(members.map((member) => [member, numberOrNull(source[member])]));
  }

  function normalizePlayedBy(playedBy, ratings, members, fallback = []) {
    const played = new Set([
      ...(Array.isArray(fallback) ? fallback : []),
      ...(Array.isArray(playedBy) ? playedBy : []),
    ].map(clean));

    members.forEach((member) => {
      if (typeof ratings[member] === "number") played.add(member);
    });

    return members.filter((member) => played.has(member));
  }

  function saveData() {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (!applyingRemoteData) queueCloudSave();
  }

  function hasSupabaseConfig() {
    return Boolean(
      !new URLSearchParams(window.location.search).has("qa")
      && config.supabaseUrl
      && config.supabaseAnonKey
      && config.teamId
      && window.supabase?.createClient,
    );
  }

  async function initCloud() {
    cloud.loading = true;
    cloud.error = "";
    render();

    try {
      cloud.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      await loadCloudState();
      subscribeToCloudChanges();
    } catch (error) {
      cloud.error = error.message || "Cloud konnte nicht verbunden werden.";
    } finally {
      cloud.loading = false;
      render();
    }
  }

  async function loadCloudState() {
    if (!cloud.client) return;
    cloud.loading = true;
    cloud.error = "";
    render();

    try {
      const { data: row, error } = await cloud.client
        .from("team_state")
        .select("payload,updated_at")
        .eq("id", config.teamId)
        .single();

      if (error) throw error;

      if (row?.payload && Array.isArray(row.payload.played)) {
        applyingRemoteData = true;
        data = normalizeData(row.payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        applyingRemoteData = false;
        cloud.lastSyncedAt = row.updated_at || "";
      } else {
        await saveCloudState();
      }
    } catch (error) {
      cloud.error = readableCloudError(error);
    } finally {
      applyingRemoteData = false;
      cloud.loading = false;
      render();
    }
  }

  function subscribeToCloudChanges() {
    if (!cloud.client || cloud.channel) return;

    cloud.channel = cloud.client
      .channel(`tools2escape-${config.teamId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "team_state",
          filter: `id=eq.${config.teamId}`,
        },
        (payload) => {
          if (!payload.new?.payload || !Array.isArray(payload.new.payload.played)) return;
          applyingRemoteData = true;
          data = normalizeData(payload.new.payload);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          applyingRemoteData = false;
          cloud.lastSyncedAt = payload.new.updated_at || "";
          cloud.error = "";
          render();
        },
      )
      .subscribe();
  }

  function unsubscribeFromCloudChanges() {
    if (!cloud.client || !cloud.channel) return;
    cloud.client.removeChannel(cloud.channel);
    cloud.channel = null;
  }

  function queueCloudSave() {
    if (!cloud.enabled || !cloud.client) return;
    saveQueued = true;
    void flushCloudSave();
  }

  async function flushCloudSave() {
    if (cloud.saving) return;

    while (saveQueued) {
      saveQueued = false;
      await saveCloudState();
    }
  }

  async function saveCloudState() {
    if (!cloud.client) return;

    cloud.saving = true;
    cloud.error = "";
    render();

    const payload = clone(data);
    try {
      const { data: row, error } = await cloud.client
        .from("team_state")
        .update({ payload })
        .eq("id", config.teamId)
        .select("updated_at")
        .single();

      if (error) throw error;
      cloud.lastSyncedAt = row?.updated_at || new Date().toISOString();
    } catch (error) {
      cloud.error = readableCloudError(error);
    } finally {
      cloud.saving = false;
      render();
    }
  }

  function readableCloudError(error) {
    const message = error?.message || String(error);
    if (message.includes("team_not_found")) return "Team nicht gefunden. Prüfe die Team-ID in src/config.js.";
    if (message.includes("JWT") || message.includes("row-level security") || message.includes("permission")) {
      return "Kein Zugriff. Bitte database/supabase.sql in Supabase ausführen.";
    }
    if (message.includes("JSON object requested") || message.includes("0 rows")) {
      return "Team-Datensatz fehlt. Bitte database/supabase.sql in Supabase ausführen.";
    }
    return message;
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

  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const text = clean(value).replace(",", ".");
    if (!text || text === "-") return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function splitTags(value) {
    return clean(value)
      .split(",")
      .map(clean)
      .filter(Boolean);
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function currentMembers() {
    return ui.selectedMembers.length ? ui.selectedMembers : data.members;
  }

  function alphabeticalMembers() {
    return [...data.members].sort((a, b) => a.localeCompare(b, "de"));
  }

  function averageFor(room, members = currentMembers()) {
    const ratings = members.map((member) => room.ratings[member]).filter((value) => typeof value === "number");
    if (!ratings.length) return isTeamScope(members) ? numberOrNull(room.average) : null;
    return ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  }

  function ratingValuesForRooms(rooms, members = data.members) {
    return rooms.flatMap((room) => members.map((member) => room.ratings[member]).filter((value) => typeof value === "number"));
  }

  function isTeamScope(members) {
    return members.length === data.members.length && data.members.every((member) => members.includes(member));
  }

  function memberPlayedRoom(room, member) {
    return (room.playedBy || []).includes(member) || typeof room.ratings[member] === "number";
  }

  function playedMembersForRoom(room) {
    return data.members.filter((member) => memberPlayedRoom(room, member));
  }

  function averageOf(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }

  function rankRooms(sortedRooms, maxRank) {
    const ranked = [];
    let previousScore = "";
    let currentRank = 0;

    sortedRooms.forEach((item, index) => {
      const score = formatScore(item.score);
      if (score !== previousScore) {
        currentRank = index + 1;
        previousScore = score;
      }
      if (currentRank <= maxRank) ranked.push({ ...item, rank: currentRank });
    });

    return ranked;
  }

  function formatScore(value) {
    const score = numberOrNull(value);
    return score === null ? "-" : score.toFixed(score % 1 === 0 ? 0 : 1);
  }

  function formatAverage(value) {
    const score = numberOrNull(value);
    return score === null ? "-" : score.toFixed(1);
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.valueOf())) return value;
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }

  function getPlayedRooms() {
    const rooms = data.played.filter((room) => {
      const memberMatch = ui.selectedMembers.every((member) => memberPlayedRoom(room, member));
      return matchesRegion(room) && matchesSearch(room) && memberMatch;
    });

    return rooms.sort((a, b) => {
      if (ui.sort === "rating-desc") return (averageFor(b) ?? -1) - (averageFor(a) ?? -1);
      if (ui.sort === "rating-asc") return (averageFor(a) ?? 99) - (averageFor(b) ?? 99);
      if (ui.sort === "date-desc") return (b.date || "").localeCompare(a.date || "");
      if (ui.sort === "city") return `${a.city} ${a.title}`.localeCompare(`${b.city} ${b.title}`, "de");
      if (ui.sort === "scare-desc") return (b.scare ?? -1) - (a.scare ?? -1);
      if (ui.sort === "difficulty-desc") return (b.difficulty ?? -1) - (a.difficulty ?? -1);
      return a.title.localeCompare(b.title, "de");
    });
  }

  function getContextRooms() {
    return data.played.filter((room) => matchesRegion(room) && matchesSearch(room));
  }

  function matchesSearch(room) {
    const query = normalize(ui.search);
    if (!query) return true;
    return normalize([
      room.title,
      room.provider,
      room.city,
      room.notes,
      room.tags.join(" "),
    ].join(" ")).includes(query);
  }

  function matchesRegion(room) {
    if (ui.region === "all") return true;
    if (ui.region.startsWith("preset:")) {
      const presetId = ui.region.slice(7);
      const preset = regionById(presetId);
      return Boolean(preset && roomBelongsToPreset(room, preset));
    }
    if (ui.region.startsWith("city:")) {
      return normalize(room.city) === normalize(ui.region.slice(5));
    }
    return true;
  }

  function regionOptions() {
    return [
      { value: "all", label: `Alle (${data.played.length})` },
      ...regionPresetOptions(),
    ];
  }

  function regionPresetOptions() {
    return REGION_ORDER
      .map(regionByName)
      .filter(Boolean)
      .map((preset) => {
        const roomIds = regionRoomIds(preset);
        return {
          value: `preset:${preset.id}`,
          name: preset.name,
          label: `${REGION_LABELS[preset.name] || preset.name} (${roomIds.length})`,
          shortLabel: REGION_LABELS[preset.name] || preset.name,
          count: roomIds.length,
          roomIds,
        };
      })
      .filter((option) => option.roomIds.length);
  }

  function regionById(id) {
    return data.regionPresets.find((preset) => preset.id === id) || virtualRegionById(id);
  }

  function regionByName(name) {
    return data.regionPresets.find((preset) => preset.name === name) || virtualRegionByName(name);
  }

  function virtualRegionById(id) {
    const name = VIRTUAL_REGION_NAMES.find((regionName) => regionName.toLowerCase() === id);
    return name ? virtualRegion(name) : null;
  }

  function virtualRegionByName(name) {
    return VIRTUAL_REGION_NAMES.includes(name) ? virtualRegion(name) : null;
  }

  function virtualRegion(name) {
    return {
      id: name.toLowerCase(),
      name,
      roomIds: [],
    };
  }

  function regionRoomIds(preset) {
    return data.played
      .filter((room) => roomBelongsToPreset(room, preset))
      .map((room) => room.id);
  }

  function roomBelongsToPreset(room, preset) {
    if (detectedRegionNamesForCity(room.city).includes(preset.name)) return true;
    if ((room.regions || []).includes(preset.name)) return true;
    if ((preset.roomIds || []).includes(room.id)) return true;
    return regionCitiesForPreset(preset).has(normalizeCity(room.city));
  }

  function regionCitiesForPreset(preset) {
    const presetIds = new Set(preset.roomIds || []);
    return new Set(
      data.played
        .filter((room) => presetIds.has(room.id))
        .map((room) => normalizeCity(room.city))
        .filter(Boolean),
    );
  }

  function detectedRegionNamesForCity(value) {
    const city = normalizeCity(value);
    if (!city) return [];
    return REGION_ORDER.filter((regionName) => cityBelongsToRegion(city, regionName));
  }

  function cityBelongsToRegion(city, regionName) {
    if (regionName === "DE") return cityMatchesSet(city, GERMANY_CITIES) || cityBelongsToRegion(city, "NRW") || cityBelongsToRegion(city, "HH");
    if (regionName === "HH") return cityMatchesSet(city, HAMBURG_CITIES);
    return Boolean(CITY_REGION_SETS[regionName] && cityMatchesSet(city, CITY_REGION_SETS[regionName]));
  }

  function cityMatchesSet(city, cities) {
    if (cities.has(city)) return true;
    return [...cities].some((entry) => entry.length >= 4 && city.startsWith(`${entry} `));
  }

  function countBy(items, getter) {
    return items.reduce((counts, item) => {
      const key = clean(getter(item));
      if (!key) return counts;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  function exportExcelWorkbook() {
    if (!window.XLSX?.utils) {
      setNotice("Excel-Export konnte nicht geladen werden.");
      return;
    }

    const workbook = window.XLSX.utils.book_new();
    appendWorksheet(workbook, "Gespielt (Welt)", playedExportRows(data.played));

    regionPresetOptions().forEach((region) => {
      const roomIds = new Set(region.roomIds);
      const rooms = data.played.filter((room) => roomIds.has(room.id));
      appendWorksheet(workbook, exportRegionSheetName(region), playedExportRows(rooms));
    });

    appendWorksheet(workbook, "Up Next", [
      ["Game", "Anbieter", "Land", "Stadt", "Link", "Anmerkungen"],
      ...data.wishList.map((entry) => [
        entry.title,
        entry.provider,
        entry.country,
        entry.city,
        entry.link,
        entry.notes,
      ]),
    ]);

    appendWorksheet(workbook, "Anderes", [
      ["Game", "Anbieter", "Stadt", "Bewertung", "Datum", "Bemerkung"],
      ...data.other.map((entry) => [
        entry.title,
        entry.provider,
        entry.city,
        entry.rating,
        entry.date,
        entry.notes,
      ]),
    ]);

    const bytes = window.XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(
      new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Tools2EscApp-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    setNotice("Excel exportiert.");
  }

  function appendWorksheet(workbook, name, rows) {
    const worksheet = window.XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = rows[0].map((_, index) => ({ wch: index < 3 ? 26 : index < 10 ? 12 : 18 }));
    window.XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(name));
  }

  function playedExportRows(rooms) {
    const members = data.members;
    const firstMemberColumn = 5;
    const lastMemberColumn = firstMemberColumn + members.length - 1;
    const firstMemberLetter = excelColumn(firstMemberColumn);
    const lastMemberLetter = excelColumn(lastMemberColumn);
    return [
      [
        "Game",
        "Anbieter",
        "Stadt",
        "Scarefaktor",
        "Schwierigkeit",
        ...members.map((member, index) => {
          const column = excelColumn(firstMemberColumn + index);
          const count = rooms.filter((room) => memberPlayedRoom(room, member)).length;
          return formulaCell(`="${member} ("&COUNTA(${column}2:${column}999)&")"`, `${member} (${count})`);
        }),
        "Ø",
        "Datum",
        "Bemerkung",
        "Tags",
      ],
      ...rooms.map((room, index) => {
        const row = index + 2;
        return [
          room.title,
          room.provider,
          room.city,
          exportMetric(room.scare, room),
          exportMetric(room.difficulty, room),
          ...members.map((member) => exportMemberRating(room, member)),
          formulaCell(`IF(COUNT(${firstMemberLetter}${row}:${lastMemberLetter}${row})>0,SUM(${firstMemberLetter}${row}:${lastMemberLetter}${row})/COUNT(${firstMemberLetter}${row}:${lastMemberLetter}${row}),"")`, exportAverage(room)),
          room.date,
          room.notes,
          (room.tags || []).join(", "),
        ];
      }),
    ];
  }

  function formulaCell(formula, value) {
    return {
      f: formula,
      v: value,
      t: typeof value === "number" ? "n" : "s",
    };
  }

  function excelColumn(index) {
    let value = index + 1;
    let column = "";
    while (value > 0) {
      const remainder = (value - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      value = Math.floor((value - 1) / 26);
    }
    return column;
  }

  function exportMemberRating(room, member) {
    const rating = room.ratings[member];
    if (typeof rating === "number") return rating;
    return memberPlayedRoom(room, member) ? "-" : "";
  }

  function exportMetric(value, room) {
    if (typeof value === "number") return value;
    return playedMembersForRoom(room).length && !ratingValuesForRooms([room]).length ? "-" : "";
  }

  function exportAverage(room) {
    const score = averageFor(room, data.members);
    return typeof score === "number" ? Number(score.toFixed(2)) : "";
  }

  function exportRegionSheetName(region) {
    const names = {
      HH: "HH",
      BENELUX: "BENELUX",
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
    return `Gespielt (${names[region.name] || region.name})`;
  }

  function safeSheetName(name) {
    return clean(name).replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Export";
  }

  function downloadBlob(blob, fileName) {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function cssAttribute(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function captureActiveField() {
    const element = document.activeElement;
    if (!element || !app.contains(element) || !element.matches("input, textarea, select")) return null;

    const selector = element.id
      ? `[id="${cssAttribute(element.id)}"]`
      : element.name
        ? `${element.tagName.toLowerCase()}[name="${cssAttribute(element.name)}"]`
        : "";

    if (!selector) return null;

    return {
      selector,
      start: typeof element.selectionStart === "number" ? element.selectionStart : null,
      end: typeof element.selectionEnd === "number" ? element.selectionEnd : null,
    };
  }

  function restoreActiveField(snapshot) {
    if (!snapshot) return;
    const element = app.querySelector(snapshot.selector);
    if (!element) return;

    element.focus({ preventScroll: true });
    if (snapshot.start === null || typeof element.setSelectionRange !== "function") return;

    try {
      const end = snapshot.end ?? snapshot.start;
      element.setSelectionRange(snapshot.start, end);
    } catch {
      // Some input types, like number, cannot receive a text selection.
    }
  }

  function render() {
    const activeField = captureActiveField();
    const rooms = getPlayedRooms();
    app.innerHTML = `
      <div class="app-shell">
        ${renderHeader()}
        ${ui.notice ? `<div class="notice">${escapeHtml(ui.notice)}</div>` : ""}
        <main class="main-panel">
          ${ui.view === "played" ? renderPlayedView(rooms) : ""}
          ${ui.view === "upnext" ? renderWishView() : ""}
          ${ui.view === "stats" ? renderStatsView() : ""}
        </main>
        ${renderModal()}
      </div>
    `;
    bindEvents();
    restoreActiveField(activeField);
  }

  function renderHeader() {
    return `
      <header class="topbar">
        <div class="brand">
          <img class="brand-logo" src="icons/icon-192.png" alt="" aria-hidden="true">
          <h1>Tools2EscApp</h1>
        </div>
        <div class="top-actions">
          <nav class="tabs" aria-label="Hauptbereiche">
        ${tabButton("played", "Gespielt")}
        ${tabButton("upnext", "Up Next")}
        ${tabButton("stats", "Statistik")}
      </nav>
          <button class="header-action" data-export-excel type="button">Excel exportieren</button>
        </div>
      </header>
    `;
  }

  function tabButton(view, label) {
    return `<button class="tab ${ui.view === view ? "is-active" : ""}" data-view="${view}" type="button">${label}</button>`;
  }

  function renderPlayedView(rooms) {
    const options = regionOptions()
      .map((option) => `<option value="${escapeHtml(option.value)}" ${ui.region === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("");

    return `
      <section class="toolbar">
        <label class="search-box">
          <span>Suche</span>
          <input type="search" id="played-search" value="${escapeHtml(ui.search)}" placeholder="Raum, Anbieter, Stadt">
        </label>
        <label>
          <span>Gebiet</span>
          <select id="region-filter">${options}</select>
        </label>
        <label>
          <span>Sortierung</span>
          <select id="sort-filter">
            ${selectOption("rating-desc", "Beste zuerst", ui.sort)}
            ${selectOption("rating-asc", "Schwächste zuerst", ui.sort)}
            ${selectOption("date-desc", "Neueste zuerst", ui.sort)}
            ${selectOption("city", "Stadt A-Z", ui.sort)}
            ${selectOption("scare-desc", "Horror hoch", ui.sort)}
            ${selectOption("difficulty-desc", "Difficulty hoch", ui.sort)}
          </select>
        </label>
        <button class="primary-action" data-open-room type="button">Raum eintragen</button>
      </section>

      ${renderKpis(rooms)}

      <section class="member-switch" aria-label="Nach Personen filtern">
        <span>Gespielt von</span>
        ${memberFilterButton("team", "Team")}
        ${alphabeticalMembers().map((member) => memberFilterButton(member, member)).join("")}
      </section>

      <section class="room-grid">
        ${rooms.length ? rooms.map(renderRoomCard).join("") : renderEmptyState("Keine Räume gefunden.")}
      </section>
    `;
  }

  function selectOption(value, label, current) {
    return `<option value="${value}" ${current === value ? "selected" : ""}>${label}</option>`;
  }

  function memberFilterButton(value, label) {
    const active = value === "team" ? !ui.selectedMembers.length : ui.selectedMembers.includes(value);
    return `<button class="chip ${active ? "is-active" : ""}" data-member-filter="${escapeHtml(value)}" type="button">${escapeHtml(label)}</button>`;
  }

  function renderKpis(rooms) {
    const averageScope = ui.selectedMembers.length ? getContextRooms() : rooms;
    const avgScore = averageOf(ratingValuesForRooms(averageScope, currentMembers()));

    return `
      <section class="kpi-grid played-kpis" aria-label="Kennzahlen">
        ${kpi("Räume", rooms.length)}
        ${kpi(ui.selectedMembers.length ? "Ø Auswahl" : "Team Ø", formatAverage(avgScore))}
      </section>
    `;
  }

  function kpi(label, value) {
    return `
      <article class="kpi">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </article>
    `;
  }

  function renderRoomCard(room) {
    const score = averageFor(room);
    const memberScores = alphabeticalMembers().map((member) => {
      const rating = room.ratings[member];
      const played = memberPlayedRoom(room, member);
      const label = typeof rating === "number" ? formatScore(rating) : played ? "-" : "–";
      return `<span class="rating-pill ${typeof rating !== "number" ? "is-muted" : ""} ${played ? "" : "is-unplayed"}">${escapeHtml(member)} ${label}</span>`;
    }).join("");
    const tags = room.tags.slice(0, 5).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

    return `
      <article class="room-card">
        <div class="room-card__head">
          <div>
            <h2>${escapeHtml(room.title || "Ohne Titel")}</h2>
            <p>${escapeHtml([room.provider, room.city].filter(Boolean).join(" · "))}</p>
          </div>
          <div class="score-badge">${formatScore(score)}</div>
        </div>
        <div class="mini-metrics">
          <span>Difficulty <strong>${formatScore(room.difficulty)}/5</strong></span>
          <span>Horror <strong>${formatScore(room.scare)}/5</strong></span>
          ${room.date ? `<span>${escapeHtml(formatDate(room.date))}</span>` : ""}
        </div>
        <div class="rating-row">${memberScores}</div>
        ${tags ? `<div class="tag-row">${tags}</div>` : ""}
        ${room.notes ? `<p class="note">${escapeHtml(room.notes)}</p>` : ""}
        <div class="card-actions">
          <button type="button" data-edit-room="${escapeHtml(room.id)}">Bearbeiten</button>
          <button type="button" data-delete-room="${escapeHtml(room.id)}">Entfernen</button>
        </div>
      </article>
    `;
  }

  function renderWishView() {
    const countries = ["all", ...Object.keys(countBy(data.wishList, (entry) => entry.country || "Ohne Land")).sort((a, b) => a.localeCompare(b, "de"))];
    const query = normalize(ui.wishSearch);
    const wishes = data.wishList
      .filter((entry) => ui.wishCountry === "all" || (entry.country || "Ohne Land") === ui.wishCountry)
      .filter((entry) => !query || normalize(`${entry.title} ${entry.provider} ${entry.city} ${entry.country} ${entry.notes}`).includes(query))
      .sort((a, b) => `${a.country} ${a.city} ${a.title}`.localeCompare(`${b.country} ${b.city} ${b.title}`, "de"));

    return `
      <section class="toolbar">
        <label class="search-box">
          <span>Suche</span>
          <input type="search" id="wish-search" value="${escapeHtml(ui.wishSearch)}" placeholder="Raum, Stadt, Land">
        </label>
        <label>
          <span>Land</span>
          <select id="wish-country">
            ${countries.map((country) => `<option value="${escapeHtml(country)}" ${ui.wishCountry === country ? "selected" : ""}>${escapeHtml(country === "all" ? `Alle (${data.wishList.length})` : country)}</option>`).join("")}
          </select>
        </label>
        <button class="primary-action" data-open-wish type="button">Geplanten Raum ergänzen</button>
      </section>
      <section class="wish-grid">
        ${wishes.length ? wishes.map(renderWishCard).join("") : renderEmptyState("Keine Pläne gefunden.")}
      </section>
    `;
  }

  function renderWishCard(entry) {
    return `
      <article class="wish-card">
        <div>
          <h2>${escapeHtml(entry.title || "Ohne Titel")}</h2>
          <p>${escapeHtml([entry.provider, entry.city, entry.country].filter(Boolean).join(" · "))}</p>
        </div>
        ${entry.notes ? `<p class="note">${escapeHtml(entry.notes)}</p>` : ""}
        ${entry.link ? `<a class="external-link" href="${escapeHtml(entry.link)}" target="_blank" rel="noreferrer">Website öffnen</a>` : ""}
        <div class="card-actions">
          <button type="button" data-move-wish="${escapeHtml(entry.id)}">Als gespielt</button>
          <button type="button" data-edit-wish="${escapeHtml(entry.id)}">Bearbeiten</button>
          <button type="button" data-delete-wish="${escapeHtml(entry.id)}">Entfernen</button>
        </div>
      </article>
    `;
  }

  function renderStatsView() {
    const roomsWithRatings = data.played.filter((room) => ratingValuesForRooms([room]).length);
    const roomsWithoutRatings = data.played.length - roomsWithRatings.length;
    const ratedRooms = data.played
      .map((room) => ({ room, score: averageFor(room, data.members) }))
      .filter((item) => typeof item.score === "number");
    const rankedTopRooms = rankRooms([...ratedRooms].sort((a, b) => b.score - a.score || a.room.title.localeCompare(b.room.title, "de")), 10);
    const cityStats = Object.entries(countBy(data.played, (room) => room.city))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    const topCity = cityStats[0];
    const highHorror = data.played.filter((room) => (room.scare ?? 0) >= 3).length;
    const difficultyAverage = averageOf(data.played.map((room) => room.difficulty).filter((value) => typeof value === "number"));
    const memberStats = data.members.map((member) => {
      const values = data.played.map((room) => room.ratings[member]).filter((value) => typeof value === "number");
      const playedCount = data.played.filter((room) => memberPlayedRoom(room, member)).length;
      return {
        member,
        count: playedCount,
        ratedCount: values.length,
        avg: averageOf(values),
      };
    }).sort((a, b) => b.count - a.count || b.ratedCount - a.ratedCount || (b.avg ?? 0) - (a.avg ?? 0));
    const providerStats = Object.entries(
      data.played.reduce((groups, room) => {
        const provider = room.provider || "Ohne Anbieter";
        const score = averageFor(room, data.members);
        if (typeof score !== "number") return groups;
        groups[provider] ||= [];
        groups[provider].push(score);
        return groups;
      }, {}),
    )
      .map(([provider, scores]) => ({ provider, count: scores.length, avg: averageOf(scores) }))
      .filter((stat) => stat.count >= 2)
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 10);
    const difficultyStats = Object.entries(countBy(
      data.played.filter((room) => typeof room.difficulty === "number"),
      (room) => String(room.difficulty),
    )).sort((a, b) => Number(a[0]) - Number(b[0]));
    const tagStats = Object.entries(countBy(
      data.played.flatMap((room) => room.tags || []),
      (tag) => tag,
    )).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const yearStats = Object.entries(countBy(
      data.played.filter((room) => /^\d{4}-/.test(room.date)),
      (room) => room.date.slice(0, 4),
    )).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10);
    const regionStats = regionPresetOptions()
      .map((region) => {
        return { ...region, count: region.roomIds.length };
      })
      .sort((a, b) => b.count - a.count || a.shortLabel.localeCompare(b.shortLabel, "de"));
    const splitRooms = data.played
      .map((room) => {
        const ratings = data.members
          .map((member) => ({ member, value: room.ratings[member] }))
          .filter((rating) => typeof rating.value === "number")
          .sort((a, b) => a.value - b.value || a.member.localeCompare(b.member, "de"));
        const lowest = ratings[0] || null;
        const highest = ratings[ratings.length - 1] || null;
        const spread = ratings.length >= 2 && lowest && highest ? highest.value - lowest.value : null;
        return {
          room,
          count: ratings.length,
          lowest,
          highest,
          spread,
        };
      })
      .filter((item) => typeof item.spread === "number" && item.spread >= 2.5)
      .sort((a, b) => b.spread - a.spread || b.count - a.count)
      .slice(0, 10);
    const maxCity = Math.max(1, ...cityStats.map(([, count]) => count));
    const maxDifficulty = Math.max(1, ...difficultyStats.map(([, count]) => count));
    const maxTags = Math.max(1, ...tagStats.map(([, count]) => count));
    const maxYears = Math.max(1, ...yearStats.map(([, count]) => count));
    const maxRegions = Math.max(1, ...regionStats.map((region) => region.count));

    return `
      <section class="stats-layout">
        <article class="panel panel-wide">
          <h2>Überblick</h2>
          <section class="kpi-grid compact-kpis" aria-label="Statistik-Kennzahlen">
            ${kpi("Gespielte Räume", data.played.length)}
            ${kpi("Bewertete Räume", roomsWithRatings.length)}
            ${kpi("Ohne Wertung", roomsWithoutRatings)}
            ${kpi("Team Ø", formatAverage(averageOf(ratingValuesForRooms(data.played, data.members))))}
            ${kpi("Top-Stadt", topCity ? `${topCity[0]} (${topCity[1]})` : "-")}
            ${kpi("Horror 3+", highHorror)}
            ${kpi("Ø Difficulty", `${formatAverage(difficultyAverage)}/5`)}
          </section>
        </article>
        <article class="panel">
          <h2>Top Räume</h2>
          <div class="rank-list">
            ${rankedTopRooms.map(({ room, score, rank }) => `
              <div class="rank-row">
                <span>${rank}</span>
                <strong>${escapeHtml(room.title)}</strong>
                <small>${escapeHtml(room.city)}</small>
                <b>${formatScore(score)}</b>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Städte nach Anzahl</h2>
          <div class="bar-list">
            ${cityStats.map(([city, count]) => `
              <div class="bar-row">
                <span>${escapeHtml(city)}</span>
                <div><i style="width: ${(count / maxCity) * 100}%"></i></div>
                <b>${count}</b>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Team</h2>
          <div class="member-table">
            ${memberStats.map((stat) => `
              <div>
                <strong>${escapeHtml(stat.member)}</strong>
                <span>${stat.count} gespielt · ${stat.ratedCount} Bewertungen</span>
                <b>${formatAverage(stat.avg)}</b>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Top Anbieter</h2>
          <p class="panel-help">Nur Anbieter mit mindestens 2 bewerteten Räumen; sortiert nach durchschnittlicher Team-Bewertung.</p>
          <div class="rank-list">
            ${providerStats.map((stat, index) => `
              <div class="rank-row">
                <span>${index + 1}</span>
                <strong>${escapeHtml(stat.provider)}</strong>
                <small>${stat.count} Räume</small>
                <b>${formatScore(stat.avg)}</b>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Regionen</h2>
          <div class="bar-list">
            ${regionStats.map((region) => `
              <div class="bar-row">
                <span>${escapeHtml(region.shortLabel)}</span>
                <div><i style="width: ${(region.count / maxRegions) * 100}%"></i></div>
                <b>${region.count}</b>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Horror</h2>
          <div class="rank-list">
            ${data.played
              .filter((room) => typeof room.scare === "number" && room.scare > 0)
              .sort((a, b) => b.scare - a.scare || (averageFor(b, data.members) ?? 0) - (averageFor(a, data.members) ?? 0))
              .slice(0, 10)
              .map((room, index) => `
                <div class="rank-row">
                  <span>${index + 1}</span>
                  <strong>${escapeHtml(room.title)}</strong>
                  <small>${escapeHtml(room.city)}</small>
                  <b>${formatScore(room.scare)}/5</b>
                </div>
              `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Difficulty</h2>
          <div class="bar-list">
            ${difficultyStats.map(([difficulty, count]) => `
              <div class="bar-row">
                <span>${escapeHtml(difficulty)}/5</span>
                <div><i style="width: ${(count / maxDifficulty) * 100}%"></i></div>
                <b>${count}</b>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Tags</h2>
          <div class="bar-list">
            ${tagStats.map(([tag, count]) => `
              <div class="bar-row">
                <span>${escapeHtml(tag)}</span>
                <div><i style="width: ${(count / maxTags) * 100}%"></i></div>
                <b>${count}</b>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Jahre</h2>
          <div class="bar-list">
            ${yearStats.map(([year, count]) => `
              <div class="bar-row">
                <span>${escapeHtml(year)}</span>
                <div><i style="width: ${(count / maxYears) * 100}%"></i></div>
                <b>${count}</b>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Kontrovers</h2>
          <p class="panel-help">Nur Räume mit mindestens 2,5 Punkten Unterschied zwischen höchster und niedrigster Einzelbewertung.</p>
          <div class="rank-list controversy-list">
            ${splitRooms.map(({ room, spread, lowest, highest }, index) => `
              <div class="rank-row controversy-row">
                <span>${index + 1}</span>
                <strong>${escapeHtml(room.title)}</strong>
                <small>${escapeHtml(`${lowest.member} ${formatScore(lowest.value)} · ${highest.member} ${formatScore(highest.value)}`)}</small>
                <b>${formatScore(spread)}</b>
              </div>
            `).join("")}
          </div>
        </article>
      </section>
    `;
  }

  function renderEmptyState(text) {
    return `<div class="empty-state">${escapeHtml(text)}</div>`;
  }

  function renderModal() {
    if (!ui.modal) return "";
    if (ui.modal.type === "room") return renderRoomModal(ui.modal.room, ui.modal.wishId);
    if (ui.modal.type === "wish") return renderWishModal(ui.modal.entry);
    return "";
  }

  function renderRoomModal(room = {}, wishId = "") {
    const ratings = normalizeRatings(room.ratings || {}, data.members);
    const playedBy = normalizePlayedBy(room.playedBy, ratings, data.members);
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">
          <form id="room-form">
            <input type="hidden" name="id" value="${escapeHtml(room.id || "")}">
            <input type="hidden" name="wishId" value="${escapeHtml(wishId)}">
            <div class="modal-head">
              <h2 id="room-modal-title">${room.id ? "Raum bearbeiten" : "Raum eintragen"}</h2>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <div class="form-grid">
              ${field("title", "Raum", room.title, "text", true)}
              ${field("provider", "Anbieter", room.provider, "text", false)}
              ${field("city", "Ort", room.city, "text", false)}
              ${field("date", "Datum", room.date, "date", false)}
              ${scoreControl("difficulty", "Difficulty", room.difficulty, [1, 2, 3, 4, 5])}
              ${scoreControl("scare", "Horror", room.scare, [0, 1, 2, 3, 4, 5])}
            </div>
            <div class="ratings-form">
              ${alphabeticalMembers().map((member) => memberRatingField(member, ratings[member], playedBy.includes(member))).join("")}
            </div>
            <label class="full-field">
              <span>Tags</span>
              <input name="tags" value="${escapeHtml((room.tags || []).join(", "))}" placeholder="Atmosphärisch, Teamwork, Wow-Effekt">
            </label>
            <label class="full-field">
              <span>Bemerkung</span>
              <textarea name="notes" rows="3">${escapeHtml(room.notes || "")}</textarea>
            </label>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit">Speichern</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderWishModal(entry = {}) {
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="wish-modal-title">
          <form id="wish-form">
            <input type="hidden" name="id" value="${escapeHtml(entry.id || "")}">
            <div class="modal-head">
              <h2 id="wish-modal-title">${entry.id ? "Plan bearbeiten" : "Plan eintragen"}</h2>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <div class="form-grid">
              ${field("title", "Raum", entry.title, "text", true)}
              ${field("provider", "Anbieter", entry.provider, "text", false)}
              ${field("country", "Land", entry.country, "text", false)}
              ${field("city", "Ort", entry.city, "text", false)}
            </div>
            <label class="full-field">
              <span>Link</span>
              <input name="link" type="url" value="${escapeHtml(entry.link || "")}">
            </label>
            <label class="full-field">
              <span>Anmerkungen</span>
              <textarea name="notes" rows="3">${escapeHtml(entry.notes || "")}</textarea>
            </label>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit">Speichern</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function field(name, label, value = "", type = "text", required = false, min = "", max = "", step = "") {
    return `
      <label>
        <span>${escapeHtml(label)}</span>
        <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}"
          ${required ? "required" : ""}
          ${min !== "" ? `min="${escapeHtml(min)}"` : ""}
          ${max !== "" ? `max="${escapeHtml(max)}"` : ""}
          ${step !== "" ? `step="${escapeHtml(step)}"` : ""}>
      </label>
    `;
  }

  function scoreControl(name, label, value, options) {
    return `
      <fieldset class="segmented-field">
        <legend>${escapeHtml(label)}</legend>
        <div class="segmented-options">
          ${options.map((option) => `
            <label class="segmented-option">
              <input type="radio" name="${escapeHtml(name)}" value="${option}" ${Number(value) === option ? "checked" : ""}>
              <span>${option}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function memberRatingField(member, value = "", played = false) {
    const numericValue = numberOrNull(value);
    const wholeValue = typeof numericValue === "number" ? Math.floor(numericValue) : null;
    const hasHalf = typeof numericValue === "number" && numericValue % 1 !== 0;
    const unrated = played && typeof numericValue !== "number";

    return `
      <div class="member-rating-field">
        <span>${escapeHtml(member)}</span>
        <div class="rating-button-grid" data-rating-group="${escapeHtml(member)}">
          ${Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => `
            <label class="rating-choice">
              <input data-rating-base="${escapeHtml(member)}" name="rating-base-${escapeHtml(member)}" type="radio" value="${rating}" ${wholeValue === rating ? "checked" : ""}>
              <span>${rating}</span>
            </label>
          `).join("")}
          <label class="rating-modifier">
            <input data-rating-half="${escapeHtml(member)}" name="rating-half-${escapeHtml(member)}" type="checkbox" ${hasHalf ? "checked" : ""}>
            <span>,5</span>
          </label>
          <label class="rating-modifier is-wide">
            <input data-rating-unrated="${escapeHtml(member)}" name="unrated-${escapeHtml(member)}" type="checkbox" ${unrated ? "checked" : ""}>
            <span>ohne Bewertung</span>
          </label>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    app.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.view = button.dataset.view;
        ui.notice = "";
        render();
      });
    });

    app.querySelectorAll("[data-refresh-cloud]").forEach((button) => {
      button.addEventListener("click", () => {
        void loadCloudState();
      });
    });

    app.querySelectorAll("[data-save-cloud]").forEach((button) => {
      button.addEventListener("click", () => {
        void saveCloudState();
      });
    });

    app.querySelectorAll("[data-export-excel]").forEach((button) => {
      button.addEventListener("click", exportExcelWorkbook);
    });

    const playedSearch = app.querySelector("#played-search");
    if (playedSearch) playedSearch.addEventListener("input", (event) => {
      ui.search = event.target.value;
      render();
    });

    const regionFilter = app.querySelector("#region-filter");
    if (regionFilter) regionFilter.addEventListener("change", (event) => {
      ui.region = event.target.value;
      render();
    });

    const sortFilter = app.querySelector("#sort-filter");
    if (sortFilter) sortFilter.addEventListener("change", (event) => {
      ui.sort = event.target.value;
      render();
    });

    app.querySelectorAll("[data-member-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const member = button.dataset.memberFilter;
        ui.selectedMembers = member === "team"
          ? []
          : ui.selectedMembers.includes(member)
            ? ui.selectedMembers.filter((entry) => entry !== member)
            : [...ui.selectedMembers, member];
        render();
      });
    });

    const wishSearch = app.querySelector("#wish-search");
    if (wishSearch) wishSearch.addEventListener("input", (event) => {
      ui.wishSearch = event.target.value;
      render();
    });

    const wishCountry = app.querySelector("#wish-country");
    if (wishCountry) wishCountry.addEventListener("change", (event) => {
      ui.wishCountry = event.target.value;
      render();
    });

    const roomButton = app.querySelector("[data-open-room]");
    if (roomButton) roomButton.addEventListener("click", () => {
      ui.modal = { type: "room", room: { ratings: {} } };
      render();
    });

    const wishButton = app.querySelector("[data-open-wish]");
    if (wishButton) wishButton.addEventListener("click", () => {
      ui.modal = { type: "wish", entry: {} };
      render();
    });

    app.querySelectorAll("[data-edit-room]").forEach((button) => {
      button.addEventListener("click", () => {
        const room = data.played.find((entry) => entry.id === button.dataset.editRoom);
        ui.modal = { type: "room", room: clone(room) };
        render();
      });
    });

    app.querySelectorAll("[data-delete-room]").forEach((button) => {
      button.addEventListener("click", () => {
        const room = data.played.find((entry) => entry.id === button.dataset.deleteRoom);
        if (!room || !confirm(`"${room.title}" entfernen?`)) return;
        data.played = data.played.filter((entry) => entry.id !== room.id);
        data.regionPresets.forEach((preset) => {
          preset.roomIds = (preset.roomIds || []).filter((id) => id !== room.id);
        });
        saveData();
        setNotice("Raum entfernt.");
      });
    });

    app.querySelectorAll("[data-edit-wish]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = data.wishList.find((item) => item.id === button.dataset.editWish);
        ui.modal = { type: "wish", entry: clone(entry) };
        render();
      });
    });

    app.querySelectorAll("[data-delete-wish]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = data.wishList.find((item) => item.id === button.dataset.deleteWish);
        if (!entry || !confirm(`"${entry.title}" entfernen?`)) return;
        data.wishList = data.wishList.filter((item) => item.id !== entry.id);
        saveData();
        setNotice("Plan entfernt.");
      });
    });

    app.querySelectorAll("[data-move-wish]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = data.wishList.find((item) => item.id === button.dataset.moveWish);
        ui.modal = {
          type: "room",
          wishId: entry.id,
          room: {
            title: entry.title,
            provider: entry.provider,
            city: entry.city,
            scare: 0,
            difficulty: 1,
            ratings: {},
            notes: entry.notes,
            tags: [],
          },
        };
        render();
      });
    });

    app.querySelectorAll("[data-close-modal]").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target !== element && !element.matches("button")) return;
        ui.modal = null;
        render();
      });
    });

    const roomForm = app.querySelector("#room-form");
    if (roomForm) roomForm.addEventListener("submit", saveRoomFromForm);

    app.querySelectorAll("[data-rating-base]").forEach((input) => {
      input.addEventListener("change", () => {
        const group = input.closest("[data-rating-group]");
        const unrated = group?.querySelector("[data-rating-unrated]");
        if (unrated) unrated.checked = false;
      });
    });

    app.querySelectorAll("[data-rating-unrated]").forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) return;
        const group = input.closest("[data-rating-group]");
        group?.querySelectorAll("[data-rating-base]").forEach((entry) => {
          entry.checked = false;
        });
        const half = group?.querySelector("[data-rating-half]");
        if (half) half.checked = false;
      });
    });

    const wishForm = app.querySelector("#wish-form");
    if (wishForm) wishForm.addEventListener("submit", saveWishFromForm);

  }

  function saveRoomFromForm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = clean(form.get("id")) || makeId("room");
    const ratings = Object.fromEntries(
      data.members.map((member) => [member, ratingFromForm(form, member)]),
    );
    const playedBy = data.members.filter((member) => (
      typeof ratings[member] === "number" || form.get(`unrated-${member}`) === "on"
    ));
    const values = Object.values(ratings).filter((value) => typeof value === "number");
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const existing = data.played.find((room) => room.id === id);
    const city = clean(form.get("city"));
    const room = {
      ...(existing || {}),
      id,
      title: clean(form.get("title")),
      provider: clean(form.get("provider")),
      city,
      date: clean(form.get("date")),
      difficulty: numberOrNull(form.get("difficulty")),
      scare: numberOrNull(form.get("scare")),
      ratings,
      playedBy,
      average: average === null ? null : Number(average.toFixed(2)),
      importedAverage: existing?.importedAverage ?? null,
      notes: clean(form.get("notes")),
      tags: splitTags(form.get("tags")),
      sourceSheets: existing?.sourceSheets || ["App"],
      regions: detectedRegionNamesForCity(city),
    };

    if (existing) {
      data.played = data.played.map((entry) => (entry.id === id ? room : entry));
    } else {
      data.played = [room, ...data.played];
    }

    const wishId = clean(form.get("wishId"));
    if (wishId) data.wishList = data.wishList.filter((entry) => entry.id !== wishId);

    saveData();
    ui.modal = null;
    setNotice("Raum gespeichert.");
  }

  function ratingFromForm(form, member) {
    const base = numberOrNull(form.get(`rating-base-${member}`));
    if (typeof base !== "number") return null;
    const half = form.get(`rating-half-${member}`) === "on" && base < 10 ? 0.5 : 0;
    return base + half;
  }

  function saveWishFromForm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = clean(form.get("id")) || makeId("wish");
    const entry = {
      id,
      title: clean(form.get("title")),
      provider: clean(form.get("provider")),
      country: clean(form.get("country")),
      city: clean(form.get("city")),
      link: clean(form.get("link")),
      notes: clean(form.get("notes")),
      status: "interessant",
      priority: "normal",
    };
    const exists = data.wishList.some((item) => item.id === id);
    data.wishList = exists
      ? data.wishList.map((item) => (item.id === id ? entry : item))
      : [entry, ...data.wishList];
    saveData();
    ui.modal = null;
    setNotice("Plan gespeichert.");
  }

  function setNotice(message) {
    ui.notice = message;
    render();
    window.setTimeout(() => {
      if (ui.notice === message) {
        ui.notice = "";
        render();
      }
    }, 2400);
  }
}());
