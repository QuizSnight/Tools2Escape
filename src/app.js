(function () {
  "use strict";

  const STORAGE_KEY = "tools2escape:v2";
  const SHARE_DB_NAME = "tools2escape-share-target";
  const SHARE_DB_VERSION = 1;
  const SHARE_STORE_NAME = "shares";
  const SHARE_PENDING_KEY = "pending";
  const MAX_CLOUD_SAVE_RETRIES = 3;
  const config = window.T2E_CONFIG || {};
  const planningData = window.T2E_PLANNING_DATA || {
    updatedAt: "",
    terpecaYear: 2025,
    sources: {},
    terpeca: [],
    escaperoomers: [],
  };
  const seed = window.T2E_SEED_DATA || {
    version: 1,
    sourceFile: "",
    importedAt: "",
    members: ["Sebi", "Elisa", "Lara", "Nikolai", "Ari"],
    played: [],
    wishList: [],
    trips: [],
    other: [],
    regionPresets: [],
  };
  const REGION_ORDER = ["DE", "Athen", "NRW", "HH", "BENELUX", "SPAIN", "POLAND", "HUNGARY", "CZECHIA", "FRANCE", "IRELAND", "UK", "PORTUGAL", "ITALY", "FINLAND", "CROATIA"];
  const ROOM_MILESTONES = new Set([50, 100, 200, 250, 300, 400, 500]);
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
    CANADA: "Kanada",
  };
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
    Israel: "Israel",
    Italy: "Italien",
    Kosovo: "Kosovo",
    Latvia: "Lettland",
    Luxembourg: "Luxemburg",
    Netherlands: "Niederlande",
    "North Macedonia": "Nordmazedonien",
    Poland: "Polen",
    Portugal: "Portugal",
    Romania: "Rumänien",
    Scandinavia: "Skandinavien",
    Serbia: "Serbien",
    Slovakia: "Slowakei",
    Slovenia: "Slowenien",
    Spain: "Spanien",
    Switzerland: "Schweiz",
    "United Kingdom": "UK",
    "United States": "USA",
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
  const FRANCE_CITIES = new Set(["lille", "paris", "strasbourg", "strassbourg"]);
  const IRELAND_CITIES = new Set(["dublin"]);
  const UK_CITIES = new Set(["london"]);
  const PORTUGAL_CITIES = new Set(["lisbon", "lisboa", "lissabon"]);
  const ITALY_CITIES = new Set(["rom", "roma", "rome"]);
  const FINLAND_CITIES = new Set(["helsinki"]);
  const CROATIA_CITIES = new Set(["zagreb"]);
  const CANADA_CITIES = new Set(["laval", "montreal", "montréal", "quebec", "quebec city", "québec", "québec city"]);
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
    "heilbronn",
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
    "neuwied",
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
    CANADA: CANADA_CITIES,
  };
  const VIRTUAL_REGION_NAMES = ["SPAIN", "POLAND", "HUNGARY", "CZECHIA", "FRANCE", "IRELAND", "UK", "PORTUGAL", "ITALY", "FINLAND", "CROATIA", "CANADA"];
  const GEOCODE_CACHE_KEY = "tools2escape:geocode-cache:v1";
  const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const ROUTE_API_URL = "https://router.project-osrm.org/route/v1/driving/";
  const ROOM_IMPORT_API_PATH = "/api/import-room";
  const TESSERACT_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
  const PDFJS_MODULE_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.min.mjs";
  const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";
  const MAX_PDF_PAGES = 12;
  const MAX_WEBSITE_IMPORT_CHARS = 900000;
  const DEFAULT_TRIP_START_ADDRESS = "Montanusstr. 6, 51065 Köln";
  const TRIP_ITEM_LABELS = {
    start: "Startadresse",
    escape: "Escape Room",
    accommodation: "Unterkunft",
    other: "Sonstiges",
  };
  const CITY_COORDS = {
    aachen: [50.7753, 6.0839],
    amersfoort: [52.1561, 5.3878],
    amsterdam: [52.3676, 4.9041],
    as: [51.0072, 5.5847],
    athen: [37.9838, 23.7275],
    athens: [37.9838, 23.7275],
    baarn: [52.2117, 5.2875],
    "bad salzuflen": [52.0862, 8.7443],
    "bad steben": [50.3667, 11.6333],
    balingen: [48.2753, 8.8547],
    bamberg: [49.8988, 10.9028],
    barcelona: [41.3874, 2.1686],
    bemmel: [51.8917, 5.8986],
    berga: [42.1043, 1.8467],
    berlin: [52.52, 13.405],
    bielefeld: [52.0302, 8.5325],
    bochum: [51.4818, 7.2162],
    bonn: [50.7374, 7.0982],
    bottrop: [51.5291, 6.9447],
    braunschweig: [52.2689, 10.5268],
    breslau: [51.1079, 17.0385],
    brugge: [51.2093, 3.2247],
    bruhl: [50.8293, 6.9057],
    brussel: [50.8503, 4.3517],
    brussels: [50.8503, 4.3517],
    bruxelles: [50.8503, 4.3517],
    budapest: [47.4979, 19.0402],
    burgum: [53.1928, 5.9903],
    "castrop rauxel": [51.5566, 7.3116],
    "den haag": [52.0705, 4.3007],
    dorsten: [51.6617, 6.9651],
    dortmund: [51.5136, 7.4653],
    dublin: [53.3498, -6.2603],
    duisburg: [51.4344, 6.7623],
    dusseldorf: [51.2277, 6.7735],
    duesseldorf: [51.2277, 6.7735],
    essen: [51.4556, 7.0116],
    frankfurt: [50.1109, 8.6821],
    frechen: [50.9149, 6.8118],
    friedrichshafen: [47.6500, 9.4800],
    gelnhausen: [50.2016, 9.1874],
    "gelnhausen frankfurt": [50.2016, 9.1874],
    gelsenkirchen: [51.5177, 7.0857],
    gottingen: [51.5413, 9.9158],
    goettingen: [51.5413, 9.9158],
    hagen: [51.3671, 7.4633],
    hamburg: [53.5511, 9.9937],
    hannover: [52.3759, 9.7320],
    heilbronn: [49.1427, 9.2109],
    helsinki: [60.1699, 24.9384],
    herne: [51.5369, 7.2009],
    hilversum: [52.2292, 5.1669],
    ixelles: [50.8333, 4.3667],
    lille: [50.6292, 3.0573],
    katwijk: [52.1942, 4.4222],
    koblenz: [50.3569, 7.5890],
    koln: [50.9375, 6.9603],
    koeln: [50.9375, 6.9603],
    krefeld: [51.3388, 6.5853],
    langenfeld: [51.1082, 6.9483],
    leiden: [52.1601, 4.4970],
    lier: [51.1313, 4.5704],
    limburg: [50.3836, 8.0503],
    lippstadt: [51.6737, 8.3448],
    laval: [45.6066, -73.7124],
    lissabon: [38.7223, -9.1393],
    lisboa: [38.7223, -9.1393],
    lisbon: [38.7223, -9.1393],
    london: [51.5072, -0.1276],
    luxembourg: [49.6116, 6.1319],
    luxemburg: [49.6116, 6.1319],
    maaseik: [51.0980, 5.7838],
    mechelen: [51.0259, 4.4775],
    montreal: [45.5017, -73.5673],
    montréal: [45.5017, -73.5673],
    moenchengladbach: [51.1805, 6.4428],
    monchengladbach: [51.1805, 6.4428],
    moordrecht: [51.9867, 4.6694],
    munchen: [48.1351, 11.5820],
    muenchen: [48.1351, 11.5820],
    naarden: [52.2958, 5.1625],
    neuwied: [50.4333, 7.4667],
    niederkassel: [50.8150, 7.0378],
    oberhausen: [51.4963, 6.8638],
    obernkirchen: [52.2728, 9.1295],
    paderborn: [51.7189, 8.7575],
    paris: [48.8566, 2.3522],
    posen: [52.4064, 16.9252],
    poznan: [52.4064, 16.9252],
    prag: [50.0755, 14.4378],
    prague: [50.0755, 14.4378],
    praha: [50.0755, 14.4378],
    quebec: [46.8139, -71.2080],
    "quebec city": [46.8139, -71.2080],
    québec: [46.8139, -71.2080],
    "québec city": [46.8139, -71.2080],
    remscheid: [51.1787, 7.1897],
    retie: [51.2670, 5.0824],
    reutlingen: [48.4914, 9.2043],
    rijswijk: [52.0377, 4.3210],
    rom: [41.9028, 12.4964],
    roma: [41.9028, 12.4964],
    schijndel: [51.6200, 5.4319],
    siegburg: [50.8000, 7.2075],
    strassbourg: [48.5734, 7.7521],
    strasbourg: [48.5734, 7.7521],
    tubingen: [48.5216, 9.0576],
    tuebingen: [48.5216, 9.0576],
    utrecht: [52.0907, 5.1214],
    volkel: [51.6425, 5.6542],
    voorburg: [52.0742, 4.3597],
    waalwijk: [51.6825, 5.0708],
    warschau: [52.2297, 21.0122],
    warsaw: [52.2297, 21.0122],
    witten: [51.4439, 7.3522],
    wuppertal: [51.2562, 7.1508],
    zagreb: [45.8150, 15.9819],
    zoersel: [51.2678, 4.7120],
  };
  const COUNTRY_REGION_ALIASES = {
    DE: ["deutschland", "germany", "de"],
    Athen: ["griechenland", "greece"],
    BENELUX: ["belgien", "belgium", "niederlande", "netherlands", "luxemburg", "luxembourg"],
    SPAIN: ["spanien", "spain", "espana"],
    POLAND: ["polen", "poland"],
    HUNGARY: ["ungarn", "hungary"],
    CZECHIA: ["tschechien", "czechia", "czech republic"],
    FRANCE: ["frankreich", "france"],
    IRELAND: ["irland", "ireland"],
    UK: ["uk", "united kingdom", "england", "grossbritannien", "großbritannien"],
    PORTUGAL: ["portugal"],
    ITALY: ["italien", "italy"],
    FINLAND: ["finnland", "finland"],
    CROATIA: ["kroatien", "croatia"],
    CANADA: ["kanada", "canada", "quebec", "québec"],
  };

  const ui = {
    view: "played",
    search: "",
    region: "all",
    sort: "rating-desc",
    selectedMembers: [],
    wishSearch: "",
    wishCountry: "all",
    tripSearch: "",
    activeTripId: "",
    planningSource: "terpeca",
    planningRegion: "all",
    planningStatus: "unplayed",
    planningSearch: "",
    mapSource: "played",
    mapSearch: "",
    mapRegion: "all",
    mapPlanningStatus: "unplayed",
    planTargetTripId: "",
    bulkPlanMode: false,
    bulkPlanContext: "",
    bulkPlanSelection: [],
    restoreScrollY: null,
    notice: "",
    modal: null,
    celebrations: [],
  };

  const cloud = {
    enabled: hasSupabaseConfig(),
    client: null,
    loading: false,
    saving: false,
    error: "",
    lastSyncedAt: "",
    channel: null,
    basePayload: null,
  };

  let saveQueued = false;
  let localDirty = false;
  let sheetsSyncTimer = null;
  let applyingRemoteData = false;
  let ocrScriptPromise = null;
  let pdfJsPromise = null;
  let data = loadData();
  let pendingShare = null;
  const mapState = {
    map: null,
    layer: null,
    container: null,
    groups: [],
    viewportKey: "",
    lastView: null,
    listListenerAttached: false,
    geocodeCache: loadGeocodeCache(),
    pendingGeocodes: new Set(),
  };
  const tripPlanMapState = {
    map: null,
    layer: null,
    routeLayer: null,
    container: null,
    tripId: "",
    viewByTripId: new Map(),
    listenerAttached: false,
    routeCache: new Map(),
    pendingRoutes: new Set(),
  };

  const app = document.getElementById("app");

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    render();
    if (cloud.enabled) await initCloud();
    await openSharedBooking();
  }

  async function openSharedBooking() {
    const url = new URL(window.location.href);
    const shareTarget = url.searchParams.get("share-target");
    if (!shareTarget) return;

    url.searchParams.delete("share-target");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

    if (shareTarget === "error") {
      setNotice("Die geteilte Buchung konnte nicht übernommen werden.");
      return;
    }
    if (shareTarget !== "pending") return;

    try {
      pendingShare = await readPendingShare();
      if (!pendingShare) throw new Error("Keine geteilte Buchung gefunden.");
      ui.view = "trips";
      ui.activeTripId = "";
      ui.modal = { type: "tripShare" };
      render();
    } catch (error) {
      setNotice(error.message || "Die geteilte Buchung konnte nicht geöffnet werden.");
    }
  }

  function openShareDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("Der Browser unterstützt den Buchungsimport nicht."));
        return;
      }

      const request = window.indexedDB.open(SHARE_DB_NAME, SHARE_DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(SHARE_STORE_NAME)) {
          database.createObjectStore(SHARE_STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readPendingShare() {
    const database = await openShareDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(SHARE_STORE_NAME, "readonly");
      const request = transaction.objectStore(SHARE_STORE_NAME).get(SHARE_PENDING_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
    });
  }

  async function clearPendingShare() {
    pendingShare = null;
    const database = await openShareDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(SHARE_STORE_NAME, "readwrite");
      transaction.objectStore(SHARE_STORE_NAME).delete(SHARE_PENDING_KEY);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
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

  function loadGeocodeCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || "{}");
      return cached && typeof cached === "object" ? cached : {};
    } catch {
      return {};
    }
  }

  function saveGeocodeCache() {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(mapState.geocodeCache));
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
      trips: Array.isArray(input.trips) ? input.trips : [],
      other: Array.isArray(input.other) ? input.other : [],
      regionPresets: Array.isArray(input.regionPresets) ? input.regionPresets : [],
      planningLinks: input.planningLinks && typeof input.planningLinks === "object" && !Array.isArray(input.planningLinks)
        ? input.planningLinks
        : {},
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
      pricePerPerson: numberOrNull(entry.pricePerPerson) ?? priceFromText(entry.notes),
      availableSlots: normalizeTimeSlots(entry.availableSlots),
      status: clean(entry.status) || "interessant",
      priority: clean(entry.priority) || "normal",
    }));

    merged.trips = merged.trips.map((trip) => normalizeTrip(trip, merged.members));

    merged.updatedAt = input.updatedAt || new Date().toISOString();
    return merged;
  }

  function normalizeTrip(trip, members = seed.members) {
    return {
      id: trip.id || makeId("trip"),
      name: clean(trip.name),
      startDate: clean(trip.startDate),
      endDate: clean(trip.endDate),
      destination: clean(trip.destination),
      notes: clean(trip.notes),
      planningFinalized: Boolean(trip.planningFinalized),
      items: Array.isArray(trip.items) ? trip.items.map(normalizeTripItem) : [],
      planItems: Array.isArray(trip.planItems) ? trip.planItems.map(normalizeTripPlanItem) : [],
      expenses: Array.isArray(trip.expenses) ? trip.expenses.map((expense) => normalizeTripExpense(expense, members)) : [],
      createdAt: clean(trip.createdAt) || new Date().toISOString(),
    };
  }

  function normalizeTripItem(item) {
    const type = Object.prototype.hasOwnProperty.call(TRIP_ITEM_LABELS, item.type) ? item.type : "escape";
    const isUntimed = type === "accommodation" || type === "start";
    const address = clean(item.address) || (type === "start" ? DEFAULT_TRIP_START_ADDRESS : "");
    const city = clean(item.city) || extractCityFromAddress(address);
    const duration = isUntimed
      ? null
      : numberOrNull(item.duration) ?? durationBetweenTimes(item.time, item.endTime);
    return {
      id: item.id || makeId("trip-item"),
      type,
      title: clean(item.title) || (type === "start" ? "Startadresse" : ""),
      provider: clean(item.provider),
      date: clean(item.date),
      time: isUntimed ? "" : roundToQuarterHour(item.time),
      endDate: type === "accommodation" ? clean(item.endDate) : "",
      duration,
      endTime: isUntimed ? "" : addMinutesToTime(roundToQuarterHour(item.time), duration),
      address,
      city,
      bookingReference: clean(item.bookingReference),
      link: clean(item.link),
      notes: clean(item.notes),
      sourceName: clean(item.sourceName),
      playedRoomId: clean(item.playedRoomId),
      pricePerPerson: numberOrNull(item.pricePerPerson) ?? priceFromText(item.notes),
      availableSlots: normalizeTimeSlots(item.availableSlots),
    };
  }

  function normalizeTripPlanItem(item) {
    const coords = Array.isArray(item.coords)
      ? item.coords.map(Number).filter(Number.isFinite)
      : null;
    const address = clean(item.address);
    const city = clean(item.city) || extractCityFromAddress(address);
    const inferredCountry = countryFromCity(city) || countryFromAddress(address);
    return {
      id: item.id || makeId("trip-plan"),
      sourceType: clean(item.sourceType),
      sourceId: clean(item.sourceId),
      tripItemId: clean(item.tripItemId),
      title: clean(item.title),
      provider: clean(item.provider),
      country: germanCountry(inferredCountry || item.country),
      city,
      address,
      date: clean(item.date),
      time: roundToQuarterHour(item.time),
      duration: numberOrNull(item.duration),
      pricePerPerson: numberOrNull(item.pricePerPerson) ?? priceFromText([item.notes, item.title].filter(Boolean).join(" ")),
      availableSlots: normalizeTimeSlots(item.availableSlots),
      link: clean(item.link),
      notes: clean(item.notes),
      coords: coords && coords.length === 2 ? coords : null,
    };
  }

  function normalizeTripExpense(expense, members = seed.members) {
    const participants = Array.isArray(expense.participants)
      ? expense.participants.map(clean).filter((member) => members.includes(member))
      : [];
    const payer = clean(expense.payer);
    return {
      id: expense.id || makeId("trip-expense"),
      title: clean(expense.title),
      amount: Math.max(0, numberOrNull(expense.amount) || 0),
      payer: members.includes(payer) ? payer : members[0],
      participants: participants.length ? unique(participants) : [...members],
      date: clean(expense.date),
      notes: clean(expense.notes),
      sourceType: clean(expense.sourceType),
      sourceId: clean(expense.sourceId),
      settlement: expense.settlement && typeof expense.settlement === "object"
        ? {
          from: clean(expense.settlement.from),
          to: clean(expense.settlement.to),
          amount: numberOrNull(expense.settlement.amount),
        }
        : null,
    };
  }

  function sharedItemKey(item, prefix, fields = []) {
    const id = clean(item?.id);
    if (id) return id;
    return `${prefix}:${fields.map((field) => normalize(item?.[field])).join("|")}`;
  }

  function playedMergeKey(room) {
    return sharedItemKey(room, "room", ["title", "provider", "city"]);
  }

  function wishMergeKey(entry) {
    return sharedItemKey(entry, "wish", ["title", "provider", "city"]);
  }

  function otherMergeKey(entry) {
    return sharedItemKey(entry, "other", ["title", "provider", "city"]);
  }

  function valueChangedFromBase(value, baseValue) {
    return JSON.stringify(value ?? null) !== JSON.stringify(baseValue ?? null);
  }

  function mergeRecord(base = {}, remote = {}, local = {}, exclude = []) {
    const excluded = new Set(exclude);
    const result = { ...(remote || {}) };
    const keys = new Set([
      ...Object.keys(base || {}),
      ...Object.keys(remote || {}),
      ...Object.keys(local || {}),
    ]);

    keys.forEach((key) => {
      if (excluded.has(key)) return;
      const baseValue = base ? base[key] : undefined;
      const remoteValue = remote ? remote[key] : undefined;
      const localValue = local ? local[key] : undefined;
      const remoteChanged = valueChangedFromBase(remoteValue, baseValue);
      const localChanged = valueChangedFromBase(localValue, baseValue);

      if (localValue === undefined && remoteValue !== undefined) result[key] = remoteValue;
      else if (remoteValue === undefined && localValue !== undefined) result[key] = localValue;
      else if (localChanged && !remoteChanged) result[key] = localValue;
      else if (!localChanged && remoteChanged) result[key] = remoteValue;
      else if (localChanged && remoteChanged && valueChangedFromBase(localValue, remoteValue)) result[key] = localValue;
      else result[key] = remoteValue;
    });

    return result;
  }

  function mergeCollection(baseItems = [], remoteItems = [], localItems = [], keyFn, mergeItem = mergeRecord) {
    const baseMap = new Map((baseItems || []).map((item) => [keyFn(item), item]).filter(([key]) => key));
    const remoteMap = new Map((remoteItems || []).map((item) => [keyFn(item), item]).filter(([key]) => key));
    const localMap = new Map((localItems || []).map((item) => [keyFn(item), item]).filter(([key]) => key));
    const keys = unique([
      ...baseMap.keys(),
      ...remoteMap.keys(),
      ...localMap.keys(),
    ]);

    return keys.map((key) => {
      const baseItem = baseMap.get(key);
      const remoteItem = remoteMap.get(key);
      const localItem = localMap.get(key);

      if (baseItem && !localItem && remoteItem && !valueChangedFromBase(remoteItem, baseItem)) return null;
      if (baseItem && !remoteItem && localItem && !valueChangedFromBase(localItem, baseItem)) return null;
      if (remoteItem && localItem) return mergeItem(baseItem || {}, remoteItem, localItem);
      return clone(localItem || remoteItem);
    }).filter(Boolean);
  }

  function mergeTrip(baseTrip = {}, remoteTrip = {}, localTrip = {}) {
    const trip = mergeRecord(baseTrip, remoteTrip, localTrip, ["items", "planItems", "expenses"]);
    trip.items = mergeCollection(
      baseTrip.items || [],
      remoteTrip.items || [],
      localTrip.items || [],
      (item) => sharedItemKey(item, "trip-item", ["type", "title", "date", "time"]),
      mergeRecord,
    );
    trip.planItems = mergeCollection(
      baseTrip.planItems || [],
      remoteTrip.planItems || [],
      localTrip.planItems || [],
      (item) => sharedItemKey(item, "trip-plan", ["title", "provider", "sourceId"]),
      mergeRecord,
    );
    trip.expenses = mergeCollection(
      baseTrip.expenses || [],
      remoteTrip.expenses || [],
      localTrip.expenses || [],
      (expense) => sharedItemKey(expense, "trip-expense", ["title", "amount", "payer", "date"]),
      mergeRecord,
    );
    return trip;
  }

  function mergePlanningLinks(remoteLinks = {}, localLinks = {}) {
    return {
      ...(remoteLinks && typeof remoteLinks === "object" ? remoteLinks : {}),
      ...(localLinks && typeof localLinks === "object" ? localLinks : {}),
    };
  }

  function mergeSharedData(basePayload, remotePayload, localPayload) {
    const baseData = basePayload ? normalizeData(basePayload) : normalizeData({});
    const remoteData = remotePayload ? normalizeData(remotePayload) : normalizeData({});
    const localData = localPayload ? normalizeData(localPayload) : normalizeData({});
    const merged = mergeRecord(baseData, remoteData, localData, [
      "played",
      "wishList",
      "trips",
      "other",
      "regionPresets",
      "planningLinks",
    ]);

    merged.played = mergeCollection(baseData.played, remoteData.played, localData.played, playedMergeKey, mergeRecord);
    merged.wishList = mergeCollection(baseData.wishList, remoteData.wishList, localData.wishList, wishMergeKey, mergeRecord);
    merged.trips = mergeCollection(
      baseData.trips,
      remoteData.trips,
      localData.trips,
      (trip) => sharedItemKey(trip, "trip", ["name", "startDate", "endDate"]),
      mergeTrip,
    );
    merged.other = mergeCollection(baseData.other, remoteData.other, localData.other, otherMergeKey, mergeRecord);
    merged.regionPresets = mergeCollection(
      baseData.regionPresets,
      remoteData.regionPresets,
      localData.regionPresets,
      (region) => sharedItemKey(region, "region", ["key", "name", "label"]),
      mergeRecord,
    );
    merged.planningLinks = mergePlanningLinks(remoteData.planningLinks, localData.planningLinks);
    merged.updatedAt = new Date().toISOString();
    return normalizeData(merged);
  }

  function applyCloudPayload(payload, updatedAt = "") {
    const remote = normalizeData(payload);
    const hasLocalChanges = localDirty || saveQueued || cloud.saving;

    applyingRemoteData = true;
    if (hasLocalChanges) {
      data = mergeSharedData(cloud.basePayload, remote, data);
      cloud.basePayload = clone(remote);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      applyingRemoteData = false;
      cloud.lastSyncedAt = updatedAt || cloud.lastSyncedAt;
      queueCloudSave();
      return;
    }

    data = remote;
    cloud.basePayload = clone(remote);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    applyingRemoteData = false;
    cloud.lastSyncedAt = updatedAt || cloud.lastSyncedAt;
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
    if (!applyingRemoteData) {
      localDirty = true;
      queueCloudSave();
      queueGoogleSheetsSync();
    }
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
        applyCloudPayload(row.payload, row.updated_at || "");
      } else {
        localDirty = true;
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
          applyCloudPayload(payload.new.payload, payload.new.updated_at || "");
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

    try {
      let savedRow = null;
      for (let attempt = 0; attempt < MAX_CLOUD_SAVE_RETRIES; attempt += 1) {
        const { data: currentRow, error: fetchError } = await cloud.client
          .from("team_state")
          .select("payload,updated_at")
          .eq("id", config.teamId)
          .single();

        if (fetchError) throw fetchError;
        const remotePayload = currentRow?.payload && Array.isArray(currentRow.payload.played)
          ? currentRow.payload
          : {};
        const payload = mergeSharedData(cloud.basePayload, remotePayload, data);

        const { data: row, error } = await cloud.client
          .from("team_state")
          .update({ payload })
          .eq("id", config.teamId)
          .eq("updated_at", currentRow.updated_at)
          .select("payload,updated_at")
          .maybeSingle();

        if (error) throw error;
        if (row) {
          savedRow = row;
          break;
        }
      }

      if (!savedRow) {
        saveQueued = true;
        throw new Error("Der Datenstand wurde parallel geändert. Ich versuche den Sync gleich erneut.");
      }

      applyingRemoteData = true;
      data = normalizeData(savedRow.payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      applyingRemoteData = false;
      cloud.basePayload = clone(data);
      localDirty = false;
      cloud.lastSyncedAt = savedRow.updated_at || new Date().toISOString();
    } catch (error) {
      cloud.error = readableCloudError(error);
    } finally {
      cloud.saving = false;
      render();
    }
  }

  function hasGoogleSheetsSyncConfig() {
    return Boolean(config.googleSheetsWebhookUrl && !new URLSearchParams(window.location.search).has("qa"));
  }

  function queueGoogleSheetsSync() {
    if (!hasGoogleSheetsSyncConfig()) return;
    window.clearTimeout(sheetsSyncTimer);
    sheetsSyncTimer = window.setTimeout(() => {
      void syncGoogleSheetsState();
    }, 900);
  }

  async function syncGoogleSheetsState() {
    if (!hasGoogleSheetsSyncConfig()) return;
    const payload = {
      updatedAt: new Date().toISOString(),
      source: "Tools2EscApp",
      sheets: exportSheets().map((sheet) => ({
        name: safeSheetName(sheet.name),
        rows: rowsForGoogleSheets(sheet.rows),
      })),
    };

    try {
      await fetch(config.googleSheetsWebhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn("Google Sheets sync failed", error);
    }
  }

  function rowsForGoogleSheets(rows) {
    return rows.map((row) => row.map((cell) => {
      if (cell && typeof cell === "object" && typeof cell.f === "string") return cell.v ?? "";
      return cell ?? "";
    }));
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

  function germanCountry(value) {
    const text = clean(value);
    if (!text) return "";
    const match = Object.entries(COUNTRY_LABELS_DE).find(([english, german]) =>
      normalize(text) === normalize(english) || normalize(text) === normalize(german));
    return match ? match[1] : text;
  }

  function planningRegionLabel(value) {
    return germanCountry(value);
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

  function normalizeTimeSlots(value) {
    const values = Array.isArray(value) ? value : splitTags(value);
    return unique(values
      .map((entry) => roundToQuarterHour(clean(entry).replace(".", ":")))
      .filter(Boolean))
      .sort();
  }

  function priceFromText(value) {
    const source = String(value || "");
    const text = clean(source);
    if (!text) return null;
    const fivePlayerPrice = priceForPlayerCount(source, 5);
    if (fivePlayerPrice) return fivePlayerPrice;
    const perPerson = text.match(/(?:ab\s*)?(?:€|eur)?\s*(\d{1,3}(?:[,.]\d{1,2})?)\s*(?:€|eur)?\s*(?:p\.?\s*p\.?|pro person|per person|je person|pro spieler|per player|pro player|je spieler|\/\s*(?:spieler|player|person))/i);
    if (perPerson) return numberOrNull(perPerson[1]);
    const fivePeopleTotal = text.match(/(?:5\s*(?:personen|players|spieler|adults|erwachsene)[^\d€]{0,80})(\d{2,4}(?:[,.]\d{1,2})?)\s*(?:€|eur)/i)
      || text.match(/(\d{2,4}(?:[,.]\d{1,2})?)\s*(?:€|eur)[^\d]{0,80}5\s*(?:personen|players|spieler|adults|erwachsene)/i)
      || text.match(/(?:preis|price|total|gesamtpreis)[^\n€]{0,60}5[^\n€]{0,40}(\d{2,4}(?:[,.]\d{1,2})?)\s*(?:€|eur)/i);
    if (fivePeopleTotal) {
      const total = numberOrNull(fivePeopleTotal[1]);
      return total ? Math.round((total / 5) * 100) / 100 : null;
    }
    return null;
  }

  function priceForPlayerCount(value, count) {
    const source = String(value || "").replace(/\u00a0/g, " ");
    const text = clean(source);
    const playerLabel = "(?:personen|persons|players|spieler|adults|erwachsene)";
    const price = "(\\d{1,4}(?:[,.]\\d{1,2})?)\\s*(?:€|eur)";
    const patterns = [
      new RegExp(`\\b${count}\\s*${playerLabel}\\b[^\\d€]{0,50}${price}(?:\\s*(?:p\\.?\\s*p\\.?|pro person|per person|je person|pro spieler|per player|pro player|je spieler))?`, "gi"),
      new RegExp(`(?:mission|price|preis|standard modus|booking|buchung)[^\\n€]{0,80}\\b${count}\\s*${playerLabel}\\b[^\\d€]{0,50}${price}`, "gi"),
    ];
    const candidates = [];

    patterns.forEach((pattern) => {
      for (const match of text.matchAll(pattern)) {
        const amount = numberOrNull(match[1]);
        if (!amount) continue;
        const context = match[0];
        const perPerson = /(?:p\.?\s*p\.?|pro person|per person|je person|pro spieler|per player|pro player|je spieler)/i.test(context);
        const total = perPerson || amount < 80 ? amount : Math.round((amount / count) * 100) / 100;
        let score = perPerson ? 35 : 25;
        if (new RegExp(`\\b${count}\\s*${playerLabel}\\b`, "i").test(context)) score += 8;
        if (/(?:standard modus|preise|prices|price|preis|mission for|booking|buchung)/i.test(context)) score += 12;
        if (/(?:voucher|gift|gutschein|other amount)/i.test(context)) score -= 3;
        candidates.push({ value: total, score, context });
      }
    });

    return candidates
      .filter((candidate) => candidate.value >= 5 && candidate.value <= 120)
      .sort((a, b) => b.score - a.score || a.value - b.value)[0]?.value || null;
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

  function playedCountsByMember(rooms = data.played) {
    return Object.fromEntries(data.members.map((member) => [
      member,
      rooms.filter((room) => memberPlayedRoom(room, member)).length,
    ]));
  }

  function roomMilestoneCelebrations(beforeCounts, afterCounts) {
    return data.members
      .map((member) => ({ member, count: afterCounts[member] || 0 }))
      .filter((entry) => ROOM_MILESTONES.has(entry.count) && entry.count > (beforeCounts[entry.member] || 0));
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

  function formatCurrency(value) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(numberOrNull(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.valueOf())) return value;
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }

  function formatDurationLabel(value) {
    const duration = numberOrNull(value);
    return duration === null ? "" : `${formatScore(duration)} Min.`;
  }

  function linkedTitle(title, url, className = "") {
    const content = escapeHtml(title || "Ohne Titel");
    return url
      ? `<a ${className ? `class="${escapeHtml(className)}"` : ""} href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${content}</a>`
      : content;
  }

  function tripPlanSubtitle(item) {
    const city = clean(item.city) || extractCityFromAddress(item.address);
    const country = germanCountry(countryFromCity(city) || countryFromAddress(item.address) || item.country);
    const location = city || clean(item.address);
    const locationWithCountry = country && !locationIncludesCountry(location, country || item.country)
      ? [location, country].filter(Boolean).join(", ")
      : location;
    return [item.provider, locationWithCountry].filter(Boolean).join(" · ");
  }

  function locationIncludesCountry(location, country) {
    const normalizedLocation = normalize(location);
    if (!normalizedLocation) return false;
    return countryAliases(country).some((alias) => alias && normalizedLocation.includes(alias));
  }

  function countryAliases(country) {
    const aliases = [country, germanCountry(country)];
    Object.entries(COUNTRY_LABELS_DE).forEach(([english, german]) => {
      if ([country, germanCountry(country)].some((value) => normalize(value) === normalize(english) || normalize(value) === normalize(german))) {
        aliases.push(english, german);
      }
    });
    return unique(aliases.map(normalize).filter(Boolean));
  }

  function countryFromCity(city) {
    const key = normalizeCity(city);
    if (!key) return "";
    if (GERMANY_CITIES.has(key)) return "Deutschland";
    if (["brussel", "brussels", "bruxelles", "brugge", "ixelles", "lier", "maaseik", "mechelen", "retie", "zoersel", "as"].includes(key)) return "Belgien";
    if (["amersfoort", "amsterdam", "baarn", "bemmel", "burgum", "den haag", "hilversum", "katwijk", "leiden", "moordrecht", "naarden", "rijswijk", "schijndel", "utrecht", "volkel", "voorburg", "waalwijk"].includes(key)) return "Niederlande";
    if (["luxembourg", "luxemburg"].includes(key)) return "Luxemburg";
    if (SPAIN_CITIES.has(key)) return "Spanien";
    if (POLAND_CITIES.has(key)) return "Polen";
    if (HUNGARY_CITIES.has(key)) return "Ungarn";
    if (CZECHIA_CITIES.has(key)) return "Tschechien";
    if (FRANCE_CITIES.has(key)) return "Frankreich";
    if (IRELAND_CITIES.has(key)) return "Irland";
    if (UK_CITIES.has(key)) return "UK";
    if (PORTUGAL_CITIES.has(key)) return "Portugal";
    if (ITALY_CITIES.has(key)) return "Italien";
    if (FINLAND_CITIES.has(key)) return "Finnland";
    if (CROATIA_CITIES.has(key)) return "Kroatien";
    if (CANADA_CITIES.has(key)) return "Kanada";
    return "";
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

  function tripExpenseSummary(trip) {
    const balances = Object.fromEntries(data.members.map((member) => [member, 0]));
    let totalCents = 0;
    (trip.expenses || []).forEach((expense) => {
      const amountCents = Math.round((numberOrNull(expense.amount) || 0) * 100);
      if (amountCents <= 0 || !Object.prototype.hasOwnProperty.call(balances, expense.payer)) return;
      const participants = (expense.participants || []).filter((member) => Object.prototype.hasOwnProperty.call(balances, member));
      if (!participants.length) return;
      totalCents += amountCents;
      balances[expense.payer] += amountCents;
      const baseShare = Math.floor(amountCents / participants.length);
      let remainder = amountCents - baseShare * participants.length;
      participants.forEach((member) => {
        const share = baseShare + (remainder > 0 ? 1 : 0);
        remainder -= 1;
        balances[member] -= share;
      });
    });

    const debtors = Object.entries(balances)
      .filter(([, cents]) => cents < 0)
      .map(([member, cents]) => ({ member, cents: -cents }))
      .sort((a, b) => b.cents - a.cents);
    const creditors = Object.entries(balances)
      .filter(([, cents]) => cents > 0)
      .map(([member, cents]) => ({ member, cents }))
      .sort((a, b) => b.cents - a.cents);
    const settlements = [];
    let debtorIndex = 0;
    let creditorIndex = 0;
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const amount = Math.min(debtors[debtorIndex].cents, creditors[creditorIndex].cents);
      if (amount > 0) {
        settlements.push({
          from: debtors[debtorIndex].member,
          to: creditors[creditorIndex].member,
          amount: amount / 100,
        });
      }
      debtors[debtorIndex].cents -= amount;
      creditors[creditorIndex].cents -= amount;
      if (debtors[debtorIndex].cents <= 0) debtorIndex += 1;
      if (creditors[creditorIndex].cents <= 0) creditorIndex += 1;
    }

    return {
      total: totalCents / 100,
      balances: data.members.map((member) => ({ member, amount: (balances[member] || 0) / 100 })),
      settlements,
    };
  }

  function getContextRooms() {
    return data.played.filter((room) => matchesRegion(room) && matchesSearch(room));
  }

  function matchesSearch(room) {
    const query = normalize(ui.search);
    if (!query) return true;
    const ratingQuery = playedRatingQuery(ui.search);
    if (ratingQuery) {
      const textMatches = !ratingQuery.textQuery || playedTextSearchIndex(room).includes(ratingQuery.textQuery);
      if (!textMatches) return false;
      if (ratingQuery.members.length) {
        return ratingQuery.members.some((member) => scoreMatchesSearch(room.ratings[member], ratingQuery.score));
      }
      return scoreMatchesSearch(averageFor(room, data.members), ratingQuery.score);
    }
    return playedTextSearchIndex(room).includes(query);
  }

  function playedTextSearchIndex(room) {
    return normalize([
      room.title,
      room.provider,
      room.city,
      room.notes,
      room.tags.join(" "),
    ].join(" "));
  }

  function playedRatingQuery(value) {
    const raw = clean(value);
    const match = raw.match(/(^|[^\d])(\d{1,2}(?:[,.]\d{1,2})?)(?=$|[^\d])/);
    if (!match) return null;
    const score = numberOrNull(match[2]);
    if (score === null || score < 0 || score > 10) return null;

    const tokenStart = match.index + match[1].length;
    const tokenEnd = tokenStart + match[2].length;
    let text = clean(`${raw.slice(0, tokenStart)} ${raw.slice(tokenEnd)}`);
    const mentionedMembers = data.members.filter((member) =>
      new RegExp(`\\b${escapeRegExp(member)}\\b`, "i").test(text));
    mentionedMembers.forEach((member) => {
      text = clean(text.replace(new RegExp(`\\b${escapeRegExp(member)}\\b`, "ig"), " "));
    });
    text = clean(text.replace(/\b(?:team|durchschnitt|schnitt|avg|average|ø|oe)\b/ig, " "));

    const hasDecimal = /[,.]/.test(match[2]);
    const members = mentionedMembers.length ? mentionedMembers : [...ui.selectedMembers];
    if (!hasDecimal && text && !members.length) return null;

    return {
      score,
      members,
      textQuery: normalize(text),
    };
  }

  function scoreMatchesSearch(value, queryScore) {
    const score = numberOrNull(value);
    if (score === null) return false;
    return normalize(formatScore(score)) === normalize(formatScore(queryScore));
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

  function getMapEntries() {
    const query = normalize(ui.mapSearch);
    if (["terpeca", "escaperoomers"].includes(ui.mapSource)) {
      if (mapRequiresPlanningRegionSelection()) return [];
      return planningRooms(ui.mapSource)
        .map((room) => ({ type: "catalog", entry: room }))
        .filter((item) => mapEntryMatchesRegion(item))
        .filter((item) => planningStateMatchesStatus(planningRoomState(item.entry), ui.mapPlanningStatus))
        .filter((item) => !query || normalize([
          item.entry.title,
          item.entry.provider,
          item.entry.city,
          item.entry.country,
          item.entry.region,
        ].join(" ")).includes(query))
        .sort((a, b) => a.entry.rank - b.entry.rank || a.entry.title.localeCompare(b.entry.title, "de"));
    }
    return [
      ...(ui.mapSource !== "wish" ? data.played.map((room) => ({ type: "played", entry: room })) : []),
      ...(ui.mapSource !== "played" ? data.wishList.map((entry) => ({ type: "wish", entry })) : []),
    ]
      .filter((item) => mapEntryMatchesRegion(item))
      .filter((item) => {
        if (!query) return true;
        const entry = item.entry;
        return normalize([
          entry.title,
          entry.provider,
          entry.city,
          entry.country,
          entry.notes,
          (entry.tags || []).join(" "),
        ].join(" ")).includes(query);
      })
      .sort((a, b) => `${a.entry.city} ${a.entry.title}`.localeCompare(`${b.entry.city} ${b.entry.title}`, "de"));
  }

  function mapEntryMatchesRegion(item) {
    if (ui.mapRegion === "all") return true;
    if (item.type === "catalog") return clean(item.entry.region || item.entry.country) === ui.mapRegion;
    if (ui.mapRegion.startsWith("preset:")) {
      const preset = regionById(ui.mapRegion.slice(7));
      if (!preset) return false;
      if (item.type === "played") return roomBelongsToPreset(item.entry, preset);
      return detectedRegionNamesForCity(item.entry.city).includes(preset.name) || countryBelongsToRegion(item.entry.country, preset.name);
    }
    return true;
  }

  function mapRequiresPlanningRegionSelection() {
    return ui.mapSource === "escaperoomers" && ui.mapRegion === "all";
  }

  function countryBelongsToRegion(country, regionName) {
    const normalizedCountry = normalize(country);
    if (!normalizedCountry) return false;
    return (COUNTRY_REGION_ALIASES[regionName] || []).some((alias) => normalizedCountry === normalize(alias));
  }

  function mapCityGroups(entries = getMapEntries()) {
    const groups = new Map();
    entries.forEach((item) => {
      const displayCity = clean(item.entry.city || item.entry.region || item.entry.country);
      const cityKey = normalizeCity(displayCity);
      if (!cityKey) return;
      const group = groups.get(cityKey) || {
        city: displayCity,
        coords: Array.isArray(item.entry.coords) ? item.entry.coords : coordsForCity(displayCity),
        played: 0,
        wish: 0,
        catalog: 0,
        entries: [],
      };
      group[item.type] += 1;
      group.entries.push(item);
      if (!group.coords) group.coords = Array.isArray(item.entry.coords) ? item.entry.coords : coordsForCity(displayCity);
      groups.set(cityKey, group);
    });
    return [...groups.values()].sort((a, b) => (b.played + b.wish + b.catalog) - (a.played + a.wish + a.catalog) || a.city.localeCompare(b.city, "de"));
  }

  function coordsForCity(city) {
    const key = normalizeCity(city);
    return CITY_COORDS[key] || cachedCityInfo(key).coords || null;
  }

  function cachedCityInfo(cityOrKey) {
    const key = normalizeCity(cityOrKey);
    const cached = mapState.geocodeCache[key];
    if (Array.isArray(cached)) return { coords: cached, regions: [] };
    if (cached && typeof cached === "object") {
      return {
        coords: Array.isArray(cached.coords) ? cached.coords : null,
        regions: Array.isArray(cached.regions) ? cached.regions : [],
      };
    }
    return { coords: null, regions: [] };
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
    return unique([
      ...REGION_ORDER.filter((regionName) => cityBelongsToRegion(city, regionName)),
      ...cachedCityInfo(city).regions,
    ]);
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

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function countBy(items, getter) {
    return items.reduce((counts, item) => {
      const key = clean(getter(item));
      if (!key) return counts;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  function exportSheets() {
    const sheets = [
      { name: "Welt", rows: playedExportRows(data.played) },
      {
        name: "Up Next",
        rows: [
          ["Game", "Anbieter", "Land", "Stadt", "Link", "Anmerkungen"],
          ...data.wishList.map((entry) => [
            entry.title,
            entry.provider,
            entry.country,
            entry.city,
            entry.link,
            entry.notes,
          ]),
        ],
      },
    ];
    const detailSheets = [];

    regionPresetOptions().forEach((region) => {
      const roomIds = new Set(region.roomIds);
      const rooms = data.played.filter((room) => roomIds.has(room.id));
      detailSheets.push({ name: exportRegionSheetName(region), rows: playedExportRows(rooms) });
    });

    detailSheets.push({
      name: "Anderes",
      rows: [
        ["Game", "Anbieter", "Stadt", "Bewertung", "Datum", "Bemerkung"],
        ...data.other.map((entry) => [
          entry.title,
          entry.provider,
          entry.city,
          entry.rating,
          entry.date,
          entry.notes,
        ]),
      ],
    });

    return [
      ...sheets,
      ...detailSheets.sort((a, b) => a.name.localeCompare(b.name, "de")),
    ];
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
    return names[region.name] || region.name;
  }

  function safeSheetName(name) {
    return clean(name).replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Export";
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
    const restoreScrollY = ui.restoreScrollY;
    const restoreElementScroll = ui.restoreElementScroll || {};
    ui.restoreScrollY = null;
    ui.restoreElementScroll = null;
    const rooms = getPlayedRooms();
    app.querySelectorAll(".trip-range-input").forEach((input) => input._flatpickr?.destroy());
    app.innerHTML = `
      <div class="app-shell">
        ${renderHeader()}
        ${ui.notice ? `<div class="notice">${escapeHtml(ui.notice)}</div>` : ""}
        <main class="main-panel">
          ${ui.view === "played" ? renderPlayedView(rooms) : ""}
          ${ui.view === "upnext" ? renderWishView() : ""}
          ${ui.view === "trips" ? renderTripsView() : ""}
          ${ui.view === "planning" ? renderPlanningView() : ""}
          ${ui.view === "map" ? renderMapView() : ""}
          ${ui.view === "stats" ? renderStatsView() : ""}
        </main>
        ${renderModal()}
        ${renderCelebrationModal()}
      </div>
    `;
    bindEvents();
    restoreActiveField(activeField);
    if (Number.isFinite(restoreScrollY)) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: restoreScrollY, left: 0 });
        Object.entries(restoreElementScroll).forEach(([selector, scrollTop]) => {
          const element = app.querySelector(selector);
          if (element && Number.isFinite(scrollTop)) element.scrollTop = scrollTop;
        });
      });
    }
    renderTripPlanMap();
  }

  function renderPreservingScroll() {
    rememberTripPlanMapView();
    currentMapView(mapViewportKey());
    ui.restoreScrollY = window.scrollY;
    ui.restoreElementScroll = {
      "[data-map-list]": app.querySelector("[data-map-list]")?.scrollTop || 0,
    };
    render();
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
        ${tabButton("trips", "Trips")}
        ${tabButton("planning", "TERPECA & ER")}
        ${tabButton("map", "Karte")}
        ${tabButton("stats", "Statistik")}
      </nav>
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
          <input type="search" id="played-search" value="${escapeHtml(ui.search)}" placeholder="Raum, Anbieter, Stadt, Bewertung">
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
      ${renderBulkPlanControls("upnext")}
      <section class="wish-grid">
        ${wishes.length ? wishes.map(renderWishCard).join("") : renderEmptyState("Keine Pläne gefunden.")}
      </section>
    `;
  }

  function renderWishCard(entry) {
    return `
      <article class="wish-card ${bulkPlanningActive("upnext") ? "is-selectable" : ""}">
        ${renderBulkPlanCheckbox("upnext", "upnext", entry.id, entry.title)}
        <div>
          <h2>${escapeHtml(entry.title || "Ohne Titel")}</h2>
          <p>${escapeHtml([entry.provider, entry.city, entry.country].filter(Boolean).join(" · "))}</p>
        </div>
        ${entry.notes ? `<p class="note">${escapeHtml(entry.notes)}</p>` : ""}
        ${entry.link ? `<a class="external-link" href="${escapeHtml(entry.link)}" target="_blank" rel="noreferrer">Website öffnen</a>` : ""}
        <div class="card-actions">
          <button type="button" data-move-wish="${escapeHtml(entry.id)}">Als gespielt</button>
          ${data.trips.length ? `<button type="button" data-plan-wish="${escapeHtml(entry.id)}">Planen</button>` : ""}
          ${data.trips.length ? `<button type="button" data-wish-trip="${escapeHtml(entry.id)}">Trip zuordnen</button>` : ""}
          <button type="button" data-edit-wish="${escapeHtml(entry.id)}">Bearbeiten</button>
          <button type="button" data-delete-wish="${escapeHtml(entry.id)}">Entfernen</button>
        </div>
      </article>
    `;
  }

  function renderBulkPlanControls(context) {
    if (!data.trips.length) return "";
    const active = bulkPlanningActive(context);
    const selectedCount = ui.bulkPlanSelection.length;
    return `
      <section class="bulk-plan-bar ${active ? "is-active" : ""}">
        <div>
          <strong>Mehrere zur Planung hinzufügen</strong>
          <span>${active ? `${selectedCount} ausgewählt` : "Räume markieren und gesammelt in einen Trip legen"}</span>
        </div>
        <label ${active ? "" : "hidden"}>
          <span>Trip</span>
          <select data-bulk-plan-trip>
            ${[...data.trips].sort(sortTrips).map((trip) => `<option value="${escapeHtml(trip.id)}" ${selectedPlanningTripId() === trip.id ? "selected" : ""}>${escapeHtml(`${trip.name} · ${formatTripRange(trip)}`)}</option>`).join("")}
          </select>
        </label>
        <div class="bulk-plan-actions">
          ${active ? `<button class="primary-action" type="button" data-bulk-plan-add>Ausgewählte hinzufügen (${selectedCount})</button>` : ""}
          <button type="button" data-toggle-bulk-plan="${escapeHtml(context)}">${active ? "Abbrechen" : "Mehrere zur Planung hinzufügen"}</button>
        </div>
      </section>
    `;
  }

  function renderBulkPlanCheckbox(context, sourceType, sourceId, title) {
    if (!bulkPlanningActive(context)) return "";
    const key = bulkPlanKey(sourceType, sourceId);
    return `
      <label class="bulk-plan-check" title="${escapeHtml(title || "Raum auswählen")}">
        <input type="checkbox" data-bulk-plan-checkbox data-bulk-plan-source="${escapeHtml(sourceType)}" data-bulk-plan-id="${escapeHtml(sourceId)}" ${ui.bulkPlanSelection.includes(key) ? "checked" : ""}>
        <span>Auswählen</span>
      </label>
    `;
  }

  function bulkPlanningActive(context) {
    return ui.bulkPlanMode && ui.bulkPlanContext === context;
  }

  function bulkPlanKey(sourceType, sourceId) {
    return `${sourceType}:${sourceId}`;
  }

  function selectedPlanningTripId() {
    const trips = [...data.trips].sort(sortTrips);
    if (trips.some((trip) => trip.id === ui.planTargetTripId)) return ui.planTargetTripId;
    if (trips.some((trip) => trip.id === ui.activeTripId)) return ui.activeTripId;
    return trips[0]?.id || "";
  }

  function planningRooms(source = ui.planningSource) {
    return source === "escaperoomers" ? planningData.escaperoomers : planningData.terpeca;
  }

  function planningRoomById(id) {
    return [...planningData.terpeca, ...planningData.escaperoomers].find((room) => room.id === id) || null;
  }

  function planningRoomState(room) {
    if (manualPlanningPlayedRoom(room)) return "played";
    if (findPlanningMatch(room, data.played)) return "played";
    if (findPlanningMatch(room, data.wishList)) return "upnext";
    return "unplayed";
  }

  function planningStateMatchesStatus(state, status) {
    if (status === "all") return true;
    if (status === "unplayed") return state === "unplayed" || state === "upnext";
    return state === status;
  }

  function manualPlanningPlayedRoom(room) {
    const playedRoomId = data.planningLinks?.[room.id];
    return playedRoomId ? data.played.find((entry) => entry.id === playedRoomId) || null : null;
  }

  function findPlanningMatch(room, entries) {
    const title = normalize(room.title);
    const provider = normalize(room.provider);
    const city = normalizeCity(room.city);
    const country = normalize(germanCountry(room.country || room.region));
    if (!title) return null;
    const candidates = entries
      .map((entry) => ({ entry, score: planningTitleMatchScore(title, normalize(entry.title)) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score);
    if (!candidates.length) return null;
    const contextualMatch = candidates.find((entry) => {
      const entryProvider = normalize(entry.entry.provider);
      const entryCity = normalizeCity(entry.entry.city);
      const entryCountry = normalize(germanCountry(entry.entry.country || ""));
      if (entryCountry && country && entryCountry !== country) return false;
      const providerMatches = provider && entryProvider && (
        provider === entryProvider
        || (provider.length >= 5 && entryProvider.length >= 5 && (provider.includes(entryProvider) || entryProvider.includes(provider)))
      );
      const cityMatches = city && entryCity && city === entryCity;
      return providerMatches || cityMatches;
    });
    if (contextualMatch) return contextualMatch.entry;
    const exactMatches = candidates.filter((candidate) => candidate.score >= 100);
    if (exactMatches.length === 1 && title.length >= 6 && !planningTitleIsAmbiguous(room.title)) {
      const entryCountry = normalize(germanCountry(exactMatches[0].entry.country || ""));
      if (!entryCountry || !country || entryCountry === country) return exactMatches[0].entry;
    }
    return null;
  }

  function planningTitleIsAmbiguous(value) {
    const title = normalize(value);
    const compactTitle = planningCompactTitle(value);
    if (GENERIC_PLANNING_TITLE_KEYS.has(compactTitle)) return true;
    if (!title || compactTitle.length < 6) return true;
    const identities = new Set(
      [...planningData.terpeca, ...planningData.escaperoomers]
        .filter((room) => {
          const roomTitle = normalize(room.title);
          return roomTitle === title || planningCompactTitle(room.title) === compactTitle;
        })
        .map((room) => planningRoomIdentity(room))
        .filter((identity) => identity !== "||"),
    );
    return identities.size > 1;
  }

  function planningRoomIdentity(room) {
    const city = normalizeCity(room.city);
    const country = normalize(germanCountry(room.country || room.region));
    if (city || country) return [city, country].join("|");
    return [normalize(room.provider), country].join("|");
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

  function planningCompactTitle(value) {
    return normalize(value).replace(/\s+/g, "");
  }

  function planningStatusCounts(source = ui.planningSource, region = ui.planningRegion, search = ui.planningSearch) {
    const query = normalize(search);
    const counts = { all: 0, unplayed: 0, upnext: 0, played: 0 };
    planningRooms(source)
      .filter((room) => region === "all" || clean(room.region || room.country) === region)
      .filter((room) => !query || normalize([
        room.title,
        room.provider,
        room.city,
        room.country,
        room.region,
      ].join(" ")).includes(query))
      .forEach((room) => {
        const state = planningRoomState(room);
        counts.all += 1;
        counts[state] += 1;
        if (state === "upnext") counts.unplayed += 1;
      });
    return counts;
  }

  function planningStatusOptions(current, counts) {
    return [
      ["unplayed", "Noch nicht gespielt"],
      ["all", "Alle"],
      ["upnext", "Up Next"],
      ["played", "Gespielt"],
    ].map(([value, label]) => selectOption(value, `${label} (${counts[value] || 0})`, current)).join("");
  }

  function planningRegionOptions(source = ui.planningSource) {
    const rooms = planningRooms(source);
    const regions = [...new Set(rooms.map((room) => clean(room.region || room.country)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "de"));
    return [{ value: "all", label: `Alle Gebiete (${rooms.length})` }, ...regions.map((region) => ({
      value: region,
      label: `${planningRegionLabel(region)} (${rooms.filter((room) => clean(room.region || room.country) === region).length})`,
    }))];
  }

  function filteredPlanningRooms(source = ui.planningSource, region = ui.planningRegion, status = ui.planningStatus, search = ui.planningSearch) {
    const query = normalize(search);
    return planningRooms(source)
      .filter((room) => region === "all" || clean(room.region || room.country) === region)
      .filter((room) => planningStateMatchesStatus(planningRoomState(room), status))
      .filter((room) => !query || normalize([
        room.title,
        room.provider,
        room.city,
        room.country,
        room.region,
      ].join(" ")).includes(query))
      .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title, "de"));
  }

  function renderPlanningView() {
    const regions = planningRegionOptions();
    const rooms = filteredPlanningRooms();
    const statusCounts = planningStatusCounts();
    const sourceLabel = ui.planningSource === "terpeca" ? `TERPECA ${planningData.terpecaYear}` : "EscapeRoomers";
    const updated = planningData.updatedAt ? formatDate(planningData.updatedAt.slice(0, 10)) : "";
    return `
      <section class="toolbar planning-toolbar">
        <label>
          <span>Quelle</span>
          <select id="planning-source">
            ${selectOption("terpeca", `TERPECA ${planningData.terpecaYear} (${planningData.terpeca.length})`, ui.planningSource)}
            ${selectOption("escaperoomers", `EscapeRoomers (${planningData.escaperoomers.length})`, ui.planningSource)}
          </select>
        </label>
        <label>
          <span>Gebiet</span>
          <select id="planning-region">
            ${regions.map((option) => `<option value="${escapeHtml(option.value)}" ${ui.planningRegion === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select id="planning-status">
            ${planningStatusOptions(ui.planningStatus, statusCounts)}
          </select>
        </label>
        <label class="search-box">
          <span>Suche</span>
          <input type="search" id="planning-search" value="${escapeHtml(ui.planningSearch)}" placeholder="Raum, Anbieter, Stadt">
        </label>
      </section>
      ${renderBulkPlanControls("planning")}
      <div class="planning-summary">
        <div><strong>${rooms.length}</strong><span>Treffer aus ${escapeHtml(sourceLabel)}</span></div>
        <p>${ui.planningSource === "escaperoomers" ? "Top 20 je regionaler Rangliste. Mehrfachplatzierungen bleiben sichtbar." : "Aktuelles internationales Top-100-Ranking."}${updated ? ` Datenstand ${escapeHtml(updated)}.` : ""}</p>
      </div>
      <section class="planning-list">
        ${rooms.length ? rooms.map(renderPlanningRoom).join("") : renderEmptyState("Keine passenden Räume gefunden.")}
      </section>
    `;
  }

  function renderPlanningRoom(room, compact = false) {
    const state = planningRoomState(room);
    const stateLabel = state === "played" ? "Gespielt" : state === "upnext" ? "Up Next" : "Offen";
    const location = [room.city || planningRegionLabel(room.region), germanCountry(room.country)].filter(Boolean).join(" · ");
    const scare = typeof room.scare === "number" ? `${formatScore(room.scare)}/${room.scareScale || 5}` : "-";
    const searchUrl = planningRoomSearchUrl(room);
    const manualMatch = manualPlanningPlayedRoom(room);
    return `
      <article class="planning-room ${compact ? "is-compact" : ""} ${bulkPlanningActive("planning") ? "is-selectable" : ""}" data-planning-room="${escapeHtml(room.id)}">
        ${renderBulkPlanCheckbox("planning", "planning", room.id, room.title)}
        <div class="planning-rank"><span>Platz</span><strong>${room.rank}</strong></div>
        <div class="planning-room__body">
          <div class="planning-room__title">
            <div>
              <h2>${escapeHtml(room.title)}</h2>
              <p>${escapeHtml([room.provider, location].filter(Boolean).join(" · "))}</p>
            </div>
            <span class="planning-state is-${state}">${stateLabel}</span>
          </div>
          <div class="planning-facts">
            <span><b>${room.duration || "-"}</b> Min.</span>
            <span><b>${escapeHtml(scare)}</b> Horror</span>
            ${room.actors ? "<span><b>Ja</b> Schauspieler</span>" : ""}
          </div>
          <div class="planning-actions">
            ${room.website ? `<a href="${escapeHtml(room.website)}" target="_blank" rel="noreferrer">Website</a>` : `<a href="${escapeHtml(searchUrl)}" target="_blank" rel="noreferrer">Websuche</a>`}
            ${room.detailUrl ? `<a href="${escapeHtml(room.detailUrl)}" target="_blank" rel="noreferrer">Quelle</a>` : ""}
            ${state === "unplayed" ? `<button type="button" data-planning-upnext="${escapeHtml(room.id)}">Zu Up Next</button>` : ""}
            <button type="button" data-planning-link="${escapeHtml(room.id)}">${manualMatch ? "Zuordnung ändern" : "Gespielt zuordnen"}</button>
            ${data.trips.length ? `<button type="button" data-plan-planning="${escapeHtml(room.id)}">Planen</button>` : ""}
            ${data.trips.length ? `<button type="button" data-planning-trip="${escapeHtml(room.id)}">Trip zuordnen</button>` : ""}
          </div>
        </div>
      </article>
    `;
  }

  function planningRoomSearchUrl(room) {
    const query = [room.title, room.provider, room.city || room.region, "Escape Room"].filter(Boolean).join(" ");
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  function planningRoomSourceLabel(room) {
    return room.source === "terpeca"
      ? `TERPECA ${room.year || planningData.terpecaYear}`
      : `EscapeRoomers ${planningRegionLabel(room.region)}`;
  }

  function renderTripsView() {
    const activeTrip = data.trips.find((trip) => trip.id === ui.activeTripId);
    if (activeTrip) return renderTripDetail(activeTrip);

    const query = normalize(ui.tripSearch);
    const trips = [...data.trips]
      .filter((trip) => !query || normalize(`${trip.name} ${trip.destination} ${trip.notes} ${trip.items.map((item) => `${item.title} ${item.city}`).join(" ")} ${(trip.planItems || []).map((item) => `${item.title} ${item.city}`).join(" ")}`).includes(query))
      .sort(sortTrips);

    return `
      <section class="toolbar trips-toolbar">
        <label class="search-box">
          <span>Suche</span>
          <input type="search" id="trip-search" value="${escapeHtml(ui.tripSearch)}" placeholder="Trip, Ziel, Stadt">
        </label>
        ${pendingShare ? `<button type="button" data-open-shared-booking>Geteilte Buchung öffnen</button>` : ""}
        <button class="primary-action" data-open-trip type="button">Trip anlegen</button>
      </section>
      <section class="trip-grid">
        ${trips.length ? trips.map(renderTripCard).join("") : renderEmptyState("Noch kein Trip geplant.")}
      </section>
    `;
  }

  function renderTripCard(trip) {
    const escapeCount = tripScheduledEscapeCount(trip);
    const accommodationCount = tripAccommodationCount(trip);
    const planCount = trip.planItems?.length || 0;
    return `
      <article class="trip-card">
        <div class="trip-card__head">
          <div>
            <span class="trip-status ${escapeHtml(tripStatus(trip).className)}">${escapeHtml(tripStatus(trip).label)}</span>
            <h2>${escapeHtml(trip.name || "Unbenannter Trip")}</h2>
            <p>${escapeHtml(formatTripRange(trip))}</p>
          </div>
          <strong class="trip-days">${tripDuration(trip)}</strong>
        </div>
        <div class="trip-facts">
          <span>${escapeCount} Escape Rooms</span>
          <span>${accommodationCount} Unterkünfte</span>
          ${planCount ? `<span>${planCount} Kandidaten</span>` : ""}
        </div>
        <div class="card-actions">
          <button class="primary-action" type="button" data-open-trip-detail="${escapeHtml(trip.id)}">Trip öffnen</button>
          <button type="button" data-edit-trip="${escapeHtml(trip.id)}">Bearbeiten</button>
          <button type="button" data-delete-trip="${escapeHtml(trip.id)}">Entfernen</button>
        </div>
      </article>
    `;
  }

  function renderTripDetail(trip) {
    const items = [...trip.items].sort(sortTripItems);
    const escapeCount = tripScheduledEscapeCount(trip);
    const accommodationCount = tripAccommodationCount({ ...trip, items });

    return `
      <section class="trip-detail-head">
        <button type="button" data-close-trip-detail>Zurück zu Trips</button>
        <div class="trip-title-row">
          <div>
            <span class="trip-status ${escapeHtml(tripStatus(trip).className)}">${escapeHtml(tripStatus(trip).label)}</span>
            <div class="trip-title-line">
              <h2>${escapeHtml(trip.name || "Unbenannter Trip")}</h2>
              <button class="inline-icon-button" type="button" data-edit-trip-name="${escapeHtml(trip.id)}" aria-label="Tripnamen bearbeiten" title="Tripnamen bearbeiten">✎</button>
            </div>
            <div class="trip-date-line">
              <p>${escapeHtml(formatTripRange(trip))}</p>
              <button class="inline-icon-button" type="button" data-edit-trip-dates="${escapeHtml(trip.id)}" aria-label="Tripdatum bearbeiten" title="Tripdatum bearbeiten">✎</button>
            </div>
          </div>
          <div class="trip-detail-actions">
            ${pendingShare ? `<button type="button" data-open-shared-booking>Geteilte Buchung öffnen</button>` : ""}
            <button type="button" data-import-trip-item="${escapeHtml(trip.id)}">Buchung importieren</button>
            <button type="button" data-import-room-url="${escapeHtml(trip.id)}">Website importieren</button>
            <button class="primary-action" type="button" data-open-trip-item="${escapeHtml(trip.id)}">Termin ergänzen</button>
          </div>
        </div>
      </section>

      <section class="kpi-grid trip-kpis" aria-label="Trip-Kennzahlen">
        ${kpi("Tage", tripDuration(trip))}
        ${kpi("Escape Rooms", escapeCount)}
        ${kpi("Unterkünfte", accommodationCount)}
      </section>

      ${renderTripPlanning(trip)}
      ${renderTripExpenses(trip)}
      ${renderTripAccommodations(trip)}
    `;
  }

  function tripScheduledEscapeCount(trip) {
    const planItems = trip.planItems || [];
    const linkedTripItemIds = new Set(planItems.map((item) => item.tripItemId).filter(Boolean));
    const scheduledPlanEscapes = planItems.filter((item) => item.date).length;
    const scheduledLooseTripEscapes = (trip.items || []).filter((item) =>
      item.type === "escape" && item.date && !linkedTripItemIds.has(item.id)).length;
    return scheduledPlanEscapes + scheduledLooseTripEscapes;
  }

  function tripAccommodationCount(trip) {
    return (trip.items || []).filter((item) => item.type === "accommodation").length;
  }

  function renderTripPlanning(trip) {
    const candidates = [...(trip.planItems || [])].sort(sortTripPlanItems);
    const dates = tripDateValues(trip);
    const unscheduled = candidates.filter((item) => !item.date);
    const scheduled = candidates.filter((item) => item.date);
    const analysis = tripPlanAnalysis(trip);
    const warningCount = [...analysis.warningsById.values()].reduce((sum, warnings) => sum + warnings.length, 0);
    const finalized = Boolean(trip.planningFinalized);
    return `
      <section class="trip-planning ${finalized ? "is-finalized" : ""}">
        <header class="trip-section-head">
          <div>
            <span>Tripplanung</span>
            <h3>${finalized ? "Kompakter Kalender" : "Karte & Tagesplan"}</h3>
          </div>
          <div class="trip-section-actions">
            <button type="button" data-toggle-trip-planning="${escapeHtml(trip.id)}">${finalized ? "Trip bearbeiten" : "Planung abgeschlossen"}</button>
            <strong>${scheduled.length}</strong>
          </div>
        </header>
        ${finalized ? "" : `
          <div class="trip-plan-help">
            <span>${escapeHtml(`${unscheduled.length} offen`)}</span>
            <span>${escapeHtml(`${candidates.length - unscheduled.length} im Kalender`)}</span>
            ${warningCount ? `<span class="is-warning">${escapeHtml(`${warningCount} Hinweis${warningCount === 1 ? "" : "e"}`)}</span>` : `<span>Keine Zeitkonflikte</span>`}
          </div>
        `}
        ${finalized
          ? `
            <div class="trip-plan-calendar trip-plan-calendar--final">
              ${dates.map((date) => renderTripFinalBucket(
                trip,
                date,
                formatLongDate(date),
                candidates.filter((item) => item.date === date),
                analysis,
              )).join("")}
            </div>
          `
          : `
            <div class="trip-plan-layout">
              <div class="trip-plan-left">
                <div class="trip-plan-map-shell">
                  <div id="trip-plan-map" class="trip-plan-map" data-trip-plan-map="${escapeHtml(trip.id)}"></div>
                </div>
                ${renderTripPlanBucket(trip, "", "Noch nicht terminiert", unscheduled, analysis)}
              </div>
              <div class="trip-plan-calendar">
                ${dates.map((date) => renderTripPlanBucket(
                  trip,
                  date,
                  formatLongDate(date),
                  candidates.filter((item) => item.date === date),
                  analysis,
                )).join("")}
              </div>
            </div>
          `}
      </section>
    `;
  }

  function renderTripPlanBucket(trip, date, title, candidates, analysis) {
    return `
      <section class="trip-plan-day ${date ? "is-calendar-day" : "is-open-day"}" data-plan-drop-date="${escapeHtml(date)}" data-trip-id="${escapeHtml(trip.id)}">
        <header>
          <span>${date ? escapeHtml(formatWeekday(date)) : "OFFEN"}</span>
          <div>
            <strong>${escapeHtml(title)}</strong>
            <small>${candidates.length} ${candidates.length === 1 ? "Raum" : "Räume"}</small>
          </div>
        </header>
        <div class="trip-plan-cards" data-plan-drop-date="${escapeHtml(date)}" data-trip-id="${escapeHtml(trip.id)}">
          ${date ? renderTripPlanStartMarker(trip, date, candidates) : ""}
          ${date ? renderTripPlanAccommodationMarker(trip, date, "start", candidates) : ""}
          ${candidates.length
            ? renderTripPlanCards(trip, candidates, analysis)
            : `<p class="trip-plan-empty">${date ? "Raum hier hineinziehen" : "Keine offenen Kandidaten"}</p>`}
          ${date ? renderTripPlanAccommodationMarker(trip, date, "end", candidates) : ""}
        </div>
      </section>
    `;
  }

  function renderTripFinalOpenList(trip, candidates, analysis) {
    return `
      <section class="trip-final-open">
        <header>
          <span>Offen</span>
          <strong>${candidates.length} ${candidates.length === 1 ? "Raum" : "Räume"}</strong>
        </header>
        <div class="trip-plan-cards">
          ${candidates.map((item) => renderTripFinalCard(trip, item, analysis, true)).join("")}
        </div>
      </section>
    `;
  }

  function renderTripFinalBucket(trip, date, title, candidates, analysis) {
    return `
      <section class="trip-plan-day trip-final-day is-calendar-day">
        <header>
          <span>${escapeHtml(formatWeekday(date))}</span>
          <div>
            <strong>${escapeHtml(title)}</strong>
            <small>${candidates.length} ${candidates.length === 1 ? "Raum" : "Räume"}</small>
          </div>
        </header>
        <div class="trip-plan-cards">
          ${renderTripPlanStartMarker(trip, date, candidates)}
          ${renderTripPlanAccommodationMarker(trip, date, "start", candidates)}
          ${candidates.length
            ? renderTripFinalCards(trip, candidates, analysis)
            : `<p class="trip-plan-empty">Kein Raum geplant</p>`}
          ${renderTripPlanAccommodationMarker(trip, date, "end", candidates)}
        </div>
      </section>
    `;
  }

  function renderTripPlanCards(trip, candidates, analysis) {
    return candidates.map((item) => {
      const leg = analysis.legsByTargetId.get(item.id) || null;
      return `${leg ? renderTripTravelRow(leg) : ""}${renderTripPlanCard(trip, item, analysis)}`;
    }).join("");
  }

  function renderTripFinalCards(trip, candidates, analysis) {
    return candidates.map((item) => {
      const leg = analysis.legsByTargetId.get(item.id) || null;
      return `${leg ? renderTripTravelRow(leg) : ""}${renderTripFinalCard(trip, item, analysis)}`;
    }).join("");
  }

  function renderTripPlanStartMarker(trip, date, candidates) {
    const start = tripStartForDate(trip, date);
    if (!start) return "";
    const timedCandidates = [...candidates]
      .filter((item) => item.time)
      .sort(sortTripPlanItems);
    const accommodation = tripAccommodationStartForDate(trip, date);
    const reference = accommodation || timedCandidates[0];
    const leg = reference ? tripTravelLeg(start, reference) : null;
    const timing = latestDepartureText(reference, leg);
    const details = [leg ? tripTravelSummary(leg) : "", timing].filter(Boolean).join(" - ");
    const routeUrl = mapsRouteUrl(start);
    return `
      <div class="trip-plan-stay-marker trip-plan-start-marker">
        <div>
          <strong>Startadresse</strong>
          <span>${escapeHtml(start.title || "Startadresse")}</span>
          ${start.address ? `<small>${escapeHtml(start.address)}</small>` : ""}
          ${details ? `<small>${escapeHtml(details)}</small>` : ""}
        </div>
        ${routeUrl ? `<a class="route-link route-link--small" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">Route</a>` : ""}
      </div>
    `;
  }

  function renderTripPlanAccommodationMarker(trip, date, position, candidates) {
    const accommodation = position === "start"
      ? tripAccommodationStartForDate(trip, date)
      : tripAccommodationEndForDate(trip, date);
    if (!accommodation) return "";
    const timedCandidates = [...candidates]
      .filter((item) => item.time)
      .sort(sortTripPlanItems);
    const reference = position === "start"
      ? timedCandidates[0]
      : [...timedCandidates].reverse().find((item) => item.duration);
    const leg = reference
      ? position === "start"
        ? tripTravelLeg(accommodation, reference)
        : tripTravelLeg(reference, accommodation)
      : null;
    const timing = position === "start"
      ? latestDepartureText(reference, leg)
      : approximateArrivalText(reference, leg);
    const title = position === "start" ? "Start Unterkunft" : "Zur Unterkunft";
    const routeUrl = mapsRouteUrl(accommodation);
    const details = [leg ? tripTravelSummary(leg) : "", timing].filter(Boolean).join(" - ");
    return `
      <div class="trip-plan-stay-marker">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(accommodation.title || accommodation.provider || "Unterkunft")}</span>
          ${details ? `<small>${escapeHtml(details)}</small>` : ""}
        </div>
        ${routeUrl ? `<a class="route-link route-link--small" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">Route</a>` : ""}
      </div>
    `;
  }

  function renderPaidAction(isPaid, attributes) {
    return isPaid
      ? `<button class="paid-action" type="button" disabled>✓ bezahlt</button>`
      : `<button type="button" ${attributes}>als bezahlt markieren</button>`;
  }

  function tripPlanItemIsPaid(trip, item) {
    return (trip.expenses || []).some((expense) =>
      (expense.sourceType === "trip-plan" && expense.sourceId === item.id)
      || (item.tripItemId && expense.sourceType === "trip-item" && expense.sourceId === item.tripItemId)
      || (!expense.sourceType && normalize(expense.title) === normalize(item.title) && numberOrNull(expense.amount) > 0));
  }

  function tripItemIsPaid(trip, item) {
    return (trip.expenses || []).some((expense) =>
      (expense.sourceType === "trip-item" && expense.sourceId === item.id)
      || (expense.sourceType === "trip-plan" && (trip.planItems || []).some((planItem) => planItem.tripItemId === item.id && planItem.id === expense.sourceId))
      || (!expense.sourceType && normalize(expense.title) === normalize(item.title) && numberOrNull(expense.amount) > 0));
  }

  function renderTripPlanCard(trip, item, analysis) {
    const routeUrl = mapsRouteUrl(item);
    const endTime = addMinutesToTime(item.time, item.duration);
    const warnings = analysis.warningsById.get(item.id) || [];
    const priceText = item.pricePerPerson ? `${formatCurrency(item.pricePerPerson)} p.P. bei 5` : "";
    const isPaid = tripPlanItemIsPaid(trip, item);
    return `
      <article class="trip-plan-card ${warnings.length ? "has-warning" : ""}" draggable="true" data-plan-drag="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(trip.id)}">
        <div class="trip-plan-card__head">
          <h4>${linkedTitle(item.title || "Ohne Titel", item.link, "title-link")}</h4>
          <p>${escapeHtml(tripPlanSubtitle(item))}</p>
        </div>
        <div class="trip-plan-fields">
          <select aria-label="Datum" data-trip-plan-field="date" data-trip-id="${escapeHtml(trip.id)}" data-plan-id="${escapeHtml(item.id)}">
            ${tripDateOptions(trip, item.date, "Datum")}
          </select>
          <select aria-label="Uhrzeit" data-trip-plan-field="time" data-trip-id="${escapeHtml(trip.id)}" data-plan-id="${escapeHtml(item.id)}">
            ${timeSlotOptions(item.time, "Uhrzeit")}
          </select>
          <label class="duration-inline">
            <input aria-label="Dauer" type="number" min="15" step="5" inputmode="numeric" placeholder="Dauer" value="${escapeHtml(item.duration || "")}" data-trip-plan-field="duration" data-trip-id="${escapeHtml(trip.id)}" data-plan-id="${escapeHtml(item.id)}">
            <span>${item.duration ? "Min." : ""}</span>
          </label>
        </div>
        ${item.date && item.availableSlots?.length ? renderTripAvailableSlots(trip, item) : ""}
        <div class="trip-plan-meta">
          ${item.time ? `<span>${escapeHtml(endTime ? `${item.time} bis ${endTime}` : item.time)}</span>` : `<span>Zeit offen</span>`}
          ${item.duration ? `<span>${escapeHtml(formatDurationLabel(item.duration))}</span>` : `<span>Dauer offen</span>`}
          ${priceText ? `<span>${escapeHtml(priceText)}</span>` : ""}
        </div>
        ${warnings.length ? `<div class="trip-plan-warnings">${warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join("")}</div>` : ""}
        <div class="trip-item__actions">
          ${routeUrl ? `<a class="route-link" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">Route</a>` : ""}
          <button class="primary-action" type="button" data-plan-to-trip="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(trip.id)}">Details bearbeiten</button>
          ${renderPaidAction(isPaid, `data-pay-plan-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(trip.id)}"`)}
          ${renderTripPlanPlayedActions(trip, item)}
          <button type="button" data-delete-plan-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(trip.id)}">Entfernen</button>
        </div>
      </article>
    `;
  }

  function renderTripFinalCard(trip, item, analysis, open = false) {
    const routeUrl = mapsRouteUrl(item);
    const endTime = addMinutesToTime(item.time, item.duration);
    const warnings = analysis.warningsById.get(item.id) || [];
    const priceText = item.pricePerPerson ? `${formatCurrency(item.pricePerPerson)} p.P. bei 5` : "";
    const isPaid = tripPlanItemIsPaid(trip, item);
    const timeText = item.time
      ? endTime ? `${item.time} bis ${endTime}` : item.time
      : "Zeit offen";
    const durationText = item.duration ? formatDurationLabel(item.duration) : "Dauer offen";
    return `
      <article class="trip-plan-card trip-final-card ${warnings.length ? "has-warning" : ""}">
        <div class="trip-plan-card__head">
          <h4>${linkedTitle(item.title || "Ohne Titel", item.link, "title-link")}</h4>
          <p>${escapeHtml(tripPlanSubtitle(item))}</p>
        </div>
        <div class="trip-final-time ${open ? "is-open" : ""}">
          <strong>${escapeHtml(timeText)}</strong>
          <span>${escapeHtml(durationText)}</span>
          ${priceText ? `<span>${escapeHtml(priceText)}</span>` : ""}
        </div>
        ${warnings.length ? `<div class="trip-plan-warnings">${warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join("")}</div>` : ""}
        <div class="trip-item__actions trip-final-actions">
          <button type="button" data-plan-to-trip="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(trip.id)}">Details bearbeiten</button>
          ${renderPaidAction(isPaid, `data-pay-plan-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(trip.id)}"`)}
          ${renderTripPlanPlayedActions(trip, item)}
          ${routeUrl ? `<a class="route-link" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">Route</a>` : ""}
        </div>
      </article>
    `;
  }

  function renderTripPlanPlayedActions(trip, item) {
    if (!item.tripItemId) return "";
    const tripItem = trip.items.find((entry) => entry.id === item.tripItemId);
    if (!tripItem || tripItem.type !== "escape") return "";
    if (tripItem.playedRoomId) {
      return `<button type="button" data-edit-room="${escapeHtml(tripItem.playedRoomId)}">Bewertung bearbeiten</button>`;
    }
    return `<button class="primary-action" type="button" data-complete-trip-item="${escapeHtml(tripItem.id)}" data-trip-id="${escapeHtml(trip.id)}">Gespielt</button>`;
  }

  function renderTripAvailableSlots(trip, item) {
    return `
      <div class="trip-slot-list" aria-label="Gefundene Timeslots">
        ${item.availableSlots.map((slot) => `<button type="button" data-trip-slot="${escapeHtml(slot)}" data-trip-id="${escapeHtml(trip.id)}" data-plan-id="${escapeHtml(item.id)}">${escapeHtml(slot)}</button>`).join("")}
      </div>
    `;
  }

  function renderTripDay(date, items, tripId) {
    return `
      <section class="trip-day">
        <header class="trip-day__head">
          <span>${date ? escapeHtml(formatWeekday(date)) : "OFFEN"}</span>
          <div>
            <h2>${date ? escapeHtml(formatLongDate(date)) : "Noch nicht terminiert"}</h2>
            <p>${items.length} ${items.length === 1 ? "Eintrag" : "Einträge"}</p>
          </div>
        </header>
        <div class="trip-day__items">
          ${items.map((entry) => entry.kind === "travel" ? renderTripTravelRow(entry.leg) : renderTripItem(entry.item, tripId, entry)).join("")}
        </div>
      </section>
    `;
  }

  function renderTripItem(item, tripId, timelineEntry = null) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    const routeUrl = mapsRouteUrl(item);
    const isAccommodation = item.type === "accommodation";
    const isPaid = trip ? tripItemIsPaid(trip, item) : false;
    const timeText = timelineEntry?.timeLabel || (isAccommodation ? "Check-in" : item.time || "--:--");
    const calculatedEndTime = addMinutesToTime(item.time, item.duration);
    const endText = timelineEntry?.detailText || (isAccommodation
      ? item.endDate ? `Check-out ${formatDate(item.endDate)}` : ""
      : [calculatedEndTime ? `bis ${calculatedEndTime}` : "", formatDurationLabel(item.duration)].filter(Boolean).join(" · "));
    return `
      <article class="trip-item trip-item--${escapeHtml(item.type)}">
        <div class="trip-item__time">
          <strong>${escapeHtml(timeText)}</strong>
          ${endText ? `<span>${escapeHtml(endText)}</span>` : ""}
        </div>
        <div class="trip-item__body">
          <span class="trip-type">${escapeHtml(TRIP_ITEM_LABELS[item.type])}</span>
          <h3>${linkedTitle(item.title || "Ohne Titel", item.link, "title-link")}</h3>
          ${timelineEntry?.hint ? `<p class="trip-timing-hint">${escapeHtml(timelineEntry.hint)}</p>` : ""}
          ${item.playedRoomId ? `<span class="trip-complete">Gespielt</span>` : ""}
          ${item.provider ? `<p class="trip-provider">${escapeHtml(item.provider)}</p>` : ""}
          ${item.pricePerPerson ? `<p class="trip-provider">${escapeHtml(`${formatCurrency(item.pricePerPerson)} p.P. bei 5`)}</p>` : ""}
          ${item.address || item.city ? `<address>${escapeHtml([item.address, item.city].filter(Boolean).join(", "))}</address>` : ""}
          ${item.notes ? `<p class="note">${escapeHtml(item.notes)}</p>` : ""}
          ${item.sourceName ? `<small class="trip-source">Importiert aus ${escapeHtml(item.sourceName)}</small>` : ""}
          <div class="trip-item__actions">
            ${routeUrl ? `<a class="route-link" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">Route öffnen</a>` : ""}
            ${renderPaidAction(isPaid, `data-pay-trip-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(tripId)}"`)}
            ${item.type === "escape" && !item.playedRoomId ? `<button class="primary-action" type="button" data-complete-trip-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(tripId)}">Gespielt</button>` : ""}
            ${item.type === "escape" && item.playedRoomId ? `<button type="button" data-edit-room="${escapeHtml(item.playedRoomId)}">Bewertung bearbeiten</button>` : ""}
            <button type="button" data-edit-trip-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(tripId)}">Bearbeiten</button>
            <button type="button" data-delete-trip-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(tripId)}">Entfernen</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderTripAccommodations(trip) {
    const accommodations = (trip.items || [])
      .filter((item) => item.type === "accommodation")
      .sort(sortTripItems);
    return `
      <section class="trip-accommodations">
        <header class="trip-section-head">
          <div>
            <span>Unterkünfte</span>
            <h3>Übernachtungen</h3>
          </div>
          <strong>${accommodations.length}</strong>
        </header>
        <div class="trip-accommodation-list">
          ${accommodations.length
            ? accommodations.map((item) => renderTripAccommodationCard(item, trip.id)).join("")
            : renderEmptyState("Noch keine Unterkunft eingetragen.")}
        </div>
      </section>
    `;
  }

  function renderTripAccommodationCard(item, tripId) {
    const routeUrl = mapsRouteUrl(item);
    const range = item.date
      ? `${formatDate(item.date)} bis ${formatDate(item.endDate || item.date)}`
      : "Zeitraum offen";
    return `
      <article class="trip-accommodation-card">
        <div>
          <h4>${linkedTitle(item.title || "Unterkunft", item.link, "title-link")}</h4>
          <p>${escapeHtml(range)}</p>
          ${item.provider ? `<small>${escapeHtml(item.provider)}</small>` : ""}
          ${item.address || item.city ? `<address>${escapeHtml([item.address, item.city].filter(Boolean).join(", "))}</address>` : ""}
        </div>
        <div class="trip-accommodation-actions">
          ${routeUrl ? `<a class="route-link route-link--small" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">Route</a>` : ""}
          <button type="button" data-edit-trip-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(tripId)}">Bearbeiten</button>
          <button type="button" data-delete-trip-item="${escapeHtml(item.id)}" data-trip-id="${escapeHtml(tripId)}">Entfernen</button>
        </div>
      </article>
    `;
  }

  function renderTripTravelRow(leg) {
    if (!leg) return "";
    return `
      <div class="trip-travel-row">
        <span>${escapeHtml(tripTravelSummary(leg))}</span>
        <small>${escapeHtml([leg.sourceTitle, leg.targetTitle].filter(Boolean).join(" -> "))}</small>
      </div>
    `;
  }

  function renderTripExpenses(trip) {
    const expenses = [...(trip.expenses || [])].sort((a, b) => `${b.date || ""} ${b.title}`.localeCompare(`${a.date || ""} ${a.title}`, "de"));
    const previewExpenses = expenses.slice(0, 3);
    const summary = tripExpenseSummary(trip);
    return `
      <section class="trip-expenses">
        <header class="trip-section-head">
          <div>
            <span>Tricount</span>
            <h3>Ausgaben & Abrechnung</h3>
          </div>
          <strong>${escapeHtml(formatCurrency(summary.total))}</strong>
        </header>
        <div class="trip-expense-actions">
          <button class="primary-action" type="button" data-open-trip-expense="${escapeHtml(trip.id)}">Ausgabe ergänzen</button>
        </div>
        <div class="trip-expense-layout">
          <div class="trip-expense-list">
            ${previewExpenses.length ? previewExpenses.map((expense) => renderTripExpense(expense, trip.id)).join("") : renderEmptyState("Noch keine Ausgaben eingetragen.")}
            ${expenses.length > 3 ? `<button type="button" data-open-trip-expenses="${escapeHtml(trip.id)}">Alle Zahlungen ansehen</button>` : ""}
          </div>
          <div class="trip-settlement">
            <h4>Gesamtabrechnung</h4>
            ${summary.settlements.length
              ? summary.settlements.map((settlement) => `
                <p class="settlement-line"><span><b>${escapeHtml(settlement.from)}</b> zahlt <b>${escapeHtml(settlement.to)}</b> ${escapeHtml(formatCurrency(settlement.amount))}</span><button type="button" data-settlement-paid data-trip-id="${escapeHtml(trip.id)}" data-from="${escapeHtml(settlement.from)}" data-to="${escapeHtml(settlement.to)}" data-amount="${escapeHtml(settlement.amount)}">bezahlt</button></p>
              `).join("")
              : `<p>Alles ausgeglichen.</p>`}
            <div class="trip-balances">
              ${summary.balances.map((entry) => `
                <span class="${entry.amount >= 0 ? "is-positive" : "is-negative"}">${escapeHtml(entry.member)} ${escapeHtml(formatCurrency(entry.amount))}</span>
              `).join("")}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderTripExpense(expense, tripId) {
    const participantText = expense.participants.length === data.members.length
      ? "alle"
      : expense.participants.join(", ");
    return `
      <article class="trip-expense">
        <div>
          <h4>${escapeHtml(expense.title || "Ausgabe")}</h4>
          <p>${escapeHtml([expense.date ? formatDate(expense.date) : "", `gezahlt von ${expense.payer}`, `für ${participantText}`].filter(Boolean).join(" · "))}</p>
          ${expense.notes ? `<small>${escapeHtml(expense.notes)}</small>` : ""}
        </div>
        <strong>${escapeHtml(formatCurrency(expense.amount))}</strong>
        <div class="trip-expense__actions">
          <button type="button" data-edit-trip-expense="${escapeHtml(expense.id)}" data-trip-id="${escapeHtml(tripId)}">Bearbeiten</button>
          <button type="button" data-delete-trip-expense="${escapeHtml(expense.id)}" data-trip-id="${escapeHtml(tripId)}">Entfernen</button>
        </div>
      </article>
    `;
  }

  function renderTripExpensesListModal(tripId) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    if (!trip) return "";
    const expenses = [...(trip.expenses || [])].sort((a, b) => `${b.date || ""} ${b.title}`.localeCompare(`${a.date || ""} ${a.title}`, "de"));
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="trip-expenses-modal-title">
          <div class="modal-head">
            <div>
              <h2 id="trip-expenses-modal-title">Alle Zahlungen</h2>
              <p class="modal-subtitle">${escapeHtml(trip.name || "Trip")}</p>
            </div>
            <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
          </div>
          <div class="trip-expense-list trip-expense-list--modal">
            ${expenses.length ? expenses.map((expense) => renderTripExpense(expense, trip.id)).join("") : renderEmptyState("Noch keine Ausgaben eingetragen.")}
          </div>
        </section>
      </div>
    `;
  }

  function sortTrips(a, b) {
    const today = new Date().toISOString().slice(0, 10);
    const aPast = a.endDate && a.endDate < today;
    const bPast = b.endDate && b.endDate < today;
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast
      ? (b.startDate || "").localeCompare(a.startDate || "")
      : (a.startDate || "9999-12-31").localeCompare(b.startDate || "9999-12-31");
  }

  function sortTripItems(a, b) {
    return `${a.date || "9999-12-31"} ${a.time || "99:99"} ${a.title}`
      .localeCompare(`${b.date || "9999-12-31"} ${b.time || "99:99"} ${b.title}`, "de");
  }

  function sortTripPlanItems(a, b) {
    return `${a.date || "9999-12-31"} ${a.time || "99:99"} ${tripPlanSortLocation(a)} ${a.title}`
      .localeCompare(`${b.date || "9999-12-31"} ${b.time || "99:99"} ${tripPlanSortLocation(b)} ${b.title}`, "de");
  }

  function tripPlanSortLocation(item) {
    return [
      germanCountry(item.country),
      item.city || extractCityFromAddress(item.address) || item.address,
    ].map(normalize).join(" ");
  }

  function groupTripItems(items) {
    const groups = new Map();
    items.forEach((item) => {
      const key = item.date || "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return [...groups.entries()];
  }

  function tripTimelineGroups(trip) {
    const dates = unique([
      ...tripDateValues(trip),
      ...(trip.items || []).flatMap((item) => [item.date, item.endDate]).filter(Boolean),
    ]).sort();
    const groups = dates
      .map((date) => [date, tripTimelineEntriesForDate(trip, date)])
      .filter(([, entries]) => entries.length);
    const unscheduled = (trip.items || [])
      .filter((item) => !item.date)
      .sort(sortTripItems)
      .map((item) => ({ kind: "item", item }));
    return unscheduled.length ? [["", unscheduled], ...groups] : groups;
  }

  function tripTimelineEntriesForDate(trip, date) {
    const baseEntries = [
      ...tripAccommodationsForStartDate(trip, date).map((item) => tripAccommodationTimelineEntry(item, date, "start")),
      ...(trip.items || [])
        .filter((item) => item.date === date && item.type !== "accommodation")
        .map((item) => ({ kind: "item", item, sortMinutes: timeToMinutes(item.time) ?? 720 })),
      ...tripAccommodationsForEndDate(trip, date).map((item) => tripAccommodationTimelineEntry(item, date, "end")),
    ].sort(sortTripTimelineEntries);

    decorateTripTimelineEntries(baseEntries);
    const entries = [];
    baseEntries.forEach((entry, index) => {
      if (index > 0) {
        const leg = tripTravelLeg(baseEntries[index - 1].item, entry.item);
        if (leg) entries.push({ kind: "travel", leg });
      }
      entries.push(entry);
    });
    return entries;
  }

  function sortTripTimelineEntries(a, b) {
    return (a.sortMinutes - b.sortMinutes)
      || (a.item.title || "").localeCompare(b.item.title || "", "de");
  }

  function tripAccommodationTimelineEntry(item, date, position) {
    const start = position === "start";
    return {
      kind: "item",
      item,
      accommodationPosition: position,
      sortMinutes: start ? 0 : 1439,
      timeLabel: start ? "Abfahrt" : "Ankunft",
      detailText: start ? `von ${item.title || "Unterkunft"}` : `Übernachtung ${formatDate(date)}`,
      hint: "",
    };
  }

  function decorateTripTimelineEntries(entries) {
    entries.forEach((entry, index) => {
      if (!entry.accommodationPosition) return;
      if (entry.accommodationPosition === "start") {
        const next = entries.slice(index + 1).find((candidate) => candidate.item.type !== "accommodation" && candidate.item.time);
        const leg = next ? tripTravelLeg(entry.item, next.item) : null;
        entry.hint = latestDepartureText(next?.item, leg);
      } else {
        const previous = [...entries.slice(0, index)].reverse().find((candidate) => candidate.item.type !== "accommodation" && candidate.item.time);
        const leg = previous ? tripTravelLeg(previous.item, entry.item) : null;
        entry.hint = approximateArrivalText(previous?.item, leg);
      }
    });
  }

  function tripAccommodationsForStartDate(trip, date) {
    return (trip.items || [])
      .filter((item) => item.type === "accommodation" && item.date && item.date < date && (item.endDate || item.date) >= date)
      .sort(sortTripItems);
  }

  function tripAccommodationsForEndDate(trip, date) {
    return (trip.items || [])
      .filter((item) => item.type === "accommodation" && item.date && (
        item.endDate ? item.date <= date && date < item.endDate : item.date === date
      ))
      .sort(sortTripItems);
  }

  function tripAccommodationStartForDate(trip, date) {
    return tripAccommodationsForStartDate(trip, date)[0] || null;
  }

  function tripAccommodationEndForDate(trip, date) {
    return tripAccommodationsForEndDate(trip, date)[0] || null;
  }

  function tripStatus(trip) {
    const today = new Date().toISOString().slice(0, 10);
    if (!trip.startDate) return { label: "Planung", className: "is-planning" };
    if (trip.endDate && trip.endDate < today) return { label: "Abgeschlossen", className: "is-past" };
    if (trip.startDate <= today && (!trip.endDate || trip.endDate >= today)) return { label: "Unterwegs", className: "is-current" };
    return { label: "Geplant", className: "is-upcoming" };
  }

  function tripDuration(trip) {
    if (!trip.startDate || !trip.endDate) return trip.startDate ? 1 : 0;
    const start = new Date(`${trip.startDate}T00:00:00`);
    const end = new Date(`${trip.endDate}T00:00:00`);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) return 0;
    return Math.round((end - start) / 86400000) + 1;
  }

  function tripDateValues(trip) {
    if (!trip.startDate) return [];
    const start = new Date(`${trip.startDate}T00:00:00`);
    const end = new Date(`${trip.endDate || trip.startDate}T00:00:00`);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) return [trip.startDate];
    const values = [];
    for (let date = new Date(start); date <= end && values.length < 31; date.setDate(date.getDate() + 1)) {
      values.push(localIsoDate(date));
    }
    return values;
  }

  function tripDateOptions(trip, current = "", placeholder = "Offen") {
    const values = tripDateValues(trip);
    if (current && !values.includes(current)) values.push(current);
    return [
      `<option value="" ${current ? "" : "selected"}>${escapeHtml(placeholder)}</option>`,
      ...values.map((date) => `<option value="${escapeHtml(date)}" ${current === date ? "selected" : ""}>${escapeHtml(formatDate(date))}</option>`),
    ].join("");
  }

  function timeSlotOptions(current = "", placeholder = "Offen") {
    const selected = roundToQuarterHour(current);
    const options = [`<option value="" ${selected ? "" : "selected"}>${escapeHtml(placeholder)}</option>`];
    for (let minutes = 0; minutes < 1440; minutes += 15) {
      const value = minutesToTime(minutes);
      options.push(`<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`);
    }
    return options.join("");
  }

  function roundToQuarterHour(value) {
    const minutes = timeToMinutes(value);
    if (minutes === null) return "";
    return minutesToTime(Math.round(minutes / 15) * 15);
  }

  function minutesToTime(minutes) {
    const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function tripPlanAnalysis(trip) {
    const warningsById = new Map();
    const legsByTargetId = new Map();
    const routeLegs = [];
    const dayItemsByDate = new Map();
    const datedItems = [
      ...tripPlanStartWaypoints(trip),
      ...(trip.planItems || []),
      ...tripPlanAccommodationWaypoints(trip),
    ]
      .filter((item) => item.date)
      .map((item) => ({ ...item, coords: tripPlanItemCoords(item) }))
      .sort(sortTripPlanItems);

    tripDateValues(trip).forEach((date) => {
      const dayItems = datedItems
        .filter((item) => item.date === date)
        .sort((a, b) => `${a.time || "99:99"} ${tripPlanTimelineOrder(a)} ${a.title}`.localeCompare(`${b.time || "99:99"} ${tripPlanTimelineOrder(b)} ${b.title}`, "de"));

      dayItems.forEach((item) => {
        if (item.type !== "accommodation" && item.time && !item.duration) addTripPlanWarning(warningsById, item.id, "Dauer fehlt für die Zeitplanung.");
      });

      for (let index = 1; index < dayItems.length; index += 1) {
        const previous = dayItems[index - 1];
        const current = dayItems[index];
        const leg = tripPlanLeg(previous, current);
        if (leg) {
          routeLegs.push(leg);
          legsByTargetId.set(current.id, leg);
        }

        if (previous.type === "accommodation" || current.type === "accommodation") continue;
        if (!previous.time || !current.time || !previous.duration) continue;

        const previousEnd = timeToMinutes(previous.time) + Number(previous.duration);
        const currentStart = timeToMinutes(current.time);
        if (currentStart === null) continue;
        const travel = leg?.durationMinutes ?? null;
        if (travel === null) {
          addTripPlanWarning(warningsById, current.id, "Fahrzeit konnte noch nicht berechnet werden.");
          continue;
        }

        const earliestStart = previousEnd + travel;
        if (currentStart < earliestStart) {
          addTripPlanWarning(
            warningsById,
            current.id,
            `Zeitkonflikt: ${previous.title} endet ${minutesToTime(previousEnd)}, Fahrzeit ca. ${travel} Min.; frühestens ${minutesToTime(earliestStart)}.`,
          );
        }
      }
      dayItemsByDate.set(date, dayItems);
    });

    addCrossDayTripPlanLegs(trip, dayItemsByDate, legsByTargetId, routeLegs);

    return { warningsById, legsByTargetId, routeLegs };
  }

  function addCrossDayTripPlanLegs(trip, dayItemsByDate, legsByTargetId, routeLegs) {
    const dates = tripDateValues(trip);
    for (let index = 1; index < dates.length; index += 1) {
      const previousDate = dates[index - 1];
      const currentDate = dates[index];
      if (tripAccommodationEndForDate(trip, previousDate) || tripAccommodationStartForDate(trip, currentDate)) continue;

      const previous = lastRoutablePlanItem(dayItemsByDate.get(previousDate) || []);
      const current = firstRoutablePlanItem(dayItemsByDate.get(currentDate) || []);
      const leg = previous && current ? tripPlanLeg(previous, current) : null;
      if (!leg) continue;

      routeLegs.push(leg);
      if (!legsByTargetId.has(current.id)) legsByTargetId.set(current.id, leg);
    }
  }

  function routableTripPlanItem(item) {
    return item && item.type !== "start" && item.type !== "accommodation" && tripPlanItemCoords(item);
  }

  function firstRoutablePlanItem(items) {
    return items.find(routableTripPlanItem) || null;
  }

  function lastRoutablePlanItem(items) {
    return [...items].reverse().find(routableTripPlanItem) || null;
  }

  function tripPlanStartWaypoints(trip) {
    return tripStartItems(trip).map((item) => ({
      ...item,
      id: `${item.id}:start:${item.date || trip.startDate || ""}`,
      date: item.date || trip.startDate,
      time: "00:00",
      duration: 0,
      title: item.title || "Startadresse",
    })).filter((item) => item.date);
  }

  function tripPlanTimelineOrder(item) {
    if (item.type === "start") return 0;
    if (item.type === "accommodation" && String(item.id || "").includes(":start:")) return 1;
    if (item.type === "accommodation" && String(item.id || "").includes(":end:")) return 9;
    return 5;
  }

  function tripPlanAccommodationWaypoints(trip) {
    return tripDateValues(trip).flatMap((date) => [
      ...tripAccommodationsForStartDate(trip, date).map((item) => ({
        ...item,
        id: `${item.id}:start:${date}`,
        date,
        time: "00:00",
        duration: 0,
        title: item.title || "Unterkunft",
      })),
      ...tripAccommodationsForEndDate(trip, date).map((item) => ({
        ...item,
        id: `${item.id}:end:${date}`,
        date,
        time: "23:59",
        duration: 0,
        title: item.title || "Unterkunft",
      })),
    ]);
  }

  function addTripPlanWarning(warningsById, itemId, message) {
    const warnings = warningsById.get(itemId) || [];
    if (!warnings.includes(message)) warnings.push(message);
    warningsById.set(itemId, warnings);
  }

  function tripPlanLeg(previous, current) {
    return tripTravelLeg(previous, current);
  }

  function tripTravelLeg(previous, current) {
    if (previous?.id && current?.id && previous.id === current.id) return null;
    const from = tripPlanItemCoords(previous);
    const to = tripPlanItemCoords(current);
    if (!from || !to) return null;
    const key = tripPlanRouteKey(from, to);
    const cached = tripPlanMapState.routeCache.get(key);
    const fallbackDuration = estimatedTravelMinutes(from, to);
    return {
      key,
      from,
      to,
      sourceId: previous.id,
      targetId: current.id,
      sourceTitle: previous.title,
      targetTitle: current.title,
      durationMinutes: cached?.durationMinutes || fallbackDuration,
      distanceKm: cached?.distanceKm || haversineDistanceKm(from, to),
      geometry: cached?.geometry || null,
      estimated: !cached?.durationMinutes,
    };
  }

  function tripPlanLegText(leg) {
    return `${tripTravelSummary(leg)} von ${leg.sourceTitle}`;
  }

  function tripTravelSummary(leg) {
    const prefix = leg.estimated ? "Fahrzeit ca." : "Fahrzeit";
    return `${prefix} ${leg.durationMinutes} Min.`;
  }

  function latestDepartureText(item, leg) {
    if (!item?.time || !leg?.durationMinutes) return "";
    const start = timeToMinutes(item.time);
    if (start === null) return "";
    return `Späteste Abfahrt ${minutesToTime(start - leg.durationMinutes)}`;
  }

  function approximateArrivalText(item, leg) {
    if (!item?.time || !item?.duration || !leg?.durationMinutes) return "";
    const start = timeToMinutes(item.time);
    if (start === null) return "";
    return `Ankunft ca. ${minutesToTime(start + Number(item.duration) + leg.durationMinutes)}`;
  }

  function tripPlanItemCoords(item) {
    if (Array.isArray(item.coords) && item.coords.length === 2 && item.coords.every(Number.isFinite)) return item.coords;
    return coordsForCity(tripPlanPlace(item));
  }

  function tripPlanRouteKey(from, to) {
    return [from, to].map((coords) => coords.map((value) => Number(value).toFixed(5)).join(",")).join(">");
  }

  function estimatedTravelMinutes(from, to) {
    const distance = haversineDistanceKm(from, to);
    if (!Number.isFinite(distance)) return null;
    return Math.max(8, Math.ceil(distance / 55 * 60 + 8));
  }

  function haversineDistanceKm(from, to) {
    if (!from || !to) return NaN;
    const radius = 6371;
    const lat1 = toRadians(Number(from[0]));
    const lat2 = toRadians(Number(to[0]));
    const deltaLat = toRadians(Number(to[0]) - Number(from[0]));
    const deltaLon = toRadians(Number(to[1]) - Number(from[1]));
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function toRadians(value) {
    return value * Math.PI / 180;
  }

  function formatTripRange(trip) {
    if (!trip.startDate) return "Termin offen";
    if (!trip.endDate || trip.endDate === trip.startDate) return formatDate(trip.startDate);
    return `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;
  }

  function durationBetweenTimes(startTime, endTime) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (start === null || end === null) return null;
    const duration = end >= start ? end - start : end + 1440 - start;
    return duration > 0 && duration <= 360 ? duration : null;
  }

  function addMinutesToTime(startTime, duration) {
    const start = timeToMinutes(startTime);
    const minutes = numberOrNull(duration);
    if (start === null || minutes === null || minutes <= 0) return "";
    const total = (start + Math.round(minutes)) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function timeToMinutes(value) {
    const match = clean(value).match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  function formatWeekday(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.valueOf())) return "TAG";
    return new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(date).replace(".", "").toUpperCase();
  }

  function formatLongDate(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.valueOf())) return value;
    return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(date);
  }

  function mapsRouteUrl(item) {
    const destination = [item.address, item.city].filter(Boolean).join(", ");
    return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : "";
  }

  function tripStartItems(trip) {
    return (trip.items || [])
      .filter((item) => item.type === "start")
      .sort(sortTripItems);
  }

  function tripStartForDate(trip, date) {
    const starts = tripStartItems(trip);
    return starts.find((item) => (item.date || trip.startDate) === date) || null;
  }

  function findMatchingWish(item) {
    return findRoomByTitle(item, data.wishList);
  }

  function findMatchingPlayedRoom(item) {
    return findRoomByTitle(item, data.played);
  }

  function findRoomByTitle(item, entries) {
    const title = normalize(item.title);
    if (!title) return null;
    return entries.find((entry) => normalize(entry.title) === title)
      || entries.find((entry) => {
        const candidate = normalize(entry.title);
        return candidate.length >= 6 && (title.includes(candidate) || candidate.includes(title));
      })
      || null;
  }

  function extractCityFromAddress(address) {
    const text = clean(address);
    const canadianCity = text.match(/,\s*([A-Za-zÀ-ÿ.'-]+(?:\s+[A-Za-zÀ-ÿ.'-]+){0,2}),\s*(?:QC|Quebec|Québec|ON|Ontario|BC|AB)\s+[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/i);
    if (canadianCity?.[1]) return clean(canadianCity[1]);
    const postalCity = text.match(/\b\d{4,6}\s+([A-Za-zÀ-ÿ.'-]+(?:\s+[A-Za-zÀ-ÿ.'-]+){0,2})\b/);
    if (postalCity) {
      const city = clean(postalCity[1].replace(/\b(?:Belgium|Belgien|Deutschland|Germany|France|Frankreich|Netherlands|Niederlande|Luxembourg|Luxemburg|Schweiz|Switzerland|Canada|Kanada|Quebec|Québec|USA|UK)\b.*$/i, ""));
      if (city && !/^(?:bd|boul|blvd|boulevard|av|ave|avenue|street|st|road|rd|rue|laan|weg|strasse|straße)\b/i.test(city)) return city;
    }
    const parts = text.split(",").map(clean).filter(Boolean);
    if (!parts.length) return "";
    const countries = new Set(["belgium", "belgique", "belgie", "belgien", "france", "frankreich", "germany", "deutschland", "netherlands", "nederland", "niederlande", "luxembourg", "luxemburg", "switzerland", "schweiz", "canada", "kanada", "usa", "uk"]);
    let candidate = parts[parts.length - 1];
    if ((countries.has(normalize(candidate)) || isAddressRegionTail(candidate)) && parts.length > 1) candidate = parts[parts.length - 2];
    return clean(candidate.replace(/\b\d{4,6}\b/g, "").replace(/\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/i, ""));
  }

  function isAddressRegionTail(value) {
    return /^(?:qc|quebec|québec|on|ontario|bc|british columbia|ab|alberta)\b/i.test(clean(value))
      || /\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/i.test(clean(value));
  }

  function renderMapView() {
    const isPlanningSource = ["terpeca", "escaperoomers"].includes(ui.mapSource);
    const requiresRegionSelection = mapRequiresPlanningRegionSelection();
    const planningCounts = isPlanningSource && !requiresRegionSelection
      ? planningStatusCounts(ui.mapSource, ui.mapRegion, ui.mapSearch)
      : { all: isPlanningSource ? planningRooms(ui.mapSource).length : 0, unplayed: 0, upnext: 0, played: 0 };
    const options = (isPlanningSource ? planningRegionOptions(ui.mapSource) : regionOptions())
      .map((option) => `<option value="${escapeHtml(option.value)}" ${ui.mapRegion === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("");
    const entries = getMapEntries();
    const groups = mapCityGroups(entries);
    const mapList = requiresRegionSelection ? renderMapRegionPrompt() : renderMapList(groups, groups, entries.length);

    return `
      <section class="toolbar map-toolbar">
        <label>
          <span>Quelle</span>
          <select id="map-source">
            ${selectOption("played", `Gespielt (${data.played.length})`, ui.mapSource)}
            ${selectOption("wish", `Up Next (${data.wishList.length})`, ui.mapSource)}
            ${selectOption("all", `Alle (${data.played.length + data.wishList.length})`, ui.mapSource)}
            ${selectOption("terpeca", `TERPECA ${planningData.terpecaYear} (${planningData.terpeca.length})`, ui.mapSource)}
            ${selectOption("escaperoomers", `EscapeRoomers (${planningData.escaperoomers.length})`, ui.mapSource)}
          </select>
        </label>
        <label>
          <span>Gebiet</span>
          <select id="map-region">${options}</select>
        </label>
        <label ${isPlanningSource ? "" : "hidden"}>
          <span>Status</span>
          <select id="map-planning-status">
            ${planningStatusOptions(ui.mapPlanningStatus, planningCounts)}
          </select>
        </label>
        <label class="search-box">
          <span>Suche</span>
          <input type="search" id="map-search" value="${escapeHtml(ui.mapSearch)}" placeholder="Raum, Anbieter, Stadt">
        </label>
      </section>
      ${renderBulkPlanControls("map")}

      <section class="map-layout">
        <div class="map-shell">
          <div id="map-canvas" class="map-canvas" aria-label="Karte"></div>
        </div>
        <aside class="map-list" data-map-list>
          ${mapList}
        </aside>
      </section>
    `;
  }

  function renderMapList(groups, allGroups = groups, roomCount = null) {
    const listedRooms = roomCount ?? groups.reduce((sum, group) => sum + group.entries.length, 0);
    const listedMappedPlaces = groups.filter((group) => group.coords).length;
    const totalMappedPlaces = allGroups.filter((group) => group.coords).length;
    const missingGroups = allGroups.filter((group) => !group.coords);

    return `
      <div class="map-summary">
        <strong>${listedRooms}</strong>
        <span>Räume im Ausschnitt · ${listedMappedPlaces}/${totalMappedPlaces} Orte</span>
      </div>
      ${groups.length ? groups.map(renderMapGroup).join("") : renderEmptyState("Keine Räume im aktuellen Kartenausschnitt.")}
      ${missingGroups.length ? `<p class="map-missing">Ohne Kartenpunkt: ${escapeHtml(missingGroups.map((group) => group.city).join(", "))}</p>` : ""}
    `;
  }

  function renderMapRegionPrompt() {
    return `
      <div class="map-summary">
        <strong>0</strong>
        <span>Bitte Gebiet auswählen</span>
      </div>
      ${renderEmptyState("Wähle zuerst ein EscapeRoomers-Gebiet aus. Danach lädt die Karte nur diese regionale Top-20-Liste.")}
    `;
  }

  function renderMapGroup(group) {
    return `
      <article class="map-place ${group.coords ? "" : "is-muted"}">
        <strong>${escapeHtml(group.city)}</strong>
        <span>${group.catalog ? `${group.catalog} Ranking-Räume` : `${group.played ? `${group.played} gespielt` : ""}${group.played && group.wish ? " · " : ""}${group.wish ? `${group.wish} Up Next` : ""}`}</span>
        <div class="map-room-list">${group.entries.map(renderMapRoom).join("")}</div>
      </article>
    `;
  }

  function renderMapRoom(item) {
    const room = item.entry;
    if (item.type === "wish") {
      return `
        <div class="map-room ${bulkPlanningActive("map") ? "is-selectable" : ""}">
          ${renderBulkPlanCheckbox("map", "upnext", room.id, room.title)}
          <div>${escapeHtml(room.title)}<small>${escapeHtml([room.provider, room.city, room.country].filter(Boolean).join(" · "))}</small></div>
          <div>
            ${room.link ? `<a href="${escapeHtml(room.link)}" target="_blank" rel="noreferrer">Link</a>` : ""}
            ${data.trips.length ? `<button type="button" data-plan-wish="${escapeHtml(room.id)}">Planen</button>` : ""}
          </div>
        </div>
      `;
    }
    if (item.type !== "catalog") return `<small>${escapeHtml(room.title)}${room.provider ? ` · ${escapeHtml(room.provider)}` : ""}</small>`;
    const state = planningRoomState(room);
    return `
      <div class="map-room ${bulkPlanningActive("map") ? "is-selectable" : ""}">
        ${renderBulkPlanCheckbox("map", "planning", room.id, room.title)}
        <div><b>${room.rank}.</b> ${escapeHtml(room.title)}<small>${escapeHtml(room.provider || "")}</small></div>
        <div>
          ${room.website ? `<a href="${escapeHtml(room.website)}" target="_blank" rel="noreferrer" aria-label="Website öffnen">Link</a>` : `<a href="${escapeHtml(planningRoomSearchUrl(room))}" target="_blank" rel="noreferrer">Suche</a>`}
          ${state === "unplayed" ? `<button type="button" data-planning-upnext="${escapeHtml(room.id)}">+ Up Next</button>` : ""}
          <button type="button" data-planning-link="${escapeHtml(room.id)}">Zuordnen</button>
          ${data.trips.length ? `<button type="button" data-plan-planning="${escapeHtml(room.id)}">Planen</button>` : ""}
        </div>
      </div>
    `;
  }

  function mapViewportKey() {
    return [
      ui.mapSource,
      ui.mapRegion,
      ui.mapPlanningStatus,
      normalize(ui.mapSearch),
    ].join("|");
  }

  function currentMapView(viewportKey) {
    if (!mapState.map) return mapState.lastView;
    try {
      const center = mapState.map.getCenter();
      const zoom = mapState.map.getZoom();
      if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lng) || !Number.isFinite(zoom)) return null;
      const view = { center: [center.lat, center.lng], zoom };
      mapState.lastView = view;
      return mapState.viewportKey === viewportKey ? view : mapState.lastView;
    } catch {
      return mapState.lastView;
    }
  }

  function renderMap() {
    const canvas = app.querySelector("#map-canvas");
    if (!canvas) return;
    const groups = mapCityGroups();
    const viewportKey = mapViewportKey();
    const preservedView = currentMapView(viewportKey);
    mapState.groups = groups;
    queueMissingGeocodes(groups);

    if (!window.L) {
      canvas.innerHTML = '<div class="map-fallback">Karte lädt...</div>';
      return;
    }

    const shouldFitMap = !preservedView;

    if (mapState.map && mapState.container !== canvas) {
      mapState.map.remove();
      mapState.map = null;
      mapState.layer = null;
      mapState.listListenerAttached = false;
      if (!preservedView) mapState.viewportKey = "";
    }

    if (!mapState.map) {
      mapState.map = window.L.map(canvas, { scrollWheelZoom: true });
      window.L.tileLayer(MAP_TILE_URL, {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(mapState.map);
      mapState.container = canvas;
    }

    if (!mapState.listListenerAttached) {
      mapState.map.on("moveend zoomend", updateVisibleMapList);
      mapState.listListenerAttached = true;
    }

    if (mapState.layer) mapState.layer.remove();
    mapState.layer = window.L.layerGroup().addTo(mapState.map);

    const mappedGroups = groups.filter((group) => group.coords);
    mappedGroups.forEach((group) => {
      const total = group.played + group.wish + group.catalog;
      const marker = window.L.marker(group.coords).addTo(mapState.layer);
      marker.bindPopup(`
        <strong>${escapeHtml(group.city)}</strong><br>
        ${group.played ? `${group.played} gespielt` : ""}
        ${group.played && group.wish ? " · " : ""}
        ${group.wish ? `${group.wish} Up Next` : ""}${group.catalog ? `${group.catalog} Ranking-Räume` : ""}
        <br><small>${escapeHtml(group.entries.slice(0, 5).map((item) => item.entry.title).join(", "))}${total > 5 ? " ..." : ""}</small>
      `);
    });

    window.setTimeout(() => {
      mapState.map.invalidateSize();
      if (preservedView && !shouldFitMap) {
        mapState.map.setView(preservedView.center, preservedView.zoom, { animate: false });
        mapState.viewportKey = viewportKey;
      } else if (shouldFitMap) {
        if (mappedGroups.length) {
          const bounds = window.L.latLngBounds(mappedGroups.map((group) => group.coords));
          mapState.map.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 });
        } else {
          mapState.map.setView([51.1657, 10.4515], 5);
        }
        mapState.viewportKey = viewportKey;
      }
      updateVisibleMapList();
    }, 60);
  }

  function visibleMapGroups() {
    if (!mapState.map || !window.L) return mapState.groups;
    const bounds = mapState.map.getBounds();
    return mapState.groups.filter((group) => {
      if (!group.coords) return false;
      return bounds.contains(window.L.latLng(group.coords[0], group.coords[1]));
    });
  }

  function syncMapViewportMeta() {
    const canvas = app.querySelector("#map-canvas");
    if (!canvas || !mapState.map) return;
    try {
      const center = mapState.map.getCenter();
      canvas.dataset.mapZoom = String(mapState.map.getZoom());
      canvas.dataset.mapCenter = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
      mapState.lastView = { center: [center.lat, center.lng], zoom: mapState.map.getZoom() };
    } catch {
      canvas.dataset.mapZoom = "";
      canvas.dataset.mapCenter = "";
    }
  }

  function updateVisibleMapList() {
    const list = app.querySelector("[data-map-list]");
    if (!list) return;
    syncMapViewportMeta();
    if (mapRequiresPlanningRegionSelection()) {
      list.innerHTML = renderMapRegionPrompt();
      return;
    }
    const visibleGroups = visibleMapGroups();
    list.innerHTML = renderMapList(visibleGroups, mapState.groups);
    bindPlanningActions(list);
    bindPlanSourceActions(list);
  }

  function currentTripPlanMapView() {
    if (!tripPlanMapState.map) return null;
    try {
      const center = tripPlanMapState.map.getCenter();
      const zoom = tripPlanMapState.map.getZoom();
      if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lng) || !Number.isFinite(zoom)) return null;
      return { center: [center.lat, center.lng], zoom };
    } catch {
      return null;
    }
  }

  function rememberTripPlanMapView(tripId = tripPlanMapState.tripId) {
    const view = currentTripPlanMapView();
    if (tripId && view) tripPlanMapState.viewByTripId.set(tripId, view);
    return view;
  }

  function renderTripPlanMap() {
    const canvas = app.querySelector("#trip-plan-map");
    if (!canvas) return;
    const trip = data.trips.find((entry) => entry.id === canvas.dataset.tripPlanMap);
    if (!trip) return;
    const groups = tripPlanGroups(trip);
    queueMissingGeocodes(groups.slice(0, 6));
    const analysis = tripPlanAnalysis(trip);
    queueTripPlanRoutes(analysis.routeLegs);
    const preservedView = tripPlanMapState.tripId === trip.id
      ? rememberTripPlanMapView(trip.id) || tripPlanMapState.viewByTripId.get(trip.id)
      : tripPlanMapState.viewByTripId.get(trip.id);

    if (!window.L) {
      canvas.innerHTML = '<div class="map-fallback">Karte lädt...</div>';
      return;
    }

    if (tripPlanMapState.map && tripPlanMapState.container !== canvas) {
      rememberTripPlanMapView();
      tripPlanMapState.map.remove();
      tripPlanMapState.map = null;
      tripPlanMapState.layer = null;
      tripPlanMapState.routeLayer = null;
      tripPlanMapState.listenerAttached = false;
    }

    if (!tripPlanMapState.map) {
      tripPlanMapState.map = window.L.map(canvas, { scrollWheelZoom: true });
      window.L.tileLayer(MAP_TILE_URL, {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(tripPlanMapState.map);
      tripPlanMapState.container = canvas;
    }
    tripPlanMapState.tripId = trip.id;

    if (!tripPlanMapState.listenerAttached) {
      tripPlanMapState.map.on("moveend zoomend", () => rememberTripPlanMapView(trip.id));
      tripPlanMapState.listenerAttached = true;
    }

    if (tripPlanMapState.layer) tripPlanMapState.layer.remove();
    tripPlanMapState.layer = window.L.layerGroup().addTo(tripPlanMapState.map);
    if (tripPlanMapState.routeLayer) tripPlanMapState.routeLayer.remove();
    tripPlanMapState.routeLayer = window.L.layerGroup().addTo(tripPlanMapState.map);

    analysis.routeLegs.forEach((leg) => {
      if (leg.geometry) {
        window.L.geoJSON(leg.geometry, {
          style: { color: "#0f766e", weight: 4, opacity: 0.74 },
        }).addTo(tripPlanMapState.routeLayer);
      } else {
        window.L.polyline([leg.from, leg.to], {
          color: "#0f766e",
          dashArray: "6 8",
          weight: 3,
          opacity: 0.62,
        }).addTo(tripPlanMapState.routeLayer);
      }
    });

    const mappedItems = tripPlanMapItems(trip);
    mappedItems.forEach((item) => {
      const marker = window.L.marker(item.coords).addTo(tripPlanMapState.layer);
      const roomLabel = [
        shortProviderLabel(item.title || item.provider),
        tripPlanMapItemIsScheduled(item) ? "✓" : "",
      ].filter(Boolean).join(" ");
      if (roomLabel) {
        marker.bindTooltip(escapeHtml(roomLabel), {
          permanent: true,
          direction: "top",
          offset: [0, -16],
          className: "trip-provider-tooltip",
        });
      }
      marker.bindPopup(`
        <strong>${escapeHtml(item.title)}</strong><br>
        ${escapeHtml(tripPlanSubtitle(item))}
        ${item.date || item.time ? `<br><small>${escapeHtml([formatDate(item.date), item.time].filter(Boolean).join(" · "))}</small>` : ""}
      `);
    });

    window.setTimeout(() => {
      tripPlanMapState.map.invalidateSize();
      if (preservedView) {
        tripPlanMapState.map.setView(preservedView.center, preservedView.zoom, { animate: false });
      } else if (mappedItems.length) {
        const bounds = window.L.latLngBounds(mappedItems.map((item) => item.coords));
        tripPlanMapState.map.fitBounds(bounds, { padding: [22, 22], maxZoom: 10 });
      } else {
        tripPlanMapState.map.setView([50.85, 4.35], 6);
      }
    }, 60);
  }

  function tripPlanMapItems(trip) {
    return [
      ...(trip.planItems || []),
      ...(trip.items || []).filter((item) => item.type === "accommodation" || item.type === "start"),
    ]
      .map((item) => ({ ...item, coords: tripPlanItemCoords(item) }))
      .filter((item) => item.coords);
  }

  function tripPlanMapItemIsScheduled(item) {
    return Boolean(item.date || item.time || item.tripItemId);
  }

  function shortProviderLabel(value) {
    const text = clean(value);
    if (!text) return "";
    return text.length > 15 ? `${text.slice(0, 15)}...` : text;
  }

  function queueTripPlanRoutes(legs) {
    legs
      .filter((leg) => leg.key && !tripPlanMapState.routeCache.has(leg.key) && !tripPlanMapState.pendingRoutes.has(leg.key))
      .slice(0, 6)
      .forEach((leg, index) => {
        tripPlanMapState.pendingRoutes.add(leg.key);
        window.setTimeout(() => {
          void fetchTripPlanRoute(leg);
        }, index * 250);
      });
  }

  async function fetchTripPlanRoute(leg) {
    try {
      const coordinates = `${leg.from[1]},${leg.from[0]};${leg.to[1]},${leg.to[0]}`;
      const response = await fetch(`${ROUTE_API_URL}${coordinates}?overview=simplified&geometries=geojson`);
      if (!response.ok) throw new Error(response.statusText);
      const route = (await response.json()).routes?.[0];
      if (!route) throw new Error("Keine Route gefunden");
      tripPlanMapState.routeCache.set(leg.key, {
        durationMinutes: Math.max(1, Math.ceil(route.duration / 60)),
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        geometry: route.geometry || null,
      });
      if (ui.view === "trips") render();
    } catch (error) {
      console.warn("Route lookup failed", error);
      tripPlanMapState.routeCache.set(leg.key, {
        durationMinutes: leg.durationMinutes,
        distanceKm: leg.distanceKm,
        geometry: null,
      });
      if (ui.view === "trips") renderTripPlanMap();
    } finally {
      tripPlanMapState.pendingRoutes.delete(leg.key);
    }
  }

  function tripPlanGroups(trip) {
    const groups = new Map();
    (trip.planItems || []).forEach((item) => {
      const city = tripPlanPlace(item);
      const key = normalizeCity(city);
      if (!key) return;
      const group = groups.get(key) || {
        city,
        coords: item.coords || coordsForCity(city),
        items: [],
      };
      group.items.push(item);
      if (!group.coords) group.coords = item.coords || coordsForCity(city);
      groups.set(key, group);
    });
    return [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.city.localeCompare(b.city, "de"));
  }

  function tripPlanPlace(item) {
    return clean(item.city || extractCityFromAddress(item.address) || item.address || item.country);
  }

  function queueMissingGeocodes(groups) {
    groups
      .filter((group) => !group.coords)
      .slice(0, 8)
      .forEach((group, index) => {
        const key = normalizeCity(group.city);
        if (!key || mapState.pendingGeocodes.has(key)) return;
        mapState.pendingGeocodes.add(key);
        window.setTimeout(() => {
          void geocodeCity(group.city, key);
        }, index * 350);
      });
  }

  async function geocodeCity(city, key = normalizeCity(city)) {
    if (!key) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(city)}`);
      if (!response.ok) throw new Error(response.statusText);
      const result = (await response.json())[0];
      if (result?.lat && result?.lon) {
        const regions = regionsFromNominatimResult(result, city);
        mapState.geocodeCache[key] = {
          coords: [Number(result.lat), Number(result.lon)],
          regions,
          countryCode: clean(result.address?.country_code).toUpperCase(),
          state: clean(result.address?.state),
        };
        saveGeocodeCache();
        updateRegionsForCity(key, regions);
        if (ui.view === "map") render();
        if (ui.view === "trips") renderTripPlanMap();
      }
    } catch (error) {
      console.warn("Geocoding failed", city, error);
    } finally {
      mapState.pendingGeocodes.delete(key);
    }
  }

  function regionsFromNominatimResult(result, city) {
    const address = result.address || {};
    const country = clean(address.country_code).toLowerCase();
    const state = normalize(address.state || address.region || address.county);
    const cityName = normalizeCity(address.city || address.town || address.village || city);
    const regions = [];

    if (country === "de") regions.push("DE");
    if (country === "de" && (state.includes("nordrhein westfalen") || state === "nrw")) regions.push("NRW");
    if (country === "de" && state.includes("hamburg")) regions.push("HH");
    if (["be", "nl", "lu"].includes(country)) regions.push("BENELUX");
    if (country === "es") regions.push("SPAIN");
    if (country === "pl") regions.push("POLAND");
    if (country === "hu") regions.push("HUNGARY");
    if (country === "cz") regions.push("CZECHIA");
    if (country === "fr") regions.push("FRANCE");
    if (country === "ie") regions.push("IRELAND");
    if (["gb", "uk"].includes(country)) regions.push("UK");
    if (country === "pt") regions.push("PORTUGAL");
    if (country === "it") regions.push("ITALY");
    if (country === "fi") regions.push("FINLAND");
    if (country === "hr") regions.push("CROATIA");
    if (country === "ca") regions.push("CANADA");
    if (["athen", "athens"].includes(cityName)) regions.push("Athen");

    return unique(regions);
  }

  function updateRegionsForCity(cityKey, regions) {
    if (!regions.length) return;
    let changed = false;
    data.played = data.played.map((room) => {
      if (normalizeCity(room.city) !== cityKey) return room;
      const nextRegions = unique([...(room.regions || []), ...regions]);
      if (nextRegions.length === (room.regions || []).length) return room;
      changed = true;
      return { ...room, regions: nextRegions };
    });
    if (changed) saveData();
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
    if (ui.modal.type === "room") return renderRoomModal(ui.modal.room, ui.modal.wishId, ui.modal.tripId, ui.modal.tripItemId);
    if (ui.modal.type === "wish") return renderWishModal(ui.modal.entry);
    if (ui.modal.type === "trip") return renderTripModal(ui.modal.trip, ui.modal.focus);
    if (ui.modal.type === "planCandidate") return renderPlanCandidateModal(ui.modal.sourceType, ui.modal.sourceId);
    if (ui.modal.type === "wishTrip") return renderWishTripModal(ui.modal.wishId);
    if (ui.modal.type === "planningLink") return renderPlanningLinkModal(ui.modal.roomId);
    if (ui.modal.type === "planningTrip") return renderPlanningTripModal(ui.modal.roomId);
    if (ui.modal.type === "tripItem") return renderTripItemModal(ui.modal.tripId, ui.modal.item, ui.modal.imported, ui.modal.planItemId);
    if (ui.modal.type === "tripExpense") return renderTripExpenseModal(ui.modal.tripId, ui.modal.expense);
    if (ui.modal.type === "tripExpensesList") return renderTripExpensesListModal(ui.modal.tripId);
    if (ui.modal.type === "tripImport") return renderTripImportModal(ui.modal.tripId);
    if (ui.modal.type === "tripUrlImport") return renderTripUrlImportModal(ui.modal.tripId);
    if (ui.modal.type === "tripShare") return renderTripShareModal();
    return "";
  }

  function renderCelebrationModal() {
    if (!ui.celebrations.length) return "";
    const messages = ui.celebrations.map((entry) => `
      <p><strong>${escapeHtml(entry.member)}</strong>: Das ist dein ${entry.count}. Raum gewesen!</p>
    `).join("");
    return `
      <div class="modal-backdrop celebration-backdrop" data-close-celebration>
        <section class="modal modal-small celebration-modal" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
          <div class="celebration-content">
            <div class="modal-head">
              <h2 id="celebration-title">Herzlichen Glückwunsch!</h2>
              <button type="button" class="icon-button" data-close-celebration aria-label="Schließen">x</button>
            </div>
            <div class="celebration-messages">${messages}</div>
            <div class="modal-actions">
              <button class="primary-action" type="button" data-close-celebration>Sehr schön</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function renderRoomModal(room = {}, wishId = "", tripId = "", tripItemId = "") {
    const ratings = normalizeRatings(room.ratings || {}, data.members);
    const playedBy = normalizePlayedBy(room.playedBy, ratings, data.members);
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">
          <form id="room-form">
            <input type="hidden" name="id" value="${escapeHtml(room.id || "")}">
            <input type="hidden" name="wishId" value="${escapeHtml(wishId)}">
            <input type="hidden" name="tripId" value="${escapeHtml(tripId)}">
            <input type="hidden" name="tripItemId" value="${escapeHtml(tripItemId)}">
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
              ${field("pricePerPerson", "Preis p.P. bei 5", entry.pricePerPerson ?? "", "number", false, "0", "", "0.01")}
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

  function renderTripModal(trip = {}, focus = "") {
    const rangeValue = trip.startDate
      ? [formatDate(trip.startDate), trip.endDate && trip.endDate !== trip.startDate ? formatDate(trip.endDate) : ""].filter(Boolean).join(" bis ")
      : "";
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="trip-modal-title">
          <form id="trip-form">
            <input type="hidden" name="id" value="${escapeHtml(trip.id || "")}">
            <input type="hidden" name="startDate" value="${escapeHtml(trip.startDate || "")}">
            <input type="hidden" name="endDate" value="${escapeHtml(trip.endDate || "")}">
            <div class="modal-head">
              <h2 id="trip-modal-title">${trip.id ? "Trip bearbeiten" : "Trip anlegen"}</h2>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <div class="form-grid trip-form-grid">
              <label>
                <span>Name</span>
                <input name="name" type="text" value="${escapeHtml(trip.name || "")}" required ${focus === "name" ? "autofocus" : ""}>
              </label>
              <label>
                <span>Von bis</span>
                <input class="trip-range-input" id="trip-date-range" type="text" value="${escapeHtml(rangeValue)}" placeholder="Zeitraum auswählen" autocomplete="off" required ${focus === "dates" ? "autofocus" : ""}>
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit">Speichern</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderPlanningTripModal(roomId) {
    const room = planningRoomById(roomId);
    if (!room) return "";
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="planning-trip-title">
          <form id="planning-trip-form">
            <input type="hidden" name="roomId" value="${escapeHtml(room.id)}">
            <div class="modal-head">
              <div>
                <h2 id="planning-trip-title">Zum Trip hinzufügen</h2>
                <p class="modal-subtitle">${escapeHtml(room.title)}</p>
              </div>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <label class="full-field">
              <span>Trip</span>
              <select name="tripId" required>
                ${[...data.trips].sort(sortTrips).map((trip) => `<option value="${escapeHtml(trip.id)}" ${selectedPlanningTripId() === trip.id ? "selected" : ""}>${escapeHtml(`${trip.name} · ${formatTripRange(trip)}`)}</option>`).join("")}
              </select>
            </label>
            <label class="full-field">
              <span>Datum (optional)</span>
              <input name="date" type="date">
            </label>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit">Details prüfen</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderWishTripModal(wishId) {
    const entry = data.wishList.find((item) => item.id === wishId);
    if (!entry) return "";
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="wish-trip-title">
          <form id="wish-trip-form">
            <input type="hidden" name="wishId" value="${escapeHtml(entry.id)}">
            <div class="modal-head">
              <div>
                <h2 id="wish-trip-title">Zum Trip hinzufügen</h2>
                <p class="modal-subtitle">${escapeHtml(entry.title)}</p>
              </div>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <label class="full-field">
              <span>Trip</span>
              <select name="tripId" required>
                ${[...data.trips].sort(sortTrips).map((trip) => `<option value="${escapeHtml(trip.id)}" ${selectedPlanningTripId() === trip.id ? "selected" : ""}>${escapeHtml(`${trip.name} · ${formatTripRange(trip)}`)}</option>`).join("")}
              </select>
            </label>
            <label class="full-field">
              <span>Datum (optional)</span>
              <input name="date" type="date">
            </label>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit">Details prüfen</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderPlanCandidateModal(sourceType, sourceId) {
    const candidate = tripPlanCandidateFromSource(sourceType, sourceId);
    if (!candidate) return "";
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="plan-candidate-title">
          <form id="plan-candidate-form">
            <input type="hidden" name="sourceType" value="${escapeHtml(sourceType)}">
            <input type="hidden" name="sourceId" value="${escapeHtml(sourceId)}">
            <div class="modal-head">
              <div>
                <h2 id="plan-candidate-title">In Tripplanung legen</h2>
                <p class="modal-subtitle">${escapeHtml(candidate.title)}</p>
              </div>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <label class="full-field">
              <span>Trip</span>
              <select name="tripId" required>
                ${[...data.trips].sort(sortTrips).map((trip) => `<option value="${escapeHtml(trip.id)}" ${selectedPlanningTripId() === trip.id ? "selected" : ""}>${escapeHtml(`${trip.name} · ${formatTripRange(trip)}`)}</option>`).join("")}
              </select>
            </label>
            <label class="full-field">
              <span>Tag (optional)</span>
              <input name="date" type="date">
            </label>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit">Planen</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderPlanningLinkModal(roomId) {
    const room = planningRoomById(roomId);
    if (!room) return "";
    const current = manualPlanningPlayedRoom(room) || findPlanningMatch(room, data.played);
    const options = [...data.played]
      .sort((a, b) => `${a.title} ${a.city}`.localeCompare(`${b.title} ${b.city}`, "de"))
      .map((played) => {
        const label = [played.title, played.provider, played.city].filter(Boolean).join(" · ");
        return `<option value="${escapeHtml(played.id)}" data-search="${escapeHtml(normalize(label))}" ${current?.id === played.id ? "selected" : ""}>${escapeHtml(label)}</option>`;
      })
      .join("");
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="planning-link-title">
          <form id="planning-link-form">
            <input type="hidden" name="roomId" value="${escapeHtml(room.id)}">
            <div class="modal-head">
              <div>
                <h2 id="planning-link-title">Gespielten Raum zuordnen</h2>
                <p class="modal-subtitle">${escapeHtml([room.title, room.provider, room.city || planningRegionLabel(room.region), germanCountry(room.country)].filter(Boolean).join(" · "))}</p>
              </div>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <label class="full-field">
              <span>Raum suchen</span>
              <input id="planning-link-search" type="search" placeholder="Titel, Anbieter oder Stadt" autocomplete="off">
            </label>
            <label class="full-field">
              <span>Gespielter Raum</span>
              <select id="planning-link-select" name="playedRoomId" size="8" required>
                ${options}
              </select>
              <small class="field-hint" data-planning-link-count>${data.played.length} Räume</small>
            </label>
            <div class="modal-actions">
              ${data.planningLinks?.[room.id] ? `<button type="button" data-remove-planning-link="${escapeHtml(room.id)}">Zuordnung lösen</button>` : ""}
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit">Zuordnen</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderTripItemModal(tripId, item = {}, imported = false, planItemId = "") {
    const trip = data.trips.find((entry) => entry.id === tripId);
    const type = Object.prototype.hasOwnProperty.call(TRIP_ITEM_LABELS, item.type) ? item.type : "escape";
    const defaultDate = item.date || trip?.startDate || "";
    const labels = tripItemLabels(type);
    const address = item.address || item.city || (type === "start" ? DEFAULT_TRIP_START_ADDRESS : "");
    const title = item.title || (type === "start" ? "Startadresse" : "");
    const modalTitle = tripItemModalTitle(type, Boolean(item.id || planItemId), imported);
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="trip-item-modal-title">
          <form id="trip-item-form">
            <input type="hidden" name="tripId" value="${escapeHtml(tripId)}">
            <input type="hidden" name="id" value="${escapeHtml(item.id || "")}">
            <input type="hidden" name="planItemId" value="${escapeHtml(planItemId)}">
            <input type="hidden" name="sourceName" value="${escapeHtml(item.sourceName || "")}">
            <input type="hidden" name="pricePerPerson" value="${escapeHtml(item.pricePerPerson ?? "")}">
            <input type="hidden" name="availableSlots" value="${escapeHtml(normalizeTimeSlots(item.availableSlots).join(", "))}">
            <div class="modal-head">
              <div>
                <h2 id="trip-item-modal-title">${escapeHtml(modalTitle)}</h2>
                ${imported ? `<p class="modal-subtitle">${escapeHtml(item.sourceName || "Import")}</p>` : ""}
              </div>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <div class="form-grid">
              <label>
                <span>Art</span>
                <select name="type" id="trip-item-type">
                  ${Object.entries(TRIP_ITEM_LABELS).map(([value, label]) => selectOption(value, label, type)).join("")}
                </select>
              </label>
              ${tripItemField("title", labels.title, title, "text", "title", true)}
              ${tripItemField("provider", labels.provider, item.provider, "text", "provider")}
              ${tripItemField("date", labels.date, defaultDate, "date", "date")}
              ${tripTimeField(labels.time, item.time, type === "accommodation")}
              ${tripItemField("endDate", labels.endDate, item.endDate, "date", "endDate", false, type === "escape")}
              ${tripDurationField(item.duration, type === "accommodation")}
              ${tripItemField("address", "Adresse", address, "text", "address")}
            </div>
            <label class="full-field">
              <span>Link</span>
              <input name="link" type="url" value="${escapeHtml(item.link || "")}" placeholder="https://">
            </label>
            <label class="full-field">
              <span>Notizen</span>
              <textarea name="notes" rows="3">${escapeHtml(item.notes || "")}</textarea>
            </label>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit">${imported ? "Übernehmen" : "Speichern"}</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderTripExpenseModal(tripId, expense = {}) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    if (!trip) return "";
    const participants = Array.isArray(expense.participants) && expense.participants.length
      ? expense.participants
      : [...data.members];
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="trip-expense-modal-title">
          <form id="trip-expense-form">
            <input type="hidden" name="tripId" value="${escapeHtml(tripId)}">
            <input type="hidden" name="id" value="${escapeHtml(expense.id || "")}">
            <input type="hidden" name="sourceType" value="${escapeHtml(expense.sourceType || "")}">
            <input type="hidden" name="sourceId" value="${escapeHtml(expense.sourceId || "")}">
            <div class="modal-head">
              <div>
                <h2 id="trip-expense-modal-title">${expense.id ? "Ausgabe bearbeiten" : "Ausgabe ergänzen"}</h2>
                <p class="modal-subtitle">${escapeHtml(trip.name || "Trip")}</p>
              </div>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <div class="form-grid">
              ${field("title", "Wofür?", expense.title, "text", true)}
              ${field("amount", "Betrag", expense.amount ?? "", "number", true, "0", "", "0.01")}
              <label>
                <span>Bezahlt von</span>
                <select name="payer">
                  ${data.members.map((member) => selectOption(member, member, expense.payer || data.members[0])).join("")}
                </select>
              </label>
              ${field("date", "Datum", expense.date || trip.startDate || "", "date")}
            </div>
            <fieldset class="segmented-field expense-members">
              <legend>Für wen?</legend>
              <div class="expense-member-grid">
                ${data.members.map((member) => `
                  <label class="expense-member">
                    <input type="checkbox" name="participants" value="${escapeHtml(member)}" ${participants.includes(member) ? "checked" : ""}>
                    <span>${escapeHtml(member)}</span>
                  </label>
                `).join("")}
              </div>
            </fieldset>
            <label class="full-field">
              <span>Notizen</span>
              <textarea name="notes" rows="3">${escapeHtml(expense.notes || "")}</textarea>
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

  function tripItemField(name, label, value, type, role, required = false, hidden = false) {
    return `
      <label data-trip-item-field="${escapeHtml(role)}" ${hidden ? "hidden" : ""}>
        <span data-trip-item-label>${escapeHtml(label)}</span>
        <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value || "")}" ${required ? "required" : ""} ${hidden ? "disabled" : ""}>
      </label>
    `;
  }

  function tripTimeField(label, value, hidden = false) {
    return `
      <label data-trip-item-field="time" ${hidden ? "hidden" : ""}>
        <span data-trip-item-label>${escapeHtml(label)}</span>
        <select name="time" ${hidden ? "disabled" : ""}>
          ${timeSlotOptions(value)}
        </select>
      </label>
    `;
  }

  function tripDurationField(value, hidden = false) {
    return `
      <label data-trip-item-field="duration" ${hidden ? "hidden" : ""}>
        <span data-trip-item-label>Dauer (Minuten)</span>
        <input name="duration" type="number" min="5" max="360" step="5" value="${escapeHtml(value || "")}" ${hidden ? "disabled" : ""}>
      </label>
    `;
  }

  function tripItemModalTitle(type, isExisting, imported) {
    if (imported) return "Buchungsdetails prüfen";
    if (!isExisting) return "Termin ergänzen";
    if (type === "escape") return "Details bearbeiten";
    if (type === "accommodation") return "Unterkunft bearbeiten";
    if (type === "start") return "Startadresse bearbeiten";
    return "Eintrag bearbeiten";
  }

  function tripItemLabels(type) {
    if (type === "start") {
      return {
        title: "Name",
        provider: "Anbieter",
        date: "Startdatum",
        time: "Uhrzeit",
        endDate: "Enddatum",
        duration: "Dauer (Minuten)",
      };
    }
    if (type === "accommodation") {
      return {
        title: "Unterkunft",
        provider: "Gastgeber",
        date: "Check-in",
        time: "Uhrzeit",
        endDate: "Check-out",
        duration: "Dauer (Minuten)",
      };
    }
    if (type === "other") {
      return {
        title: "Name",
        provider: "Anbieter",
        date: "Datum",
        time: "Uhrzeit",
        endDate: "Enddatum",
        duration: "Dauer (Minuten)",
      };
    }
    return {
      title: "Raum",
      provider: "Anbieter",
      date: "Datum",
      time: "Uhrzeit",
      endDate: "Enddatum",
      duration: "Dauer (Minuten)",
    };
  }

  function renderTripImportModal(tripId) {
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="trip-import-modal-title">
          <form id="trip-import-form">
            <input type="hidden" name="tripId" value="${escapeHtml(tripId)}">
            <div class="modal-head">
              <h2 id="trip-import-modal-title">Buchung importieren</h2>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <label class="import-file-field">
              <span>Dateien</span>
              <input id="trip-import-file" name="bookingFile" type="file" accept="image/*,.pdf,.eml,.txt,application/pdf,message/rfc822" multiple>
              <small data-import-file-name>PDF, mehrere Screenshots, E-Mail- oder Textdateien</small>
            </label>
            <label class="full-field">
              <span>E-Mail-Text</span>
              <textarea name="sourceText" rows="8" placeholder="Buchungsbestätigung hier einfügen"></textarea>
            </label>
            <div class="import-status" data-import-status hidden></div>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit" data-import-submit>Details erkennen</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderTripUrlImportModal(tripId) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    if (!trip) return "";
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="trip-url-import-title">
          <form id="trip-url-import-form">
            <input type="hidden" name="tripId" value="${escapeHtml(tripId)}">
            <div class="modal-head">
              <div>
                <h2 id="trip-url-import-title">Raum-Website importieren</h2>
                <p class="modal-subtitle">${escapeHtml(trip.name || "Tripplanung")}</p>
              </div>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <label class="full-field">
              <span>Website-URL</span>
              <input name="url" type="url" placeholder="https://" required>
            </label>
            <label class="full-field">
              <span>Seitentext optional</span>
              <textarea name="sourceText" rows="8" placeholder="Nur falls der automatische Import scheitert: Text der Raumseite hier einfügen."></textarea>
            </label>
            <div class="import-status" data-url-import-status hidden></div>
            <div class="modal-actions">
              <button type="button" data-close-modal>Abbrechen</button>
              <button class="primary-action" type="submit" data-url-import-submit>Importieren</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderTripShareModal() {
    const trips = [...data.trips].sort(sortTrips);
    const selectedTripId = trips.some((trip) => trip.id === ui.activeTripId)
      ? ui.activeTripId
      : trips[0]?.id || "";
    const files = Array.isArray(pendingShare?.files) ? pendingShare.files : [];
    const sharedText = [pendingShare?.title, pendingShare?.text, pendingShare?.url]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join("\n");
    const preview = sharedText.length > 600 ? `${sharedText.slice(0, 600)} ...` : sharedText;

    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="trip-share-modal-title">
          <form id="trip-share-form">
            <div class="modal-head">
              <div>
                <h2 id="trip-share-modal-title">Geteilte Buchung</h2>
                <p class="modal-subtitle">Aus deiner E-Mail-App</p>
              </div>
              <button type="button" class="icon-button" data-close-modal aria-label="Schließen">x</button>
            </div>
            <div class="share-booking-preview">
              ${files.length ? `
                <div class="share-file-list">
                  ${files.map((file) => `<span>${escapeHtml(file.name || "Geteilte Datei")}</span>`).join("")}
                </div>
              ` : ""}
              ${preview ? `<p>${escapeHtml(preview)}</p>` : ""}
              ${!files.length && !preview ? `<p>Der geteilte Inhalt ist leer.</p>` : ""}
            </div>
            ${trips.length ? `
              <label>
                <span>Trip</span>
                <select name="tripId" required>
                  ${trips.map((trip) => selectOption(trip.id, `${trip.name} · ${formatTripRange(trip)}`, selectedTripId)).join("")}
                </select>
              </label>
            ` : renderEmptyState("Lege zuerst den Trip für diese Buchung an.")}
            <div class="import-status" data-share-import-status hidden></div>
            <div class="modal-actions">
              <button type="button" data-close-modal>Später</button>
              ${trips.length
                ? `<button class="primary-action" type="submit" data-share-import-submit>Details erkennen</button>`
                : `<button class="primary-action" type="button" data-create-trip-for-share>Trip anlegen</button>`}
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

    const tripSearch = app.querySelector("#trip-search");
    if (tripSearch) tripSearch.addEventListener("input", (event) => {
      ui.tripSearch = event.target.value;
      render();
    });

    const planningSource = app.querySelector("#planning-source");
    if (planningSource) planningSource.addEventListener("change", (event) => {
      ui.planningSource = event.target.value;
      ui.planningRegion = "all";
      render();
    });

    const planningRegion = app.querySelector("#planning-region");
    if (planningRegion) planningRegion.addEventListener("change", (event) => {
      ui.planningRegion = event.target.value;
      render();
    });

    const planningStatus = app.querySelector("#planning-status");
    if (planningStatus) planningStatus.addEventListener("change", (event) => {
      ui.planningStatus = event.target.value;
      render();
    });

    const planningSearch = app.querySelector("#planning-search");
    if (planningSearch) planningSearch.addEventListener("input", (event) => {
      ui.planningSearch = event.target.value;
      render();
    });

    bindPlanningActions(app);

    const mapSource = app.querySelector("#map-source");
    if (mapSource) mapSource.addEventListener("change", (event) => {
      ui.mapSource = event.target.value;
      ui.mapRegion = "all";
      render();
    });

    const mapRegion = app.querySelector("#map-region");
    if (mapRegion) mapRegion.addEventListener("change", (event) => {
      ui.mapRegion = event.target.value;
      render();
    });

    const mapPlanningStatus = app.querySelector("#map-planning-status");
    if (mapPlanningStatus) mapPlanningStatus.addEventListener("change", (event) => {
      ui.mapPlanningStatus = event.target.value;
      render();
    });

    const mapSearch = app.querySelector("#map-search");
    if (mapSearch) mapSearch.addEventListener("input", (event) => {
      ui.mapSearch = event.target.value;
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

    const tripButton = app.querySelector("[data-open-trip]");
    if (tripButton) tripButton.addEventListener("click", () => {
      ui.modal = { type: "trip", trip: {} };
      render();
    });

    app.querySelectorAll("[data-open-shared-booking]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "tripShare" };
        render();
      });
    });

    const createTripForShare = app.querySelector("[data-create-trip-for-share]");
    if (createTripForShare) createTripForShare.addEventListener("click", () => {
      ui.modal = { type: "trip", trip: {}, fromShare: true };
      render();
    });

    app.querySelectorAll("[data-open-trip-detail]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.activeTripId = button.dataset.openTripDetail;
        render();
      });
    });

    app.querySelectorAll("[data-close-trip-detail]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.activeTripId = "";
        render();
      });
    });

    app.querySelectorAll("[data-edit-trip]").forEach((button) => {
      button.addEventListener("click", () => {
        const trip = data.trips.find((entry) => entry.id === button.dataset.editTrip);
        if (!trip) return;
        ui.modal = { type: "trip", trip: clone(trip) };
        render();
      });
    });

    app.querySelectorAll("[data-edit-trip-name], [data-edit-trip-dates]").forEach((button) => {
      button.addEventListener("click", () => {
        const tripId = button.dataset.editTripName || button.dataset.editTripDates;
        const trip = data.trips.find((entry) => entry.id === tripId);
        if (!trip) return;
        ui.modal = {
          type: "trip",
          trip: clone(trip),
          focus: button.dataset.editTripName ? "name" : "dates",
        };
        render();
      });
    });

    app.querySelectorAll("[data-toggle-trip-planning]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleTripPlanningFinalized(button.dataset.toggleTripPlanning);
      });
    });

    app.querySelectorAll("[data-delete-trip]").forEach((button) => {
      button.addEventListener("click", () => {
        const trip = data.trips.find((entry) => entry.id === button.dataset.deleteTrip);
        if (!trip || !confirm(`Trip "${trip.name}" mit allen Terminen entfernen?`)) return;
        data.trips = data.trips.filter((entry) => entry.id !== trip.id);
        if (ui.activeTripId === trip.id) ui.activeTripId = "";
        saveData();
        setNotice("Trip entfernt.");
      });
    });

    app.querySelectorAll("[data-open-trip-item]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "tripItem", tripId: button.dataset.openTripItem, item: { type: "escape" } };
        render();
      });
    });

    app.querySelectorAll("[data-open-trip-expense]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "tripExpense", tripId: button.dataset.openTripExpense, expense: {} };
        render();
      });
    });

    app.querySelectorAll("[data-open-trip-expenses]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "tripExpensesList", tripId: button.dataset.openTripExpenses };
        render();
      });
    });

    app.querySelectorAll("[data-import-trip-item]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "tripImport", tripId: button.dataset.importTripItem };
        render();
      });
    });

    app.querySelectorAll("[data-import-room-url]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "tripUrlImport", tripId: button.dataset.importRoomUrl };
        render();
      });
    });

    app.querySelectorAll("[data-edit-trip-item]").forEach((button) => {
      button.addEventListener("click", () => {
        const trip = data.trips.find((entry) => entry.id === button.dataset.tripId);
        const item = trip?.items.find((entry) => entry.id === button.dataset.editTripItem);
        if (!item) return;
        ui.modal = { type: "tripItem", tripId: trip.id, item: clone(item) };
        render();
      });
    });

    app.querySelectorAll("[data-delete-trip-item]").forEach((button) => {
      button.addEventListener("click", () => {
        const trip = data.trips.find((entry) => entry.id === button.dataset.tripId);
        const item = trip?.items.find((entry) => entry.id === button.dataset.deleteTripItem);
        if (!trip || !item || !confirm(`"${item.title}" aus dem Trip entfernen?`)) return;
        trip.items = trip.items.filter((entry) => entry.id !== item.id);
        saveData();
        setNotice("Termin entfernt.");
      });
    });

    app.querySelectorAll("[data-edit-trip-expense]").forEach((button) => {
      button.addEventListener("click", () => {
        const trip = data.trips.find((entry) => entry.id === button.dataset.tripId);
        const expense = trip?.expenses?.find((entry) => entry.id === button.dataset.editTripExpense);
        if (!expense) return;
        ui.modal = { type: "tripExpense", tripId: trip.id, expense: clone(expense) };
        render();
      });
    });

    app.querySelectorAll("[data-delete-trip-expense]").forEach((button) => {
      button.addEventListener("click", () => {
        const trip = data.trips.find((entry) => entry.id === button.dataset.tripId);
        const expense = trip?.expenses?.find((entry) => entry.id === button.dataset.deleteTripExpense);
        if (!trip || !expense || !confirm(`Ausgabe "${expense.title}" entfernen?`)) return;
        trip.expenses = (trip.expenses || []).filter((entry) => entry.id !== expense.id);
        saveData();
        setNotice("Ausgabe entfernt.");
      });
    });

    app.querySelectorAll("[data-complete-trip-item]").forEach((button) => {
      button.addEventListener("click", () => {
        const trip = data.trips.find((entry) => entry.id === button.dataset.tripId);
        const item = trip?.items.find((entry) => entry.id === button.dataset.completeTripItem);
        if (!trip || !item) return;

        const playedRoom = findMatchingPlayedRoom(item);
        const wish = findMatchingWish(item);
        if (playedRoom) {
          item.playedRoomId = playedRoom.id;
          saveData();
          ui.modal = { type: "room", room: clone(playedRoom) };
          render();
          return;
        }

        ui.modal = {
          type: "room",
          tripId: trip.id,
          tripItemId: item.id,
          wishId: wish?.id || "",
          room: {
            title: item.title,
            provider: item.provider || wish?.provider || "",
            city: wish?.city || extractCityFromAddress(item.address),
            date: item.date,
            scare: null,
            difficulty: null,
            ratings: {},
            notes: item.notes,
            tags: [],
          },
        };
        render();
      });
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

    bindPlanSourceActions(app);
    bindBulkPlanControls(app);

    app.querySelectorAll("[data-trip-plan-field]").forEach((field) => {
      field.addEventListener("change", () => {
        updateTripPlanField(field.dataset.tripId, field.dataset.planId, field.dataset.tripPlanField, field.value);
      });
    });

    app.querySelectorAll("[data-plan-drag]").forEach((card) => {
      card.addEventListener("dragstart", (event) => {
        card.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", `${card.dataset.tripId}|${card.dataset.planDrag}`);
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
      });
    });

    app.querySelectorAll("[data-plan-drop-date]").forEach((zone) => {
      zone.addEventListener("dragover", (event) => {
        event.preventDefault();
        zone.classList.add("is-drop-target");
      });
      zone.addEventListener("dragleave", () => {
        zone.classList.remove("is-drop-target");
      });
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.classList.remove("is-drop-target");
        const [tripId, planItemId] = clean(event.dataTransfer.getData("text/plain")).split("|");
        if (!tripId || !planItemId || tripId !== zone.dataset.tripId) return;
        updateTripPlanField(tripId, planItemId, "date", zone.dataset.planDropDate || "");
      });
    });

    app.querySelectorAll("[data-plan-to-trip]").forEach((button) => {
      button.addEventListener("click", () => {
        openTripPlanItemForScheduling(button.dataset.tripId, button.dataset.planToTrip);
      });
    });

    app.querySelectorAll("[data-delete-plan-item]").forEach((button) => {
      button.addEventListener("click", () => {
        deleteTripPlanItem(button.dataset.tripId, button.dataset.deletePlanItem);
      });
    });

    app.querySelectorAll("[data-pay-plan-item]").forEach((button) => {
      button.addEventListener("click", () => {
        openExpenseForPlanItem(button.dataset.tripId, button.dataset.payPlanItem);
      });
    });

    app.querySelectorAll("[data-pay-trip-item]").forEach((button) => {
      button.addEventListener("click", () => {
        openExpenseForTripItem(button.dataset.tripId, button.dataset.payTripItem);
      });
    });

    app.querySelectorAll("[data-settlement-paid]").forEach((button) => {
      button.addEventListener("click", () => {
        markSettlementPaid(button.dataset.tripId, button.dataset.from, button.dataset.to, numberOrNull(button.dataset.amount));
      });
    });

    app.querySelectorAll("[data-trip-slot]").forEach((button) => {
      button.addEventListener("click", () => {
        updateTripPlanField(button.dataset.tripId, button.dataset.planId, "time", button.dataset.tripSlot);
      });
    });

    app.querySelectorAll("[data-close-modal]").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target !== element && !element.matches("button")) return;
        ui.modal = ui.modal?.type === "tripItem" && ui.modal.fromShare
          ? { type: "tripShare" }
          : null;
        render();
      });
    });

    app.querySelectorAll("[data-close-celebration]").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target !== element && !element.matches("button")) return;
        ui.celebrations = [];
        render();
      });
    });

    const roomForm = app.querySelector("#room-form");
    if (roomForm) roomForm.addEventListener("submit", saveRoomFromForm);

    const planningLinkForm = app.querySelector("#planning-link-form");
    if (planningLinkForm) planningLinkForm.addEventListener("submit", savePlanningLinkFromForm);

    const planningLinkSearch = app.querySelector("#planning-link-search");
    if (planningLinkSearch) {
      const select = app.querySelector("#planning-link-select");
      const count = app.querySelector("[data-planning-link-count]");
      const filterOptions = () => {
        const query = normalize(planningLinkSearch.value);
        const options = [...select.options];
        let visible = 0;
        let firstValue = "";
        options.forEach((option) => {
          const matches = !query || option.dataset.search.includes(query);
          option.hidden = !matches;
          option.disabled = !matches;
          if (matches) {
            visible += 1;
            if (!firstValue) firstValue = option.value;
          }
        });
        const selectedOption = options.find((option) => option.value === select.value);
        if (!selectedOption || selectedOption.disabled) select.value = firstValue;
        if (!visible) select.selectedIndex = -1;
        if (count) count.textContent = visible === 1 ? "1 Treffer" : `${visible} Treffer`;
      };
      planningLinkSearch.addEventListener("input", filterOptions);
      filterOptions();
    }

    const removePlanningLinkButton = app.querySelector("[data-remove-planning-link]");
    if (removePlanningLinkButton) removePlanningLinkButton.addEventListener("click", () => {
      removePlanningLink(removePlanningLinkButton.dataset.removePlanningLink);
    });

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

    const planningTripForm = app.querySelector("#planning-trip-form");
    if (planningTripForm) planningTripForm.addEventListener("submit", openPlanningRoomForTrip);

    const wishTripForm = app.querySelector("#wish-trip-form");
    if (wishTripForm) wishTripForm.addEventListener("submit", openWishRoomForTrip);

    const planCandidateForm = app.querySelector("#plan-candidate-form");
    if (planCandidateForm) planCandidateForm.addEventListener("submit", savePlanCandidateFromForm);

    const tripForm = app.querySelector("#trip-form");
    if (tripForm) {
      initTripDateRangePicker(tripForm);
      tripForm.addEventListener("submit", saveTripFromForm);
    }

    const tripItemForm = app.querySelector("#trip-item-form");
    if (tripItemForm) {
      updateTripItemFields(tripItemForm);
      tripItemForm.querySelector("#trip-item-type")?.addEventListener("change", () => updateTripItemFields(tripItemForm));
      tripItemForm.addEventListener("submit", saveTripItemFromForm);
    }

    const tripExpenseForm = app.querySelector("#trip-expense-form");
    if (tripExpenseForm) tripExpenseForm.addEventListener("submit", saveTripExpenseFromForm);

    const tripImportFile = app.querySelector("#trip-import-file");
    if (tripImportFile) tripImportFile.addEventListener("change", () => {
      const label = app.querySelector("[data-import-file-name]");
      const files = [...tripImportFile.files];
      if (label) label.textContent = files.length > 1
        ? `${files.length} Dateien ausgewählt`
        : files[0]?.name || "PDF, mehrere Screenshots, E-Mail- oder Textdateien";
    });

    const tripImportForm = app.querySelector("#trip-import-form");
    if (tripImportForm) tripImportForm.addEventListener("submit", (event) => {
      void importTripBooking(event);
    });

    const tripUrlImportForm = app.querySelector("#trip-url-import-form");
    if (tripUrlImportForm) tripUrlImportForm.addEventListener("submit", (event) => {
      void importRoomWebsite(event);
    });

    const tripShareForm = app.querySelector("#trip-share-form");
    if (tripShareForm && data.trips.length) tripShareForm.addEventListener("submit", (event) => {
      void importSharedBooking(event);
    });

    if (ui.view === "map") window.requestAnimationFrame(renderMap);
  }

  function bindPlanSourceActions(root) {
    root.querySelectorAll("[data-wish-trip]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "wishTrip", wishId: button.dataset.wishTrip };
        render();
      });
    });

    root.querySelectorAll("[data-plan-wish]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "planCandidate", sourceType: "upnext", sourceId: button.dataset.planWish };
        render();
      });
    });

    root.querySelectorAll("[data-bulk-plan-checkbox]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const key = bulkPlanKey(checkbox.dataset.bulkPlanSource, checkbox.dataset.bulkPlanId);
        ui.bulkPlanSelection = checkbox.checked
          ? unique([...ui.bulkPlanSelection, key])
          : ui.bulkPlanSelection.filter((entry) => entry !== key);
        renderPreservingScroll();
      });
    });
  }

  function bindBulkPlanControls(root) {
    root.querySelectorAll("[data-toggle-bulk-plan]").forEach((button) => {
      button.addEventListener("click", () => {
        const context = button.dataset.toggleBulkPlan;
        const active = bulkPlanningActive(context);
        ui.bulkPlanMode = !active;
        ui.bulkPlanContext = active ? "" : context;
        ui.bulkPlanSelection = [];
        ui.planTargetTripId = selectedPlanningTripId();
        renderPreservingScroll();
      });
    });

    root.querySelectorAll("[data-bulk-plan-trip]").forEach((select) => {
      select.addEventListener("change", () => {
        ui.planTargetTripId = select.value;
      });
    });

    root.querySelectorAll("[data-bulk-plan-add]").forEach((button) => {
      button.addEventListener("click", () => {
        addBulkPlanSelection();
      });
    });
  }

  function initTripDateRangePicker(form) {
    const input = form.querySelector("#trip-date-range");
    const startInput = form.elements.startDate;
    const endInput = form.elements.endDate;
    if (!input || !window.flatpickr) return;

    const defaultDates = [startInput.value, endInput.value]
      .filter(Boolean)
      .map((value) => new Date(`${value}T00:00:00`));
    const locale = {
      ...(window.flatpickr.l10ns.de || {}),
      rangeSeparator: " bis ",
    };

    window.flatpickr(input, {
      mode: "range",
      locale,
      dateFormat: "j. F Y",
      defaultDate: defaultDates,
      disableMobile: true,
      showMonths: window.innerWidth >= 760 ? 2 : 1,
      monthSelectorType: "static",
      onChange(selectedDates) {
        startInput.value = selectedDates[0] ? localIsoDate(selectedDates[0]) : "";
        endInput.value = selectedDates[1] ? localIsoDate(selectedDates[1]) : "";
        input.setCustomValidity("");
      },
    });
  }

  function localIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function updateTripItemFields(form) {
    const type = form.elements.type.value;
    const labels = tripItemLabels(type);
    const visibility = {
      title: true,
      provider: type !== "start",
      date: true,
      time: type !== "accommodation" && type !== "start",
      endDate: type === "accommodation" || type === "other",
      duration: type !== "accommodation" && type !== "start",
      address: true,
    };

    if (type === "start") {
      const titleInput = form.elements.title;
      const addressInput = form.elements.address;
      const dateInput = form.elements.date;
      const trip = data.trips.find((entry) => entry.id === clean(form.elements.tripId?.value));
      if (titleInput && !clean(titleInput.value)) titleInput.value = "Startadresse";
      if (addressInput && !clean(addressInput.value)) addressInput.value = DEFAULT_TRIP_START_ADDRESS;
      if (dateInput && !clean(dateInput.value) && trip?.startDate) dateInput.value = trip.startDate;
    }

    Object.entries(visibility).forEach(([role, visible]) => {
      const fieldElement = form.querySelector(`[data-trip-item-field="${role}"]`);
      if (!fieldElement) return;
      fieldElement.hidden = !visible;
      const input = fieldElement.querySelector("input, select");
      if (input) input.disabled = !visible;
      const label = fieldElement.querySelector("[data-trip-item-label]");
      if (label && labels[role]) label.textContent = labels[role];
    });
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
    const countsBeforeSave = playedCountsByMember();
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

    const trip = data.trips.find((entry) => entry.id === clean(form.get("tripId")));
    const tripItem = trip?.items.find((entry) => entry.id === clean(form.get("tripItemId")));
    if (tripItem) tripItem.playedRoomId = room.id;

    ui.modal = null;
    ui.celebrations = roomMilestoneCelebrations(countsBeforeSave, playedCountsByMember());
    saveData();
    void geocodeCity(city);
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
      pricePerPerson: numberOrNull(form.get("pricePerPerson")),
      availableSlots: [],
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

  function bindPlanningActions(root) {
    root.querySelectorAll("[data-planning-upnext]").forEach((button) => {
      button.addEventListener("click", () => addPlanningRoomToWish(button.dataset.planningUpnext));
    });
    root.querySelectorAll("[data-planning-link]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "planningLink", roomId: button.dataset.planningLink };
        render();
      });
    });
    root.querySelectorAll("[data-planning-trip]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "planningTrip", roomId: button.dataset.planningTrip };
        render();
      });
    });
    root.querySelectorAll("[data-plan-planning]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.modal = { type: "planCandidate", sourceType: "planning", sourceId: button.dataset.planPlanning };
        render();
      });
    });
  }

  function addPlanningRoomToWish(roomId) {
    const room = planningRoomById(roomId);
    if (!room || findPlanningMatch(room, data.wishList) || findPlanningMatch(room, data.played)) return;
    const sourceLabel = planningRoomSourceLabel(room);
    data.wishList = [{
      id: makeId("wish"),
      title: room.title,
      provider: room.provider,
      country: germanCountry(room.country),
      city: room.city || room.region,
      link: room.website || room.detailUrl || planningRoomSearchUrl(room),
      pricePerPerson: numberOrNull(room.pricePerPerson) ?? priceFromText(room.notes),
      notes: `${sourceLabel} · Platz ${room.rank}${room.duration ? ` · ${room.duration} Min.` : ""}${typeof room.scare === "number" ? ` · Horror ${formatScore(room.scare)}/${room.scareScale || 5}` : ""}`,
      status: "interessant",
      priority: "normal",
    }, ...data.wishList];
    saveData();
    setNotice(`${room.title} wurde zu Up Next hinzugefügt.`);
  }

  function savePlanningLinkFromForm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const room = planningRoomById(clean(form.get("roomId")));
    const playedRoom = data.played.find((entry) => entry.id === clean(form.get("playedRoomId")));
    if (!room || !playedRoom) return;
    data.planningLinks = { ...(data.planningLinks || {}), [room.id]: playedRoom.id };
    ui.modal = null;
    saveData();
    setNotice(`${room.title} ist jetzt mit ${playedRoom.title} verknüpft.`);
  }

  function removePlanningLink(roomId) {
    const room = planningRoomById(roomId);
    if (!room || !data.planningLinks?.[room.id]) return;
    data.planningLinks = { ...data.planningLinks };
    delete data.planningLinks[room.id];
    ui.modal = null;
    saveData();
    setNotice("Zuordnung gelöst.");
  }

  function tripPlanCandidateFromSource(sourceType, sourceId) {
    if (sourceType === "upnext") {
      const wish = data.wishList.find((entry) => entry.id === sourceId);
      if (!wish) return null;
      const planningMatch = planningRoomForEntry(wish);
      const duration = durationForWish(wish) || planningMatch?.duration || null;
      return normalizeTripPlanItem({
        sourceType: "upnext",
        sourceId: wish.id,
        title: wish.title,
        provider: wish.provider,
        country: wish.country,
        city: wish.city,
        address: [wish.city, wish.country].filter(Boolean).join(", "),
        duration,
        pricePerPerson: numberOrNull(wish.pricePerPerson) ?? priceFromText(wish.notes),
        availableSlots: normalizeTimeSlots(wish.availableSlots),
        link: wish.link,
        notes: wish.notes,
        coords: planningMatch?.coords || null,
      });
    }

    if (sourceType === "planning") {
      const room = planningRoomById(sourceId);
      if (!room) return null;
      const sourceLabel = planningRoomSourceLabel(room);
      return normalizeTripPlanItem({
        sourceType: room.source || "planning",
        sourceId: room.id,
        title: room.title,
        provider: room.provider,
        country: germanCountry(room.country),
        city: room.city || room.region,
        address: [room.city || room.region, germanCountry(room.country)].filter(Boolean).join(", "),
        duration: room.duration,
        pricePerPerson: numberOrNull(room.pricePerPerson) ?? priceFromText(room.notes),
        availableSlots: normalizeTimeSlots(room.availableSlots),
        link: room.website || room.detailUrl || planningRoomSearchUrl(room),
        notes: `${sourceLabel} · Platz ${room.rank}${typeof room.scare === "number" ? ` · Horror ${formatScore(room.scare)}/${room.scareScale || 5}` : ""}`,
        coords: room.coords,
      });
    }

    return null;
  }

  function planningRoomForEntry(entry) {
    return [...planningData.terpeca, ...planningData.escaperoomers]
      .map((room) => ({ room, match: findPlanningMatch(room, [entry]) }))
      .filter((candidate) => candidate.match)
      .sort((a, b) => sourceOrder(a.room.source) - sourceOrder(b.room.source) || a.room.rank - b.room.rank)[0]?.room || null;
  }

  function sourceOrder(source) {
    return source === "terpeca" ? 0 : 1;
  }

  function durationForWish(wish) {
    return durationFromText([wish.notes, wish.title].filter(Boolean).join(" "));
  }

  function durationFromText(value) {
    const text = clean(value);
    const candidates = [];
    const addCandidate = (duration, score) => {
      if (duration >= 15 && duration <= 180) candidates.push({ duration, score });
    };

    const minutePatterns = [
      { pattern: /(?:dauer|duration|spieldauer|spielzeit|game length|running time|time required|wie lange dauert es)\s*[:#-]?\s*(?:maximal\s*)?(?:ca\.\s*)?(\d{2,3})(?:\s*[-–]\s*(\d{2,3}))?\s*(?:min|mins?|minutes?|minuten)\b/gi, score: 130 },
      { pattern: /\b(?:\d+\s*(?:bis|to|-)\s*\d+\s*(?:spieler|players|personen|persons)|details)\b[^\n.]{0,80}\b(\d{2,3})(?:\s*[-–]\s*(\d{2,3}))?\s*(?:min|mins?|minutes?|minuten)\b/gi, score: 128 },
      { pattern: /\b(\d{2,3})(?:\s*[-–]\s*(\d{2,3}))?\s*(?:min|mins?|minutes?|minuten)\b[^\n.]{0,80}(?:difficulty|schwierigkeit|players|spieler|personen|details|mission)\b/gi, score: 124 },
      { pattern: /\b(\d{2,3})(?:\s*[-–]\s*(\d{2,3}))?\s*(?:min|mins?|minutes?|minuten)\b[^\n.]{0,80}(?:duration|dauer|spieldauer|spielzeit|game length|running time)\b/gi, score: 126 },
      { pattern: /\b(?:maximal\s*)?(\d{2,3})(?:\s*[-–]\s*(\d{2,3}))?\s*(?:min|mins?|minutes?|minuten)\b[^\n.]{0,80}(?:flucht|escape room|raum|spiel|standardvariante|team|gebucht)/gi, score: 110 },
      { pattern: /(?:flucht|escape room|raum|spiel|standardvariante|team|gebucht)[^\n.]{0,80}\b(?:maximal\s*)?(\d{2,3})(?:\s*[-–]\s*(\d{2,3}))?\s*(?:min|mins?|minutes?|minuten)\b/gi, score: 105 },
      { pattern: /\b(\d{2,3})(?:\s*[-–]\s*(\d{2,3}))?\s*[- ]?minute\s+(?:escape|room|game|spiel|experience|adventure)\b/gi, score: 95 },
    ];

    minutePatterns.forEach(({ pattern, score }) => {
      for (const match of text.matchAll(pattern)) {
        const first = Number(match[1]);
        const second = Number(match[2] || 0);
        addCandidate(second || first, score);
      }
    });

    const hourPatterns = [
      { pattern: /(?:dauer|duration|spieldauer|spielzeit|game length|running time|time required)\s*[:#-]?\s*(?:ca\.\s*)?(\d+(?:[,.]\d+)?)\s*(?:Std\.?|Stunden|hour|hours|heure|heures)/gi, score: 95 },
      { pattern: /(?:dauer|duration|spieldauer|spielzeit|game length|running time|time required)\s*[:#-]?\s*(\d+)\s*(?:h|std\.?|stunden|hour|hours|heure|heures)\s*(\d{1,2})?\s*(?:min|mins?|minutes?|minuten)?/gi, score: 90 },
    ];

    hourPatterns.forEach(({ pattern, score }) => {
      for (const match of text.matchAll(pattern)) {
        const hours = Number(String(match[1]).replace(",", "."));
        const minutes = Number(match[2] || 0);
        addCandidate(Math.round(hours * 60 + minutes), score);
      }
    });

    return candidates
      .sort((a, b) => b.score - a.score || durationPreferenceScore(b.duration) - durationPreferenceScore(a.duration))[0]?.duration || null;
  }

  function durationPreferenceScore(duration) {
    if (duration === 60) return 8;
    if (duration === 90) return 7;
    if (duration === 75) return 6;
    if (duration === 80) return 5;
    if (duration === 120) return 3;
    return 0;
  }

  function savePlanCandidateFromForm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const trip = data.trips.find((entry) => entry.id === clean(form.get("tripId")));
    const candidate = tripPlanCandidateFromSource(clean(form.get("sourceType")), clean(form.get("sourceId")));
    if (!trip || !candidate) return;
    ui.planTargetTripId = trip.id;
    const result = addTripPlanCandidate(trip, candidate, clean(form.get("date")));
    if (result === "duplicate") {
      alert("Raum bereits in der Planung enthalten");
      return;
    }
    ui.modal = null;
    saveData();
    setNotice("Raum zur Planung hinzugefügt.");
  }

  function addTripPlanCandidate(trip, candidate, date = "") {
    if (findTripPlanDuplicate(trip, candidate)) return "duplicate";
    const planItem = normalizeTripPlanItem({
      ...candidate,
      date: clean(date) || candidate.date,
    });
    trip.planItems = [planItem, ...(trip.planItems || [])];
    return "added";
  }

  function addBulkPlanSelection() {
    const trip = data.trips.find((entry) => entry.id === selectedPlanningTripId());
    if (!trip) return;
    if (!ui.bulkPlanSelection.length) {
      setNotice("Bitte mindestens einen Raum auswählen.");
      return;
    }

    let added = 0;
    let duplicates = 0;
    ui.bulkPlanSelection.forEach((key) => {
      const [sourceType, sourceId] = key.split(":");
      const candidate = tripPlanCandidateFromSource(sourceType, sourceId);
      if (!candidate) return;
      const result = addTripPlanCandidate(trip, candidate);
      if (result === "duplicate") duplicates += 1;
      if (result === "added") added += 1;
    });

    ui.planTargetTripId = trip.id;
    ui.bulkPlanSelection = [];
    if (added) saveData();
    if (duplicates) alert("Raum bereits in der Planung enthalten");
    if (added) {
      setNotice(`${added} ${added === 1 ? "Raum wurde" : "Räume wurden"} zur Planung hinzugefügt.`);
    } else if (!duplicates) {
      setNotice("Keine passenden Räume ausgewählt.");
    }
    render();
  }

  function findTripPlanDuplicate(trip, candidate) {
    return (trip.planItems || []).find((item) =>
      (candidate.sourceId && item.sourceId === candidate.sourceId)
      || (normalize(item.title) === normalize(candidate.title) && normalize(item.provider) === normalize(candidate.provider)));
  }

  function updateTripPlanField(tripId, planItemId, field, value) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    const item = trip?.planItems.find((entry) => entry.id === planItemId);
    if (!trip || !item) return;
    if (field === "duration") item.duration = numberOrNull(value);
    else if (field === "time") item.time = roundToQuarterHour(value);
    else {
      item[field] = clean(value);
      if (field === "date" && !item[field]) item.time = "";
    }
    saveData();
    renderPreservingScroll();
  }

  function toggleTripPlanningFinalized(tripId) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    if (!trip) return;
    const closing = !trip.planningFinalized;
    let notice = closing ? "Planung abgeschlossen." : "Trip wieder bearbeitbar.";
    if (closing) {
      const analysis = tripPlanAnalysis(trip);
      const warningCount = [...analysis.warningsById.values()].reduce((sum, warnings) => sum + warnings.length, 0);
      const openCount = (trip.planItems || []).filter((item) => !item.date).length;
      const hints = [
        openCount ? `${openCount} noch offen` : "",
        warningCount ? `${warningCount} Hinweis${warningCount === 1 ? "" : "e"}` : "",
      ].filter(Boolean);
      if (hints.length) notice = `Planung abgeschlossen. Hinweis: ${hints.join(", ")}.`;
    }
    trip.planningFinalized = closing;
    saveData();
    setNotice(notice);
  }

  function openTripPlanItemForScheduling(tripId, planItemId) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    const item = trip?.planItems.find((entry) => entry.id === planItemId);
    if (!trip || !item) return;
    const tripItem = item.tripItemId ? trip.items.find((entry) => entry.id === item.tripItemId) : null;
    ui.modal = {
      type: "tripItem",
      tripId: trip.id,
      planItemId: item.id,
      item: {
        ...(tripItem || {}),
        type: tripItem?.type || "escape",
        title: tripItem?.title || item.title,
        provider: tripItem?.provider || item.provider,
        date: Object.prototype.hasOwnProperty.call(item, "date") ? item.date : tripItem?.date,
        time: Object.prototype.hasOwnProperty.call(item, "time") ? item.time : tripItem?.time,
        duration: Object.prototype.hasOwnProperty.call(item, "duration") ? item.duration : tripItem?.duration,
        address: item.address || tripItem?.address || [item.city, item.country].filter(Boolean).join(", "),
        link: tripItem?.link || item.link,
        notes: tripItem?.notes || item.notes,
        sourceName: tripItem?.sourceName || "Tripplanung",
      },
    };
    render();
  }

  function deleteTripPlanItem(tripId, planItemId) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    if (!trip || !trip.planItems?.some((item) => item.id === planItemId)) return;
    if (!confirm("Kandidat aus der Tripplanung entfernen?")) return;
    trip.planItems = trip.planItems.filter((item) => item.id !== planItemId);
    saveData();
    setNotice("Kandidat entfernt.");
  }

  function openExpenseForPlanItem(tripId, planItemId) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    const item = trip?.planItems?.find((entry) => entry.id === planItemId);
    if (!trip || !item) return;
    ui.modal = {
      type: "tripExpense",
      tripId,
      expense: {
        title: item.title,
        amount: item.pricePerPerson ? Math.round(item.pricePerPerson * data.members.length * 100) / 100 : "",
        date: item.date || trip.startDate,
        participants: [...data.members],
        notes: [item.provider, item.link].filter(Boolean).join(" · "),
        sourceType: "trip-plan",
        sourceId: item.id,
      },
    };
    render();
  }

  function openExpenseForTripItem(tripId, itemId) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    const item = trip?.items?.find((entry) => entry.id === itemId);
    if (!trip || !item) return;
    ui.modal = {
      type: "tripExpense",
      tripId,
      expense: {
        title: item.title,
        amount: item.pricePerPerson ? Math.round(item.pricePerPerson * data.members.length * 100) / 100 : "",
        date: item.date || trip.startDate,
        participants: [...data.members],
        notes: [TRIP_ITEM_LABELS[item.type], item.provider, item.address].filter(Boolean).join(" · "),
        sourceType: "trip-item",
        sourceId: item.id,
      },
    };
    render();
  }

  function markSettlementPaid(tripId, from, to, amount) {
    const trip = data.trips.find((entry) => entry.id === tripId);
    if (!trip || !from || !to || !amount) return;
    if (!confirm(`${from} hat an ${to} ${formatCurrency(amount)} gezahlt?`)) return;
    trip.expenses = [...(trip.expenses || []), normalizeTripExpense({
      id: makeId("trip-expense"),
      title: `Ausgleich: ${from} an ${to}`,
      amount,
      payer: from,
      participants: [to],
      date: new Date().toISOString().slice(0, 10),
      notes: "Ausgleichszahlung",
      settlement: { from, to, amount },
    }, data.members)];
    saveData();
    setNotice("Ausgleichszahlung eingetragen.");
  }

  function openPlanningRoomForTrip(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const room = planningRoomById(clean(form.get("roomId")));
    const trip = data.trips.find((entry) => entry.id === clean(form.get("tripId")));
    if (!room || !trip) return;
    const sourceLabel = planningRoomSourceLabel(room);
    ui.modal = {
      type: "tripItem",
      tripId: trip.id,
      item: {
        type: "escape",
        title: room.title,
        provider: room.provider,
        date: clean(form.get("date")),
        duration: room.duration,
        address: room.city || room.region,
        link: room.website || room.detailUrl || planningRoomSearchUrl(room),
        notes: `${sourceLabel} · Platz ${room.rank}${typeof room.scare === "number" ? ` · Horror ${formatScore(room.scare)}/${room.scareScale || 5}` : ""}`,
      },
    };
    render();
  }

  function openWishRoomForTrip(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const wish = data.wishList.find((entry) => entry.id === clean(form.get("wishId")));
    const trip = data.trips.find((entry) => entry.id === clean(form.get("tripId")));
    if (!wish || !trip) return;
    ui.modal = {
      type: "tripItem",
      tripId: trip.id,
      item: {
        type: "escape",
        title: wish.title,
        provider: wish.provider,
        date: clean(form.get("date")),
        duration: durationForWish(wish) || planningRoomForEntry(wish)?.duration || null,
        address: [wish.city, wish.country].filter(Boolean).join(", "),
        link: wish.link,
        notes: wish.notes,
      },
    };
    render();
  }

  function saveTripFromForm(event) {
    event.preventDefault();
    const returnToSharedBooking = Boolean(ui.modal?.fromShare && pendingShare);
    const form = new FormData(event.currentTarget);
    const id = clean(form.get("id")) || makeId("trip");
    const existing = data.trips.find((trip) => trip.id === id);
    const startDate = clean(form.get("startDate"));
    const endDate = clean(form.get("endDate")) || startDate;

    if (!startDate) {
      const rangeInput = event.currentTarget.querySelector("#trip-date-range");
      rangeInput.setCustomValidity("Bitte einen Zeitraum auswählen.");
      event.currentTarget.reportValidity();
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      event.currentTarget.elements.endDate.setCustomValidity("Das Enddatum muss nach dem Startdatum liegen.");
      event.currentTarget.reportValidity();
      return;
    }

    const trip = normalizeTrip({
      ...(existing || {}),
      id,
      name: form.get("name"),
      destination: "",
      startDate,
      endDate,
      notes: "",
      items: existing?.items || [],
      planItems: existing?.planItems || [],
      expenses: existing?.expenses || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
    }, data.members);

    data.trips = existing
      ? data.trips.map((entry) => (entry.id === id ? trip : entry))
      : [trip, ...data.trips];
    ui.activeTripId = id;
    ui.modal = returnToSharedBooking ? { type: "tripShare" } : null;
    saveData();
    setNotice("Trip gespeichert.");
  }

  function saveTripItemFromForm(event) {
    event.preventDefault();
    const completesSharedImport = Boolean(ui.modal?.fromShare);
    const form = new FormData(event.currentTarget);
    const trip = data.trips.find((entry) => entry.id === clean(form.get("tripId")));
    if (!trip) return;

    const planItemId = clean(form.get("planItemId"));
    const planItem = planItemId ? trip.planItems?.find((entry) => entry.id === planItemId) : null;
    const id = clean(form.get("id")) || planItem?.tripItemId || makeId("trip-item");
    const existing = trip.items.find((item) => item.id === id);
    const type = clean(form.get("type")) || "escape";
    const date = clean(form.get("date")) || (type === "start" ? trip.startDate : "");
    const endDate = type === "accommodation" || type === "other" ? clean(form.get("endDate")) : "";
    if (date && endDate && endDate < date) {
      event.currentTarget.elements.endDate.setCustomValidity("Das Enddatum muss nach dem Startdatum liegen.");
      event.currentTarget.reportValidity();
      return;
    }
    const address = clean(form.get("address")) || (type === "start" ? DEFAULT_TRIP_START_ADDRESS : "");
    const planCity = extractCityFromAddress(address);
    const planCountry = countryFromCity(planCity) || countryFromAddress(address);

    const item = normalizeTripItem({
      ...(existing || {}),
      id,
      type,
      title: clean(form.get("title")) || (type === "start" ? "Startadresse" : ""),
      provider: form.get("provider"),
      bookingReference: "",
      date,
      time: type === "accommodation" || type === "start" ? "" : roundToQuarterHour(form.get("time")),
      endDate,
      duration: type === "accommodation" || type === "start" ? null : numberOrNull(form.get("duration")),
      address,
      city: planCity,
      link: form.get("link"),
      notes: form.get("notes"),
      sourceName: form.get("sourceName"),
      pricePerPerson: form.get("pricePerPerson"),
      availableSlots: splitTags(form.get("availableSlots")),
    });

    trip.items = existing
      ? trip.items.map((entry) => (entry.id === id ? item : entry))
      : [...trip.items, item];
    const linkedPlanItem = planItem || trip.planItems?.find((entry) => entry.tripItemId === item.id);
    if (item.type !== "accommodation" && item.type !== "start") {
      const syncedPlanItem = normalizeTripPlanItem({
        ...(linkedPlanItem || {}),
        id: linkedPlanItem?.id || makeId("trip-plan"),
        sourceType: linkedPlanItem?.sourceType || "trip-item",
        sourceId: linkedPlanItem?.sourceId || item.id,
        tripItemId: item.id,
        title: item.title,
        provider: item.provider,
        date: item.date,
        time: item.time,
        duration: item.duration,
        city: planCity || linkedPlanItem?.city,
        country: planCountry || linkedPlanItem?.country,
        address: item.address,
        link: item.link,
        notes: item.notes,
        pricePerPerson: item.pricePerPerson,
        availableSlots: normalizeTimeSlots(item.availableSlots),
      });
      trip.planItems = linkedPlanItem
        ? (trip.planItems || []).map((entry) => (entry.id === linkedPlanItem.id ? syncedPlanItem : entry))
        : [syncedPlanItem, ...(trip.planItems || [])];
    } else if (linkedPlanItem) {
      trip.planItems = (trip.planItems || []).filter((entry) => entry.id !== linkedPlanItem.id);
    }
    expandTripDates(trip, item);
    ui.activeTripId = trip.id;
    ui.modal = null;
    saveData();
    if (completesSharedImport) {
      void clearPendingShare().catch(console.warn);
      setNotice("Geteilte Buchung im Trip gespeichert.");
    } else {
      setNotice("Termin gespeichert.");
    }
  }

  function saveTripExpenseFromForm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const trip = data.trips.find((entry) => entry.id === clean(form.get("tripId")));
    if (!trip) return;
    const id = clean(form.get("id")) || makeId("trip-expense");
    const existing = (trip.expenses || []).find((entry) => entry.id === id);
    const participants = form.getAll("participants").map(clean).filter(Boolean);
    if (!participants.length) {
      event.currentTarget.querySelector(".expense-members")?.setCustomValidity?.("Bitte mindestens eine Person auswählen.");
      alert("Bitte mindestens eine Person auswählen.");
      return;
    }
    const expense = normalizeTripExpense({
      ...(existing || {}),
      id,
      title: form.get("title"),
      amount: form.get("amount"),
      payer: form.get("payer"),
      participants,
      date: form.get("date"),
      notes: form.get("notes"),
      sourceType: form.get("sourceType"),
      sourceId: form.get("sourceId"),
    }, data.members);
    trip.expenses = existing
      ? (trip.expenses || []).map((entry) => (entry.id === id ? expense : entry))
      : [...(trip.expenses || []), expense];
    ui.activeTripId = trip.id;
    ui.modal = null;
    saveData();
    setNotice("Ausgabe gespeichert.");
  }

  function expandTripDates(trip, item) {
    const firstDate = item.date;
    const lastDate = item.endDate || item.date;
    if (firstDate && (!trip.startDate || firstDate < trip.startDate)) trip.startDate = firstDate;
    if (lastDate && (!trip.endDate || lastDate > trip.endDate)) trip.endDate = lastDate;
  }

  async function importTripBooking(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const tripId = clean(form.get("tripId"));
    const trip = data.trips.find((entry) => entry.id === tripId);
    const files = [...formElement.elements.bookingFile.files];
    const pastedText = String(form.get("sourceText") || "").trim();
    const status = formElement.querySelector("[data-import-status]");
    const submit = formElement.querySelector("[data-import-submit]");
    if (!trip) return;

    submit.disabled = true;
    setImportStatus(status, "Buchung wird gelesen ...");

    try {
      const fileTexts = [];
      for (const file of files) {
        fileTexts.push(await readBookingFile(file, status));
      }
      const sourceName = files.map((file) => file.name).filter(Boolean).join(", ") || "E-Mail-Text";
      const sourceText = [...fileTexts, pastedText].filter(Boolean).join("\n\n").trim();
      if (!sourceText) throw new Error("Bitte einen Screenshot, eine E-Mail-Datei oder E-Mail-Text hinzufügen.");

      setImportStatus(status, "Buchungsdetails werden erkannt ...");
      const item = parseBookingText(sourceText, sourceName, trip);
      ui.modal = { type: "tripItem", tripId, item, imported: true };
      render();
    } catch (error) {
      setImportStatus(status, error.message || "Import fehlgeschlagen.", true);
      submit.disabled = false;
    }
  }

  async function importSharedBooking(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const tripId = clean(form.get("tripId"));
    const trip = data.trips.find((entry) => entry.id === tripId);
    const status = formElement.querySelector("[data-share-import-status]");
    const submit = formElement.querySelector("[data-share-import-submit]");
    if (!trip || !pendingShare) return;

    submit.disabled = true;
    setImportStatus(status, "Geteilte Buchung wird gelesen ...");

    try {
      const storedFiles = Array.isArray(pendingShare.files) ? pendingShare.files : [];
      const files = storedFiles.map(restoreSharedFile).filter(Boolean);
      const fileTexts = [];

      for (const file of files) {
        fileTexts.push(await readBookingFile(file, status));
      }

      const sharedText = [pendingShare.title, pendingShare.text, pendingShare.url]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join("\n");
      const sourceText = [...fileTexts, sharedText].filter(Boolean).join("\n\n").trim();
      if (!sourceText) throw new Error("Die E-Mail-App hat keinen lesbaren Inhalt geteilt.");

      setImportStatus(status, "Buchungsdetails werden erkannt ...");
      const sourceName = files.map((file) => file.name).filter(Boolean).join(", ")
        || clean(pendingShare.title)
        || "Geteilte E-Mail";
      const item = parseBookingText(sourceText, sourceName, trip);
      ui.activeTripId = trip.id;
      ui.modal = { type: "tripItem", tripId, item, imported: true, fromShare: true };
      render();
    } catch (error) {
      setImportStatus(status, error.message || "Import fehlgeschlagen.", true);
      submit.disabled = false;
    }
  }

  async function importRoomWebsite(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const tripId = clean(form.get("tripId"));
    const trip = data.trips.find((entry) => entry.id === tripId);
    const url = clean(form.get("url"));
    const pastedText = String(form.get("sourceText") || "").trim();
    const status = formElement.querySelector("[data-url-import-status]");
    const submit = formElement.querySelector("[data-url-import-submit]");
    if (!trip || !url) return;

    submit.disabled = true;
    setImportStatus(status, "Website wird gelesen ...");

    try {
      const imported = await fetchRoomWebsiteSource(url, pastedText, status);
      const candidate = parseRoomWebsiteText(imported.source, imported.finalUrl || url);
      if (!candidate.title) throw new Error("Ich konnte keinen Raumtitel erkennen. Bitte importiere eine konkrete Raumseite oder ergänze den Seitentext.");
      const result = addTripPlanCandidate(trip, candidate);
      if (result === "duplicate") throw new Error("Raum bereits in der Planung enthalten.");
      ui.modal = null;
      ui.activeTripId = trip.id;
      saveData();
      setNotice(`${candidate.title} wurde aus der Website in die Planung übernommen.`);
    } catch (error) {
      setImportStatus(status, error.message || "Website-Import fehlgeschlagen.", true);
      submit.disabled = false;
    }
  }

  async function fetchRoomWebsiteSource(url, pastedText, status) {
    const normalizedUrl = normalizeImportUrl(url);
    if (!normalizedUrl) throw new Error("Bitte eine gültige Website-URL eintragen.");
    if (pastedText) {
      return { source: pastedText, finalUrl: normalizedUrl, method: "pasted" };
    }

    const errors = [];

    if (canUseRoomImportApi()) {
      try {
        setImportStatus(status, "Website wird serverseitig gelesen ...");
        const response = await fetch(ROOM_IMPORT_API_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalizedUrl }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.ok || !payload.html) {
          throw new Error(payload.error || response.statusText || "Serverimport fehlgeschlagen.");
        }
        return {
          source: limitWebsiteImportText(payload.html),
          finalUrl: payload.finalUrl || normalizedUrl,
          method: payload.source || "server",
        };
      } catch (error) {
        errors.push(error.message || "Serverimport fehlgeschlagen.");
      }
    }

    const attempts = [
      {
        label: "Direktimport",
        url: normalizedUrl,
        options: {},
      },
      {
        label: "Reader-Import",
        url: roomReaderUrl(normalizedUrl),
        options: {},
      },
      {
        label: "Proxy-Import",
        url: `https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`,
        options: {},
      },
    ].filter((attempt) => attempt.url);

    for (const attempt of attempts) {
      try {
        setImportStatus(status, `${attempt.label} wird versucht ...`);
        const response = await fetch(attempt.url, attempt.options);
        if (!response.ok) throw new Error(response.statusText || `${response.status}`);
        const source = await response.text();
        if (source && source.trim().length > 80) {
          return {
            source: limitWebsiteImportText(source),
            finalUrl: normalizedUrl,
            method: attempt.label,
          };
        }
        throw new Error("Keine lesbaren Inhalte gefunden.");
      } catch (error) {
        errors.push(`${attempt.label}: ${error.message || "fehlgeschlagen"}`);
      }
    }

    throw new Error(`Der automatische Import konnte diese Website nicht lesen. Details: ${errors.slice(0, 2).join(" · ")}. Als Notlösung bitte Text der konkreten Raumseite einfügen.`);
  }

  function canUseRoomImportApi() {
    return /^https?:$/i.test(window.location.protocol);
  }

  function normalizeImportUrl(value) {
    const text = clean(value);
    if (!text) return "";
    try {
      const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function roomReaderUrl(url) {
    try {
      const target = new URL(url);
      const protocol = target.protocol === "http:" ? "http" : "https";
      return `https://r.jina.ai/${protocol}://${target.host}${target.pathname}${target.search}`;
    } catch {
      return "";
    }
  }

  function limitWebsiteImportText(value) {
    const text = String(value || "");
    return text.length > MAX_WEBSITE_IMPORT_CHARS ? text.slice(0, MAX_WEBSITE_IMPORT_CHARS) : text;
  }

  function parseRoomWebsiteText(source, url) {
    const html = String(source || "");
    const page = parseWebsiteDocument(html);
    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(html);
    const text = cleanOcrText([
      hasHtmlTags ? page.text || htmlToText(html) : html,
      page.structuredText,
      page.metaDescription,
    ].filter(Boolean).join("\n"));
    const lines = text.split("\n").map(clean).filter(Boolean);
    const addressDetails = extractAddressDetails(lines);
    const provider = firstProviderName([
      knownProviderFromUrl(url),
      page.jsonLd?.provider,
      page.jsonLd?.brand,
      page.siteName,
      extractLabeledValue(lines, ["anbieter", "provider", "veranstalter", "operator", "organizer", "organiser"]),
      extractRepeatedBrand(lines),
      providerFromUrl(url),
    ]);
    const rawTitle = cleanWebsiteTitle(
      firstWebsiteTitle(websiteTitleCandidates(page, url, provider, lines, text), provider),
      provider,
    );
    const title = polishWebsiteTitle(rawTitle);
    const rawAddress = addressDetails.address
      || page.jsonLd?.address
      || extractLabeledValue(lines, ["adresse", "address", "location", "venue", "veranstaltungsort", "lieu", "adres"]);
    const address = clean(rawAddress);
    const city = extractCityFromAddress(address)
      || page.jsonLd?.city
      || extractLabeledValue(lines, ["ort", "stadt", "city", "ville", "plaats"]);
    const country = germanCountry(countryFromCity(city) || countryFromAddress(address) || countryFromUrl(url) || page.jsonLd?.country);
    const duration = durationFromText(text) || page.jsonLd?.duration || extractBookingDuration(lines);
    const pricePerPerson = priceFromText(text);
    const availableSlots = extractVisibleSlots(text);
    const notes = [
      pricePerPerson ? `${formatCurrency(pricePerPerson)} p. P. bei 5 Spielern` : "",
      addressDetails.note ? `Adresshinweis: ${addressDetails.note}` : "",
    ].filter(Boolean).join("\n");

    return normalizeTripPlanItem({
      sourceType: "website",
      sourceId: url,
      title,
      provider,
      country,
      city,
      address: address || city,
      duration,
      pricePerPerson,
      availableSlots,
      link: url,
      notes,
    });
  }

  function parseWebsiteDocument(source) {
    const documentNode = new DOMParser().parseFromString(String(source || ""), "text/html");
    const readableDocument = documentNode.cloneNode(true);
    readableDocument.querySelectorAll("script, style, noscript, template, svg").forEach((node) => node.remove());
    const jsonLdEntries = [...documentNode.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((script) => {
        try {
          const parsed = JSON.parse(script.textContent || "{}");
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [];
        }
      })
      .flatMap(flattenJsonLd);
    const jsonLd = jsonLdEntries
      .sort((a, b) => websiteStructuredScore(b) - websiteStructuredScore(a))[0] || {};
    const jsonLdBreadcrumbTitles = jsonLdEntries
      .filter((entry) => entry.type === "ListItem")
      .sort((a, b) => (b.position || 0) - (a.position || 0))
      .map((entry) => entry.name)
      .filter(Boolean);
    const headings = [...documentNode.querySelectorAll("h1, h2")]
      .map((entry) => clean(entry.textContent))
      .filter(Boolean)
      .slice(0, 8);
    const metaDescription = metaContent(documentNode, [
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
    ]);
    const appJsonText = [...documentNode.querySelectorAll('script[type="application/json"], script#__NEXT_DATA__')]
      .flatMap((script) => {
        try {
          return extractJsonText(JSON.parse(script.textContent || "{}"));
        } catch {
          return [];
        }
      })
      .join("\n");
    const structuredText = [
      ...jsonLdEntries.flatMap((entry) => [
        entry.name,
        entry.provider,
        entry.brand,
        entry.address,
        entry.city,
        entry.country,
        entry.duration ? `${entry.duration} minutes` : "",
        entry.description,
      ]),
      appJsonText,
    ].filter(Boolean).join("\n");
    return {
      title: clean(documentNode.querySelector("title")?.textContent),
      h1: headings[0] || "",
      headings,
      ogTitle: metaContent(documentNode, ['meta[property="og:title"]']),
      twitterTitle: metaContent(documentNode, ['meta[name="twitter:title"]']),
      siteName: metaContent(documentNode, ['meta[property="og:site_name"]', 'meta[name="application-name"]']),
      metaDescription,
      text: readableDocument.body ? htmlToText(readableDocument.body.innerHTML) : "",
      structuredText,
      jsonLd,
      jsonLdBreadcrumbTitles,
    };
  }

  function flattenJsonLd(entry) {
    return collectJsonLdNodes(entry)
      .map((source) => {
        const addressSource = source.address || source.location?.address || source.place?.address;
        const address = jsonLdAddress(addressSource);
        return {
          type: clean(Array.isArray(source["@type"]) ? source["@type"][0] : source["@type"]),
          name: clean(jsonLdName(source.name || source.headline)),
          position: numberOrNull(source.position),
          address,
          city: clean(jsonLdName(addressSource?.addressLocality || source.location?.name)),
          country: clean(jsonLdName(addressSource?.addressCountry)),
          provider: clean(jsonLdName(source.provider || source.organizer || source.seller || source.publisher)),
          brand: clean(jsonLdName(source.brand)),
          duration: jsonLdDuration(source.duration || source.timeRequired || source.estimatedDuration),
          description: clean(source.description),
        };
      })
      .filter((source) => source.name || source.address || source.provider || source.duration);
  }

  function firstWebsiteTitle(candidates, provider = "") {
    const cleaned = candidates.map(clean).filter(Boolean);
    const providerKey = normalize(provider);
    return cleaned.find((candidate) => {
      const key = normalize(candidate);
      if (!key || candidate.length > 110 || isBadWebsiteTitle(candidate)) return false;
      if (providerKey && (key === providerKey || providerKey.includes(key) || key.includes(providerKey))) return false;
      return true;
    }) || cleaned[0] || "";
  }

  function websiteTitleCandidates(page, url, provider, lines, text) {
    const title = clean(page.title);
    const h1 = clean(page.h1);
    const cleanedDocumentTitle = cleanWebsiteTitle(title, provider);
    const preferDocumentTitle = shouldPreferDocumentTitle(title, h1, provider);
    return [
      ...page.jsonLdBreadcrumbTitles,
      ...(preferDocumentTitle ? [cleanedDocumentTitle] : []),
      h1,
      page.ogTitle,
      page.twitterTitle,
      ...(!preferDocumentTitle ? [cleanedDocumentTitle || title] : []),
      titleFromUrl(url),
      ...(page.headings || []).slice(1),
      page.jsonLd?.name,
      extractLabeledValue(lines, ["raum", "room", "game", "spiel", "escape room"]),
      extractBookingTitle(lines, "escape", text),
    ];
  }

  function shouldPreferDocumentTitle(title, heading, provider = "") {
    const cleanTitle = cleanWebsiteTitle(title, provider);
    const cleanHeading = cleanWebsiteTitle(heading, provider);
    if (!cleanTitle || !cleanHeading || isBadWebsiteTitle(cleanTitle)) return false;
    if (normalize(cleanTitle) === normalize(cleanHeading)) return false;
    const headingWords = normalize(cleanHeading).split(" ").filter(Boolean);
    return headingWords.length <= 1
      && normalize(cleanTitle).includes(normalize(cleanHeading))
      && cleanTitle.length <= 80;
  }

  function isBadWebsiteTitle(value) {
    const key = normalize(value);
    return /^(home|startseite|booking|book now|reserve|reservieren|escape room|escape rooms|escape games|escape room beschreibung|details|your mission|mission|records|questions about this game|do you like this theme|interested in other rooms|haufige fragen|faq|fragen und antworten|kontakt|contact|preise|preise gutschein|preise gutscheine|gift voucher|gutschein|impressum|datenschutz|terms|legal notice|jobs?)$/.test(key);
  }

  function cleanWebsiteTitle(value, provider = "") {
    let title = cleanBookingTitle(value)
      .replace(/^\d{1,3}%\s+/, "")
      .replace(/\s*\|\s*book\s+now.*$/i, "")
      .replace(/\s*[-–|]\s*(escape room|booking|book now|reserve|reservieren)\s*$/i, "")
      .replace(/\s+(?:escape rooms?|escape games?|escape room game)\s*$/i, "");
    const providerName = clean(provider);
    if (providerName && normalize(title).includes(normalize(providerName))) {
      title = title
        .split(/\s[-–|]\s/)
        .map(clean)
        .find((part) => normalize(part) !== normalize(providerName))
        || title;
    }
    title = title
      .replace(/^mission\s+/i, "")
      .replace(/,\s*(?:secrets?|the story|video|photos?).*$/i, "");
    return clean(title.replace(/\s*[-–|]\s*$/, ""));
  }

  function polishWebsiteTitle(value) {
    return clean(value).replace(/(^|[\s([{])([a-zäöü])/g, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("de-DE")}`);
  }

  function cleanProviderName(value) {
    return clean(value)
      .split(/\s[|–-]\s/)[0]
      .replace(/\s+(?:escape rooms?|escaperooms?)\s*$/i, " EscapeRooms")
      .trim();
  }

  function firstProviderName(candidates) {
    const cleaned = candidates
      .map(cleanProviderName)
      .filter(Boolean);
    return cleaned.find((candidate) => !isGenericProviderName(candidate)) || cleaned[0] || "";
  }

  function isGenericProviderName(value) {
    return /^(escape rooms?|escaperooms?|escape games?|room escape|book now|booking|kontakt|contact|haufige fragen|faq)$/i.test(normalize(value));
  }

  function providerFromUrl(url) {
    const host = hostNameFromUrl(url).toLowerCase();
    if (!host) return "";
    const known = knownProviderFromUrl(url);
    if (known) return known;
    return host
      .split(".")
      .filter((part) => !["com", "de", "fr", "be", "nl", "co", "uk"].includes(part))
      .map((part) => part.replace(/[-_]+/g, " "))
      .map(polishWebsiteTitle)
      .join(" ");
  }

  function knownProviderFromUrl(url) {
    const host = hostNameFromUrl(url).toLowerCase();
    if (host.includes("adventurerooms-hamburg")) return "AdventureRooms Hamburg";
    if (host.includes("nexus-exit")) return "Nexus Exit";
    if (host.includes("escaperush")) return "Escape Rush";
    if (host.includes("escaparium")) return "Escaparium";
    return "";
  }

  function metaContent(documentNode, selectors) {
    for (const selector of selectors) {
      const value = clean(documentNode.querySelector(selector)?.content);
      if (value) return value;
    }
    return "";
  }

  function websiteStructuredScore(entry) {
    let score = 0;
    if (entry.name) score += 20;
    if (entry.address) score += 18;
    if (entry.city) score += 8;
    if (entry.country) score += 4;
    if (entry.duration) score += 10;
    if (entry.provider || entry.brand) score += 6;
    if (/(escape|room|game|spiel|adventure|mission)/i.test(`${entry.name} ${entry.description}`)) score += 10;
    return score;
  }

  function collectJsonLdNodes(entry) {
    if (!entry || typeof entry !== "object") return [];
    const nodes = [];
    const queue = [entry, ...(Array.isArray(entry["@graph"]) ? entry["@graph"] : [])];
    const seen = new Set();

    while (queue.length) {
      const current = queue.shift();
      if (!current || typeof current !== "object" || seen.has(current)) continue;
      seen.add(current);
      nodes.push(current);
      ["mainEntity", "about", "itemListElement", "offers", "provider", "organizer", "seller", "brand", "location", "place"].forEach((key) => {
        const value = current[key];
        if (Array.isArray(value)) queue.push(...value);
        else if (value && typeof value === "object") queue.push(value);
      });
    }

    return nodes;
  }

  function jsonLdName(value) {
    if (!value) return "";
    if (typeof value === "string" || typeof value === "number") return clean(value);
    if (Array.isArray(value)) return value.map(jsonLdName).find(Boolean) || "";
    return clean(value.name || value.label || value["@id"] || "");
  }

  function jsonLdAddress(value) {
    if (!value) return "";
    if (typeof value === "string") return clean(value);
    if (Array.isArray(value)) return value.map(jsonLdAddress).find(Boolean) || "";
    return [
      value.streetAddress,
      value.postalCode,
      value.addressLocality,
      value.addressRegion,
      jsonLdName(value.addressCountry),
    ].filter(Boolean).join(", ");
  }

  function jsonLdDuration(value) {
    const text = clean(jsonLdName(value) || value);
    if (!text) return null;
    const isoDuration = isoDurationMinutes(text);
    return isoDuration || durationFromText(text);
  }

  function isoDurationMinutes(value) {
    const match = clean(value).match(/^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?$/i);
    if (!match) return null;
    const duration = Number(match[1] || 0) * 60 + Number(match[2] || 0);
    return duration >= 5 && duration <= 360 ? duration : null;
  }

  function extractJsonText(value, depth = 0) {
    if (depth > 5 || value === null || value === undefined) return [];
    if (typeof value === "string") {
      const text = clean(value);
      return text.length >= 3 && text.length <= 400 ? [text] : [];
    }
    if (typeof value === "number") return [String(value)];
    if (Array.isArray(value)) return value.flatMap((entry) => extractJsonText(entry, depth + 1)).slice(0, 250);
    if (typeof value !== "object") return [];

    const usefulKeys = /^(title|name|headline|description|address|streetAddress|addressLocality|addressCountry|city|country|duration|timeRequired|price|offers|provider|brand|organizer|location|room|game|experience|question|answer|faq)$/i;
    return Object.entries(value)
      .filter(([key]) => usefulKeys.test(key))
      .flatMap(([, entry]) => extractJsonText(entry, depth + 1))
      .slice(0, 250);
  }

  function countryFromAddress(address) {
    const parts = clean(address).split(",").map(clean).filter(Boolean).reverse();
    if (parts.some((part) => /\b(?:qc|quebec|québec)\b/i.test(part) || /\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/i.test(part))) return "Kanada";
    return parts.map(countryFromText).find(Boolean) || "";
  }

  function countryFromUrl(url) {
    const host = hostNameFromUrl(url).toLowerCase();
    if (!host) return "";
    if (host.includes("escaperush")) return "Belgien";
    if (host.endsWith(".de") || host.includes("adventurerooms-hamburg") || host.includes("nexus-exit")) return "Deutschland";
    if (host.endsWith(".be")) return "Belgien";
    if (host.endsWith(".fr")) return "Frankreich";
    if (host.endsWith(".nl")) return "Niederlande";
    if (host.endsWith(".lu")) return "Luxemburg";
    if (host.endsWith(".es")) return "Spanien";
    if (host.endsWith(".pl")) return "Polen";
    if (host.endsWith(".pt")) return "Portugal";
    if (host.endsWith(".it")) return "Italien";
    if (host.endsWith(".ca") || host.includes("escaparium")) return "Kanada";
    return "";
  }

  function countryFromText(value) {
    const normalized = normalize(value);
    if (!normalized) return "";
    if (/\b(qc|quebec|canada|kanada)\b/.test(normalized)) return "Kanada";
    return Object.entries(COUNTRY_LABELS_DE)
      .find(([english, german]) => normalized.includes(normalize(english)) || normalized.includes(normalize(german)))?.[1] || "";
  }

  function titleFromUrl(url) {
    try {
      const segments = new URL(url).pathname
        .split("/")
        .map((segment) => decodeURIComponent(segment))
        .map((segment) => segment.replace(/[-_]+/g, " "))
        .map(clean)
        .filter((segment) => segment && !/^(en|de|fr|nl|booking|book|rooms?|games?|escape-?rooms?)$/i.test(segment));
      return segments.pop() || "";
    } catch {
      return "";
    }
  }

  function hostNameFromUrl(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function extractVisibleSlots(text) {
    return unique(extractTimes(text)
      .filter((slot) => {
        const minutes = timeToMinutes(slot);
        return minutes !== null && minutes >= 8 * 60 && minutes <= 23 * 60;
      }))
      .sort()
      .slice(0, 24);
  }

  function restoreSharedFile(entry) {
    const blob = entry?.blob;
    if (!(blob instanceof Blob)) return null;
    if (blob instanceof File) return blob;
    return new File([blob], entry.name || "Geteilte Datei", {
      type: entry.type || blob.type,
      lastModified: entry.lastModified || Date.now(),
    });
  }

  async function readBookingFile(file, status) {
    if (file.type.startsWith("image/")) return recognizeBookingImage(file, status);
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      return readBookingPdf(file, status);
    }
    const text = await file.text();
    return file.name.toLowerCase().endsWith(".eml") || file.type === "message/rfc822"
      ? extractEmailText(text)
      : text;
  }

  async function readBookingPdf(file, status) {
    const buffer = await file.arrayBuffer();
    const simpleText = extractSimplePdfText(buffer);
    if (simpleText.replace(/\s/g, "").length >= 80) return simpleText;

    const pdfjs = await ensurePdfJs();
    setImportStatus(status, "PDF wird geöffnet ...");
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const documentNode = await loadingTask.promise;

    try {
      if (documentNode.numPages > MAX_PDF_PAGES) {
        throw new Error(`Die PDF hat mehr als ${MAX_PDF_PAGES} Seiten. Bitte nur die Buchungsseiten importieren.`);
      }

      const pageTexts = [];
      for (let pageNumber = 1; pageNumber <= documentNode.numPages; pageNumber += 1) {
        setImportStatus(status, `PDF-Seite ${pageNumber} von ${documentNode.numPages} wird gelesen ...`);
        const page = await documentNode.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = extractPdfPageText(textContent);
        const annotations = await page.getAnnotations();
        const pageLinks = annotations
          .map((annotation) => clean(annotation.url || annotation.unsafeUrl))
          .filter((url) => /^https?:\/\//i.test(url));

        if (pageText.replace(/\s/g, "").length >= 80) {
          pageTexts.push([pageText, ...pageLinks].filter(Boolean).join("\n"));
        } else {
          setImportStatus(status, `PDF-Seite ${pageNumber} von ${documentNode.numPages} wird per Texterkennung gelesen ...`);
          const pageImage = await renderPdfPage(page);
          pageTexts.push([await recognizeBookingImage(pageImage, status), ...pageLinks].filter(Boolean).join("\n"));
        }
        page.cleanup();
      }

      const text = pageTexts.filter(Boolean).join("\n\n").trim();
      if (!text) throw new Error("In der PDF konnte kein lesbarer Text gefunden werden.");
      return text;
    } finally {
      await documentNode.destroy();
    }
  }

  function extractSimplePdfText(buffer) {
    const source = new TextDecoder("latin1").decode(buffer);
    const parts = [];
    const literalPattern = /\((?:\\.|[^\\)])*\)\s*Tj/g;
    const arrayPattern = /\[((?:\s*\((?:\\.|[^\\)])*\)\s*)+)\]\s*TJ/g;
    let match;

    while ((match = literalPattern.exec(source))) {
      parts.push(decodePdfLiteral(match[0].replace(/\s*Tj$/, "")));
    }
    while ((match = arrayPattern.exec(source))) {
      const literals = match[1].match(/\((?:\\.|[^\\)])*\)/g) || [];
      parts.push(literals.map(decodePdfLiteral).join(""));
    }

    return cleanOcrText(parts.filter(Boolean).join("\n"));
  }

  function decodePdfLiteral(value) {
    return clean(value)
      .replace(/^\(|\)$/g, "")
      .replace(/\\([nrtbf()\\])/g, (_, token) => ({
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        "(": "(",
        ")": ")",
        "\\": "\\",
      })[token] || token)
      .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(Number.parseInt(octal, 8)));
  }

  function extractPdfPageText(textContent) {
    const lines = [];
    let currentLine = [];
    let previousY = null;

    (textContent?.items || []).forEach((item) => {
      const value = clean(item.str);
      if (!value) return;
      const y = Number(item.transform?.[5]);
      if (previousY !== null && Number.isFinite(y) && Math.abs(y - previousY) > 2) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }
      currentLine.push(value);
      if (Number.isFinite(y)) previousY = y;
    });

    if (currentLine.length) lines.push(currentLine.join(" "));
    return lines.map(clean).filter(Boolean).join("\n");
  }

  async function renderPdfPage(page) {
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.max(1.4, Math.min(2.2, 2400 / Math.max(baseViewport.width, baseViewport.height)));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    await page.render({ canvasContext: context, viewport }).promise;
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("PDF-Seite konnte nicht verarbeitet werden.")),
        "image/png",
      );
    });
  }

  function ensurePdfJs() {
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = import(PDFJS_MODULE_URL)
      .then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        return pdfjs;
      })
      .catch((error) => {
        pdfJsPromise = null;
        throw new Error(`PDF-Unterstützung konnte nicht geladen werden: ${error.message || "Unbekannter Fehler"}`);
      });
    return pdfJsPromise;
  }

  async function recognizeBookingImage(file, status) {
    await ensureTesseract();
    setImportStatus(status, "Screenshot wird vorbereitet ...");
    const preparedImage = await prepareImageForOcr(file);
    const result = await window.Tesseract.recognize(preparedImage, "eng+fra+deu", {
      logger(message) {
        if (message.status !== "recognizing text") return;
        setImportStatus(status, `Screenshot wird gelesen ... ${Math.round((message.progress || 0) * 100)} %`);
      },
    });
    return cleanOcrText(result?.data?.text || "");
  }

  async function prepareImageForOcr(file) {
    if (typeof createImageBitmap !== "function") return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.max(1, Math.min(2, 2600 / bitmap.width));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      let brightness = 0;
      const sampleStep = Math.max(4, Math.floor(image.data.length / 20000 / 4) * 4);
      for (let index = 0; index < image.data.length; index += sampleStep) {
        brightness += image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
      }
      const sampleCount = Math.ceil(image.data.length / sampleStep);
      const invert = brightness / sampleCount < 125;

      for (let index = 0; index < image.data.length; index += 4) {
        let gray = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
        if (invert) gray = 255 - gray;
        gray = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
        image.data[index] = gray;
        image.data[index + 1] = gray;
        image.data[index + 2] = gray;
      }
      context.putImageData(image, 0, 0);
      return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob || file), "image/png"));
    } catch (error) {
      console.warn("OCR image preparation failed", error);
      return file;
    }
  }

  function cleanOcrText(value) {
    return String(value || "")
      .replace(/\r/g, "")
      .replace(/[|¦]/g, "I")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function ensureTesseract() {
    if (window.Tesseract?.recognize) return Promise.resolve(window.Tesseract);
    if (ocrScriptPromise) return ocrScriptPromise;

    ocrScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TESSERACT_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => {
        ocrScriptPromise = null;
        reject(new Error("Texterkennung konnte nicht geladen werden. Bitte Internetverbindung prüfen."));
      };
      document.head.append(script);
    });
    return ocrScriptPromise;
  }

  function setImportStatus(element, message, isError = false) {
    if (!element) return;
    element.hidden = false;
    element.classList.toggle("is-error", isError);
    element.textContent = message;
  }

  function extractEmailText(source) {
    const subject = source.match(/^Subject:\s*(.+)$/im)?.[1] || "";
    const decoded = decodeQuotedPrintable(source);
    const base64Part = decoded.match(/Content-Type:\s*text\/(?:plain|html)[^\n]*[\s\S]*?Content-Transfer-Encoding:\s*base64\s*\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/i)?.[1];
    let body = decoded;

    if (base64Part) {
      try {
        const bytes = Uint8Array.from(atob(base64Part.replace(/\s/g, "")), (character) => character.charCodeAt(0));
        body = new TextDecoder().decode(bytes);
      } catch {
        body = decoded;
      }
    }

    const readableBody = htmlToText(body)
      .split("\n")
      .filter((line) => !/^(content-|mime-version:|boundary=|--[-_a-z0-9]+)/i.test(line.trim()))
      .join("\n");
    return [subject ? `Subject: ${subject}` : "", readableBody].filter(Boolean).join("\n").trim();
  }

  function decodeQuotedPrintable(source) {
    return source
      .replace(/=\r?\n/g, "")
      .replace(/(?:=[A-Fa-f0-9]{2})+/g, (sequence) => {
        const bytes = sequence.match(/[A-Fa-f0-9]{2}/g).map((hex) => Number.parseInt(hex, 16));
        return new TextDecoder().decode(Uint8Array.from(bytes));
      });
  }

  function htmlToText(source) {
    const stripped = String(source || "")
      .replace(/<\s*(script|style|noscript|template|svg)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
      .replace(/<\s*(script|style|noscript|template|svg)\b[^>]*\/\s*>/gi, "");
    const prepared = stripped
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<(p|div|tr|li|h[1-6]|table|tbody|thead|section|article)[^>]*>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h[1-6]|table|tbody|thead|section|article)>/gi, "\n")
      .replace(/<t[dh][^>]*>/gi, "\n")
      .replace(/<\/t[dh]>/gi, "\n");
    const documentNode = new DOMParser().parseFromString(prepared, "text/html");
    return (documentNode.body.textContent || prepared)
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function parseBookingText(sourceText, sourceName, trip) {
    const text = cleanOcrText(sourceText);
    const lines = text.split("\n").map(clean).filter(Boolean);
    const type = detectBookingType(text);
    const catalogMatch = findBookingCatalogMatch(text);
    const dates = unique(extractDates(text));
    const dateLabels = type === "accommodation"
      ? ["check in", "check-in", "arrival", "ankunft", "arrivee", "arrivée", "date d arrivee"]
      : ["datum", "date", "spieltag", "booking date", "reservation date", "session date", "date of visit", "scheduled for", "when"];
    const endDateLabels = ["check out", "check-out", "departure", "abreise", "depart", "départ"];
    const date = extractLabeledDate(lines, dateLabels) || dates[0] || trip.startDate || "";
    const endDate = extractLabeledDate(lines, endDateLabels)
      || (type === "accommodation" ? dates.find((candidate) => candidate > date) || "" : "");
    const times = extractTimes(text);
    const sessionTimes = extractSessionTimeRange(lines);
    const timeLabels = type === "accommodation"
      ? ["check in", "check-in", "arrival", "ankunft"]
      : ["uhrzeit", "time", "start time", "session time", "start", "slot", "heure", "tijd", "scheduled for"];
    const endTimeLabels = ["check out", "check-out", "departure", "abreise", "ende", "end time"];
    const city = extractLabeledValue(lines, ["ort", "stadt", "city", "ville", "plaats"]);
    const addressDetails = extractAddressDetails(lines);
    const address = mergeAddressAndCity(addressDetails.address, city);
    const provider = catalogMatch?.provider
      || extractLabeledValue(lines, ["anbieter", "provider", "veranstalter", "operator", "organizer", "organiser", "host", "gastgeber"])
      || extractRepeatedBrand(lines)
      || (text.toLowerCase().includes("airbnb") ? "Airbnb" : "");

    const time = type === "accommodation" ? "" : extractLabeledTime(lines, timeLabels) || sessionTimes[0] || likelyBookingTime(lines, times);
    const detectedEndTime = type === "accommodation" ? "" : extractLabeledTime(lines, endTimeLabels) || sessionTimes[1] || "";
    const duration = type === "accommodation"
      ? null
      : extractBookingDuration(lines) ?? durationBetweenTimes(time, detectedEndTime) ?? catalogMatch?.duration ?? null;

    return normalizeTripItem({
      type,
      title: catalogMatch?.title || extractBookingTitle(lines, type, text),
      provider,
      bookingReference: "",
      date,
      time,
      endDate,
      duration,
      address,
      city: "",
      link: catalogMatch?.website || extractBestBookingLink(text),
      notes: extractImportantBookingNotes(lines, addressDetails.note),
      sourceName,
    });
  }

  function detectBookingType(text) {
    return /(airbnb|hotel|hostel|apartment|unterkunft|übernachtung|uebernachtung|check[ -]?in|check[ -]?out|accommodation|ferienwohnung)/i.test(text)
      ? "accommodation"
      : "escape";
  }

  function extractBookingTitle(lines, type, text = lines.join("\n")) {
    const confirmedIndex = lines.findIndex((line) => /(your booking is confirmed|booking confirmed|reservation confirmed|buchung.*bestatigt|reservation.*confirmee)/i.test(normalize(line)));
    if (confirmedIndex >= 0) {
      const nextTitle = lines.slice(confirmedIndex + 1, confirmedIndex + 5).find((line) => !isBookingNoiseLine(line));
      if (nextTitle) return cleanBookingTitle(nextTitle);
    }

    const textPatterns = [
      /(?:game|room|experience|activity|escape room)\s*[:#-]\s*([^\n]{3,100})/i,
      /(?:your booking for|you(?:'|’)re booked for|reservation for)\s+([^\n]{3,100})/i,
    ];
    for (const pattern of textPatterns) {
      const match = text.match(pattern);
      if (match?.[1]) return cleanBookingTitle(match[1]);
    }

    const subject = lines.find((line) => /^subject:/i.test(line));
    if (subject) return cleanBookingTitle(subject.replace(/^subject:\s*/i, "").replace(/^(re|fw|fwd):\s*/i, ""));

    const labeled = extractLabeledValue(lines, type === "accommodation"
      ? ["unterkunft", "property", "accommodation", "listing", "hotel"]
      : ["escape room", "room", "game", "spiel", "experience"]);
    if (labeled) return cleanBookingTitle(labeled);

    return cleanBookingTitle(lines.find((line) => !isBookingNoiseLine(line)) || (type === "accommodation" ? "Unterkunft" : "Escape Room"));
  }

  function cleanBookingTitle(value) {
    return clean(value)
      .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
      .replace(/^.*?\b(?:booking|reservation)\s+(?:is\s+)?(?:confirmed|confirmation|confirmee|confirmée)\s*[:#'"-]+\s*/i, "")
      .replace(/^(booking|reservation|order)?\s*(is\s+)?(confirmed|confirmation|confirmee|confirmée)\s*[:#'"-]*\s*/i, "")
      .replace(/^your\s+(booking|reservation)\s+(is\s+)?(confirmed|confirmation)\s*[:#'"-]*\s*/i, "")
      .trim();
  }

  function isBookingNoiseLine(line) {
    const normalizedLine = normalize(line);
    if (line.length < 3 || line.length > 100) return true;
    if (/^\d{1,2}[:.]\d{2}$/.test(line)) return true;
    if (/^https?:\/\//i.test(line) || /@/.test(line)) return true;
    return /^(from|to|date|sent|mime version|content|booking confirmation|booking details|your booking is confirmed|customer|price|participants|total price|amount paid|amount due|booking number|vat|view map)\b/.test(normalizedLine);
  }

  function findBookingCatalogMatch(text) {
    const normalizedText = normalize(text);
    const lineCandidates = text.split("\n")
      .map((line) => ({ original: clean(line), normalized: normalize(line) }))
      .filter((line) => line.normalized.length >= 4 && line.normalized.length <= 100);
    const catalog = [...data.wishList, ...data.played, ...planningData.terpeca, ...planningData.escaperoomers];
    let best = null;

    catalog.forEach((entry) => {
      const title = normalize(entry.title);
      if (title.length < 4) return;
      const tokens = title.split(" ").filter((token) => token.length >= 3);
      const matchedTokens = tokens.filter((token) => normalizedText.includes(token)).length;
      if (matchedTokens === 0) return;
      const closestLine = lineCandidates
        .map((line) => ({ ...line, similarity: textSimilarity(title, line.normalized) }))
        .sort((a, b) => b.similarity - a.similarity)[0];
      const exactLine = closestLine?.normalized === title;
      const exactText = title.length >= 8 && normalizedText.includes(title);
      const coverage = tokens.length ? matchedTokens / tokens.length : 0;
      let score = 0;
      if (exactLine) score = 240 + title.length;
      else if (closestLine?.similarity >= 0.78) score = closestLine.similarity * 180 + title.length / 100;
      else if (exactText) score = 100 + title.length;
      else if (coverage >= 0.75 && matchedTokens >= 2) score = coverage * 50 + title.length / 100;
      if (score > (best?.score || 0)) {
        best = {
          title: closestLine?.similarity >= 0.78 ? cleanBookingTitle(closestLine.original) : entry.title,
          provider: entry.provider,
          website: entry.website || entry.link || entry.detailUrl || "",
          duration: entry.duration || null,
          score,
        };
      }
    });

    return best;
  }

  function textSimilarity(left, right) {
    if (left === right) return 1;
    const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
    for (let column = 0; column <= right.length; column += 1) rows[0][column] = column;
    for (let row = 1; row <= left.length; row += 1) {
      for (let column = 1; column <= right.length; column += 1) {
        rows[row][column] = Math.min(
          rows[row - 1][column] + 1,
          rows[row][column - 1] + 1,
          rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
        );
      }
    }
    return 1 - rows[left.length][right.length] / Math.max(left.length, right.length);
  }

  function extractRepeatedBrand(lines) {
    const candidates = new Map();
    lines.forEach((line) => {
      if (isBookingNoiseLine(line) || /\d/.test(line) || line.length > 50) return;
      const key = normalize(line);
      if (!key) return;
      const candidate = candidates.get(key) || { line, count: 0 };
      candidate.count += 1;
      candidates.set(key, candidate);
    });
    return [...candidates.values()].sort((a, b) => b.count - a.count).find((candidate) => candidate.count >= 2)?.line || "";
  }

  function extractSessionTimeRange(lines) {
    for (const line of lines) {
      const times = extractTimes(line);
      if (times.length >= 2 && /(?:-|–|—|\bto\b|\bbis\b|\ba\b|\bà\b)/i.test(line)) return times.slice(0, 2);
    }
    return [];
  }

  function extractBookingDuration(lines) {
    const candidates = lines.filter((line) => (
      /(duration|dauer|spieldauer|game length|running time)/i.test(line)
      || /\d+\s*(hour|hours|stunde|stunden|heure|heures)\b/i.test(line)
    ));
    for (const line of candidates) {
      const hours = Number(line.match(/(\d+)\s*(?:hour|hours|stunde|stunden|heure|heures)\b/i)?.[1] || 0);
      const minutes = Number(line.match(/(\d+)\s*(?:minute|minutes|minuten|min\.?|mins?)\b/i)?.[1] || 0);
      const duration = hours * 60 + minutes;
      if (duration >= 5 && duration <= 360) return duration;
    }
    return null;
  }

  function likelyBookingTime(lines, allTimes) {
    for (let index = 0; index < lines.length; index += 1) {
      const times = extractTimes(lines[index]);
      if (!times.length) continue;
      if (index < 4 && /^\d{1,2}[:.]\d{2}$/.test(lines[index])) continue;
      return times[0];
    }
    return allTimes.find((time) => time !== allTimes[0]) || allTimes[0] || "";
  }

  function mergeAddressAndCity(address, city) {
    const cleanedAddress = clean(address).replace(/\s*\(?view map\)?\s*$/i, "");
    if (!city || normalize(cleanedAddress).includes(normalize(city))) return cleanedAddress;
    return [cleanedAddress, city].filter(Boolean).join(", ");
  }

  function extractLabeledValue(lines, labels) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const normalizedLine = normalize(line);
      const label = labels.find((candidate) => normalizedLine === normalize(candidate) || normalizedLine.startsWith(`${normalize(candidate)} `));
      if (!label) continue;
      const sameLine = clean(line.replace(new RegExp(`^${escapeRegExp(label)}\\s*[:#-]?\\s*`, "i"), ""));
      if (sameLine && normalize(sameLine) !== normalize(label)) return sameLine;
      if (lines[index + 1]) return lines[index + 1];
    }
    return "";
  }

  function extractLabeledDate(lines, labels) {
    for (let index = 0; index < lines.length; index += 1) {
      if (!labels.some((label) => normalize(lines[index]).includes(normalize(label)))) continue;
      const dates = extractDates(`${lines[index]} ${lines[index + 1] || ""}`);
      if (dates.length) return dates[0];
    }
    return "";
  }

  function extractLabeledTime(lines, labels) {
    for (let index = 0; index < lines.length; index += 1) {
      if (!labels.some((label) => normalize(lines[index]).includes(normalize(label)))) continue;
      const times = extractTimes(`${lines[index]} ${lines[index + 1] || ""}`);
      if (times.length) return times[0];
    }
    return "";
  }

  function extractDates(text) {
    const matches = [];
    const isoPattern = /\b(20\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b/g;
    const numericPattern = /\b(0?[1-9]|[12]\d|3[01])[.\/-](0?[1-9]|1[0-2])[.\/-](\d{2}|20\d{2})\b/g;
    const usNumericPattern = /\b(0?[1-9]|1[0-2])[\/-](1[3-9]|2\d|3[01])[\/-](\d{2}|20\d{2})\b/g;
    const monthPattern = /\b(0?[1-9]|[12]\d|3[01])\.?\s+([A-Za-zÀ-ÿ]+)\s+(20\d{2})\b/g;
    const monthFirstPattern = /\b([A-Za-zÀ-ÿ]+)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/g;
    let match;

    while ((match = isoPattern.exec(text))) matches.push(validIsoDate(match[1], match[2], match[3]));
    while ((match = numericPattern.exec(text))) matches.push(validIsoDate(normalizeYear(match[3]), match[2], match[1]));
    while ((match = usNumericPattern.exec(text))) matches.push(validIsoDate(normalizeYear(match[3]), match[1], match[2]));
    while ((match = monthPattern.exec(text))) matches.push(validIsoDate(match[3], monthNumber(match[2]), match[1]));
    while ((match = monthFirstPattern.exec(text))) matches.push(validIsoDate(match[3], monthNumber(match[1]), match[2]));
    return matches.filter(Boolean).sort();
  }

  function extractTimes(text) {
    const matches = [];
    const pattern = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(am|pm|uhr|h)?\b/gi;
    let match;
    while ((match = pattern.exec(text))) {
      let hour = Number(match[1]);
      const marker = clean(match[3]).toLowerCase();
      if (marker === "pm" && hour < 12) hour += 12;
      if (marker === "am" && hour === 12) hour = 0;
      matches.push(`${String(hour).padStart(2, "0")}:${match[2]}`);
    }
    return unique(matches);
  }

  function monthNumber(name) {
    const key = normalize(name);
    const months = {
      januar: 1, january: 1, janvier: 1, jan: 1,
      februar: 2, february: 2, fevrier: 2, feb: 2,
      marz: 3, march: 3, mars: 3, mar: 3,
      april: 4, avril: 4, apr: 4,
      mai: 5, may: 5,
      juni: 6, june: 6, juin: 6, jun: 6,
      juli: 7, july: 7, juillet: 7, jul: 7,
      august: 8, aout: 8, aug: 8,
      september: 9, septembre: 9, sep: 9, sept: 9,
      oktober: 10, october: 10, octobre: 10, oct: 10, okt: 10,
      november: 11, novembre: 11, nov: 11,
      dezember: 12, december: 12, decembre: 12, dec: 12, dez: 12,
    };
    return months[key] || 0;
  }

  function normalizeYear(year) {
    const value = Number(year);
    return value < 100 ? 2000 + value : value;
  }

  function validIsoDate(year, month, day) {
    const values = [Number(year), Number(month), Number(day)];
    if (values.some((value) => !Number.isInteger(value)) || values[1] < 1 || values[1] > 12) return "";
    const date = new Date(Date.UTC(values[0], values[1] - 1, values[2]));
    if (date.getUTCFullYear() !== values[0] || date.getUTCMonth() !== values[1] - 1 || date.getUTCDate() !== values[2]) return "";
    return `${values[0]}-${String(values[1]).padStart(2, "0")}-${String(values[2]).padStart(2, "0")}`;
  }

  function extractAddressDetails(lines) {
    const labels = ["veranstaltungsort", "adresse", "address", "venue", "location", "lieu", "adres"];
    const labeledIndex = lines.findIndex((line) => {
      const normalizedLine = normalize(line);
      return labels.some((label) => normalizedLine === normalize(label) || normalizedLine.startsWith(`${normalize(label)} `));
    });
    const streetValue = lines.find(looksLikeStreetAddressLine) || "";
    let value = labeledIndex >= 0
      ? lines[labeledIndex]
      : streetValue;
    if (labeledIndex >= 0 && streetValue && !extractStreetAddressCandidate(value)) {
      value = streetValue;
    }
    const valueIndex = value ? lines.findIndex((line) => line === value) : -1;

    if (value.includes("(") && !value.includes(")") && labeledIndex >= 0) {
      for (let index = labeledIndex + 1; index < Math.min(lines.length, labeledIndex + 4); index += 1) {
        value += ` ${lines[index]}`;
        if (lines[index].includes(")")) break;
      }
    }

    if (value && !/\b\d{4,6}\b/.test(value) && valueIndex >= 0) {
      const nextPostalLine = lines.slice(valueIndex + 1, valueIndex + 4).find((line) => /^\d{4,6}\s+\S/.test(line));
      if (nextPostalLine) value = `${value}, ${nextPostalLine}`;
    }

    return splitAddressExtra(value);
  }

  function looksLikeStreetAddressLine(line) {
    const value = clean(line);
    return Boolean(
      value
      && /\d/.test(value)
      && !isAddressNoiseLine(value)
      && extractStreetAddressCandidate(value)
    );
  }

  function isAddressNoiseLine(line) {
    const normalizedLine = normalize(line);
    if (/(contact form|contact-form|translation revision|revision date|glotpress|plural forms|locale data|wp json|wp-|stylesheet|script|function|generator|namespace|domain messages)/i.test(normalizedLine)) return true;
    if (/[{}[\]";]/.test(line) && !/\b(?:straße|strasse|street|road|rue|avenue|laan|weg|boulevard|chaussée|chaussee|place|plein|square|quai|gasse|platz|allee|ring|damm|ufer)\b/i.test(line)) return true;
    return false;
  }

  function splitAddressExtra(value) {
    const withoutLabel = clean(value)
      .replace(/^(?:veranstaltungsort|adresse|address|venue|location|lieu|adres)\s*[:#-]?\s*/i, "")
      .replace(/^[^0-9A-Za-zÀ-ÿ]+/, "")
      .replace(/\s*\(?view map\)?\s*$/i, "")
      .replace(/(\d{1,3})([1-9]\d{4}\s+[A-Za-zÀ-ÿ])/g, "$1, $2");
    const streetMatch = extractStreetAddressCandidate(withoutLabel);
    const cleanedAddress = streetMatch ? cleanStreetAddress(streetMatch) : (isAddressNoiseLine(withoutLabel) ? "" : withoutLabel);
    const trailingText = streetMatch ? clean(withoutLabel.slice(withoutLabel.indexOf(streetMatch) + streetMatch.length)) : "";
    const trailingNote = trailingText.match(/\(([^)]{2,160})\)/)?.[1] || "";
    if (trailingNote) {
      return { address: cleanedAddress, note: clean(trailingNote) };
    }
    const noteStart = cleanedAddress.indexOf("(");
    if (noteStart < 0) return { address: cleanedAddress, note: "" };
    return {
      address: clean(cleanedAddress.slice(0, noteStart)),
      note: clean(cleanedAddress.slice(noteStart + 1).replace(/\)+\s*$/, "")),
    };
  }

  function extractStreetAddressCandidate(value) {
    const text = clean(value).replace(/\s*\(?view map\)?\s*/i, " ");
    const germanStreet = text.match(/\b[A-Za-zÀ-ÿ0-9 .'/-]{0,60}?(?:straße|strasse|street|road|weg|gasse|platz|allee|ring|damm|ufer|chaussee)\s+\d+[A-Za-z]?(?:\s*[-/]\s*\d+[A-Za-z]?)?(?:\s*,?\s*\d{4,6}\s+[A-Za-zÀ-ÿ.'-]+(?:\s+[A-Za-zÀ-ÿ.'-]+){0,2})?/i);
    if (germanStreet) return trimStreetCandidatePrefix(germanStreet[0]);

    const latinStreet = text.match(/\b(?:\d+\s+)?(?:rue|avenue|laan|boulevard|chaussée|chaussee|place|plein|square|quai)\s+[A-Za-zÀ-ÿ0-9 .'/-]{2,80}?\s+\d+[A-Za-z]?(?:\s*[-,]\s*\d{4,6}\s+[A-Za-zÀ-ÿ.'-]+(?:\s+[A-Za-zÀ-ÿ.'-]+){0,2})?/i)
      || text.match(/\b\d+\s+(?:rue|avenue|laan|boulevard|chaussée|chaussee|place|plein|square|quai)\s+[A-Za-zÀ-ÿ0-9 .'/-]{2,90}(?:,\s*[A-Za-zÀ-ÿ.'-]+){0,2}\s+\d{4,6}/i);
    if (latinStreet) return trimStreetCandidatePrefix(latinStreet[0]);

    const northAmericanStreet = text.match(/\b\d+\s+(?:bd|boul\.?|blvd\.?|boulevard|av\.?|ave\.?|avenue|street|st\.?|road|rd\.?)\s+[A-Za-zÀ-ÿ0-9 .'/-]{2,90},\s*[A-Za-zÀ-ÿ.'-]+,\s*(?:QC|Quebec|Québec|ON|Ontario|BC|AB)\s*[A-Z]\d[A-Z]\s*\d[A-Z]\d/i)
      || text.match(/\b\d+\s+(?:bd|boul\.?|blvd\.?|boulevard|av\.?|ave\.?|avenue|street|st\.?|road|rd\.?)\s+[A-Za-zÀ-ÿ0-9 .'/-]{2,90}(?:,\s*[A-Za-zÀ-ÿ.'-]+){0,2}(?:,\s*(?:QC|Quebec|Québec|ON|Ontario|BC|AB)\s*[A-Z]\d[A-Z]\s*\d[A-Z]\d)?/i);
    return northAmericanStreet ? trimStreetCandidatePrefix(northAmericanStreet[0]) : "";
  }

  function trimStreetCandidatePrefix(value) {
    const text = clean(value);
    const match = text.match(/[A-Za-zÀ-ÿ.'-]+(?:straße|strasse|street|road|weg|gasse|platz|allee|ring|damm|ufer|chaussee)\s+\d/i)
      || text.match(/(?:\d+\s+)?(?:rue|avenue|laan|boulevard|chaussée|chaussee|place|plein|square|quai)\s+/i)
      || text.match(/\d+\s+(?:bd|boul\.?|blvd\.?|boulevard|av\.?|ave\.?|avenue|street|st\.?|road|rd\.?)\s+/i);
    return match && match.index > 0 ? clean(text.slice(match.index)) : text;
  }

  function cleanStreetAddress(value) {
    return clean(value)
      .replace(/^([A-ZÄÖÜ][a-zäöüß]+)(?=[A-ZÄÖÜ][A-Za-zÀ-ÿ.'-]*(?:straße|strasse|street|road|weg|gasse|platz)\b)/, "")
      .replace(/^(?:.*?\b(?:adresse|address|veranstaltungsort|venue|location|lieu|adres|kontakt|contact)\s*)\b(?=[A-Za-zÀ-ÿ.'-]+(?:straße|strasse|street|road|weg|gasse|platz|allee|ring|damm|ufer|chaussee)\s+\d)/i, "")
      .replace(/\s+-\s+(\d{4,6}\s+[A-Za-zÀ-ÿ.'-]+)/, ", $1")
      .replace(/(\d+[A-Za-z]?)\s+(\d{4,6}\s+[A-Za-zÀ-ÿ.'-]+(?:\s+[A-Za-zÀ-ÿ.'-]+){0,2})/, "$1, $2")
      .replace(/\s+(?:du hast|you can|anfahrt|parking|parken|kontakt|contact|fragen|preise|opening|offnungszeiten|öffnungszeiten|legal|terms|made with|follow us|phone|telefon|©)\b.*$/i, "")
      .replace(/\s*,?\s*$/, "");
  }

  function extractImportantBookingNotes(lines, addressNote = "") {
    const notes = [];
    if (addressNote) notes.push(`Adresshinweis: ${addressNote}`);
    lines.forEach((line, index) => {
      const normalizedLine = normalize(line);
      const important = /^(wichtiger hinweis|hinweis|important|please note|achtung|treffpunkt|meeting point|parking|parken|zugang|eingang|entrance|anreise|arrival instructions|participants|teilnehmer|booking number|booking reference|buchungsnummer|gesamtpreis|total price|amount paid|bezahlt|stornierung|cancellation)\b/.test(normalizedLine)
        || /(arrive|erscheinen|kommen)\s+\d+\s*(minutes|minuten)\s+(early|fruher)/.test(normalizedLine);
      if (!important) return;
      let note = line;
      if (/[:#-]\s*$/.test(line) && lines[index + 1]) note += ` ${lines[index + 1]}`;
      notes.push(clean(note));
    });
    return unique(notes).slice(0, 6).join("\n");
  }

  function extractBestBookingLink(text) {
    const urls = [...text.matchAll(/https?:\/\/[^\s<>"']+/gi)]
      .map((match) => match[0].replace(/[),.;]+$/, ""))
      .filter((url) => !/(google\.|maps\.|facebook\.|instagram\.|mailto|unsubscribe|abmelden)/i.test(url));
    return urls[0] || "";
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
