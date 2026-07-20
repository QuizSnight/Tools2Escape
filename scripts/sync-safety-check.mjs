import fs from "node:fs";
import vm from "node:vm";

const appSource = fs.readFileSync("src/app.js", "utf8").replace(
  /\}\(\)\);\s*$/,
  "window.__t2eTest = { normalizeData, mergeSharedData };}());",
);

const storage = new Map();
const seed = {
  version: 2,
  sourceFile: "",
  importedAt: "",
  members: ["Sebi", "Elisa", "Lara", "Nikolai", "Ari"],
  played: [],
  wishList: [],
  trips: [],
  other: [],
  regionPresets: [],
  planningLinks: {},
};

const context = {
  window: {
    location: { search: "?qa", href: "http://localhost/?qa", pathname: "/", hash: "" },
    history: { replaceState: () => {} },
    T2E_SEED_DATA: seed,
    T2E_CONFIG: {},
    T2E_PLANNING_DATA: { sources: {}, terpeca: [], escaperoomers: [] },
  },
  document: { getElementById: () => ({}), addEventListener: () => {} },
  localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
  },
  console,
  URLSearchParams,
  URL,
  setTimeout,
  clearTimeout,
  Math,
  Date,
  Intl,
  JSON,
  Number,
  String,
  Boolean,
  Array,
  Object,
  Map,
  Set,
};

vm.runInNewContext(appSource, context);

const { normalizeData, mergeSharedData } = context.window.__t2eTest;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function basePayload() {
  return normalizeData({
    version: 2,
    members: seed.members,
    played: [{
      id: "room-1",
      title: "Parallel Room",
      provider: "Provider",
      city: "Paris",
      ratings: Object.fromEntries(seed.members.map((member) => [member, null])),
      playedBy: [],
    }],
    wishList: [{ id: "wish-1", title: "Paris A", provider: "Provider A", city: "Paris", country: "Frankreich" }],
    trips: [{
      id: "trip-1",
      name: "Belgien Frankreich",
      startDate: "2026-10-09",
      endDate: "2026-10-10",
      items: [],
      planItems: [{
        id: "plan-1",
        sourceType: "wish",
        sourceId: "wish-1",
        title: "Paris A",
        provider: "Provider A",
        city: "Paris",
        country: "Frankreich",
        date: "2026-10-09",
        time: "15:00",
        duration: 90,
      }],
      expenses: [],
    }],
    other: [],
    regionPresets: [],
    planningLinks: {},
  });
}

function testMemberRatingMerge() {
  const base = basePayload();
  const local = normalizeData({
    ...base,
    played: base.played.map((room) => ({
      ...room,
      ratings: { ...room.ratings, Sebi: 8 },
      playedBy: ["Sebi"],
    })),
  });
  const remote = normalizeData({
    ...base,
    played: base.played.map((room) => ({
      ...room,
      ratings: { ...room.ratings, Lara: 9 },
      playedBy: ["Lara"],
    })),
  });

  const merged = mergeSharedData(base, remote, local);
  const room = merged.played.find((entry) => entry.id === "room-1");
  assert(room.ratings.Sebi === 8, "local member rating lost");
  assert(room.ratings.Lara === 9, "remote member rating lost");
  assert(room.playedBy.includes("Sebi") && room.playedBy.includes("Lara"), "playedBy members lost");
  assert(room.average === 8.5, "merged average not recalculated");
}

function testTripAndExpenseMerge() {
  const base = basePayload();
  const local = normalizeData({
    ...base,
    trips: base.trips.map((trip) => ({
      ...trip,
      planItems: trip.planItems.map((item) => ({ ...item, time: "16:30" })).concat({
        id: "plan-2",
        sourceType: "planning",
        sourceId: "source-2",
        title: "Brussels Room",
        provider: "Provider B",
        city: "Brussel",
        country: "Belgien",
        date: "2026-10-10",
        time: "12:00",
        duration: 60,
      }),
    })),
  });
  const remote = normalizeData({
    ...base,
    wishList: base.wishList.concat({ id: "wish-2", title: "Paris B", provider: "Provider B", city: "Paris", country: "Frankreich" }),
    trips: base.trips.map((trip) => ({
      ...trip,
      expenses: [{
        id: "expense-1",
        title: "Unterkunft",
        amount: 300,
        payer: "Elisa",
        participants: seed.members,
        date: "2026-10-09",
      }],
    })),
  });

  const merged = mergeSharedData(base, remote, local);
  const trip = merged.trips.find((entry) => entry.id === "trip-1");
  assert(merged.wishList.some((entry) => entry.id === "wish-2"), "remote up-next entry lost");
  assert(trip.planItems.some((entry) => entry.id === "plan-2"), "local plan item lost");
  assert(trip.planItems.find((entry) => entry.id === "plan-1").time === "16:30", "local trip time lost");
  assert(trip.expenses.some((entry) => entry.id === "expense-1"), "remote tricount expense lost");
}

function testDuplicatePlanSourceMerge() {
  const base = basePayload();
  const local = normalizeData({
    ...base,
    trips: base.trips.map((trip) => ({
      ...trip,
      planItems: trip.planItems.concat({
        id: "plan-local",
        sourceType: "wish",
        sourceId: "wish-duplicate",
        title: "Same Room",
        provider: "Provider",
        city: "Paris",
        country: "Frankreich",
      }),
    })),
  });
  const remote = normalizeData({
    ...base,
    trips: base.trips.map((trip) => ({
      ...trip,
      planItems: trip.planItems.concat({
        id: "plan-remote",
        sourceType: "wish",
        sourceId: "wish-duplicate",
        title: "Same Room",
        provider: "Provider",
        city: "Paris",
        country: "Frankreich",
      }),
    })),
  });

  const merged = mergeSharedData(base, remote, local);
  const trip = merged.trips.find((entry) => entry.id === "trip-1");
  assert(trip.planItems.filter((entry) => entry.sourceId === "wish-duplicate").length === 1, "duplicate plan source was not merged");
}

testMemberRatingMerge();
testTripAndExpenseMerge();
testDuplicatePlanSourceMerge();

console.log(JSON.stringify({ ok: true }));
