import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("src/app.js", "utf8")
  .replace("function render() {", "function render() { return;")
  .replace("function renderPreservingScroll() {", "function renderPreservingScroll() { return;")
  .replace("function queueCloudSave() {", "function queueCloudSave() { return;")
  .replace("function queueGoogleSheetsSync() {", "function queueGoogleSheetsSync() { return;")
  .replace(/\}\(\)\);\s*$/, `window.test = {
    cloud, saveData, saveCloudState, loadCloudState, applyCloudPayload, restoreLocalTrips,
    getData: () => data, setData: (value) => { data = normalizeData(value); },
    pending: () => localDirty, persistLocalState,
  };}());`);

const copy = (value) => JSON.parse(JSON.stringify(value));
const seed = { version: 2, members: ["Sebi", "Elisa", "Lara", "Nikolai", "Ari"],
  played: [], wishList: [], trips: [], other: [], regionPresets: [], planningLinks: {} };
const base = { ...seed, trips: [{ id: "trip-1", name: "Trip", startDate: "2026-10-09", endDate: "2026-10-10",
  items: [], planItems: [], expenses: [] }] };

function client(storage = new Map()) {
  const context = { window: {
    location: { search: "", href: "https://app.test/" },
    T2E_CONFIG: { teamId: "team", supabaseUrl: "https://db.test", supabaseAnonKey: "public" },
    T2E_SEED_DATA: copy(seed), setTimeout: () => 1, clearTimeout: () => {},
    T2E_PLANNING_DATA: { sources: {}, terpeca: [], escaperoomers: [] },
  }, document: { getElementById: () => ({}), addEventListener: () => {} },
  localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
  console, URL, URLSearchParams, Date, Intl, Math, JSON, Map, Set, AbortController };
  vm.runInNewContext(source, context);
  return { ...context.window.test, storage };
}

function database(initial = base) {
  let revision = 1;
  let row = { payload: copy(initial), updated_at: `2026-10-06T10:00:00.${String(revision).padStart(6, "0")}Z` };
  let hold = null;
  return {
    get row() { return copy(row); },
    set payload(payload) { row = { payload: copy(payload), updated_at: `2026-10-06T10:00:00.${String(++revision).padStart(6, "0")}Z` }; },
    holdNextAck() {
      let release; let arrived;
      const promise = new Promise((resolve) => { release = resolve; });
      const reached = new Promise((resolve) => { arrived = resolve; });
      hold = { promise, arrived };
      return { release, reached };
    },
    from() {
      let update;
      let expected;
      const query = {
        select() { return query; },
        eq(field, value) { if (field === "updated_at") expected = value; return query; },
        update(value) { update = value; return query; },
        async single() { return { data: copy(row), error: null }; },
        async maybeSingle() {
          if (expected !== row.updated_at) return { data: null, error: null };
          row = { ...copy(update), updated_at: `2026-10-06T10:00:00.${String(++revision).padStart(6, "0")}Z` };
          const ack = copy(row);
          const waiting = hold; hold = null;
          if (waiting) { waiting.arrived(); await waiting.promise; }
          return { data: ack, error: null };
        },
      };
      return query;
    },
  };
}

const db = database();
const a = client();
const b = client();
a.cloud.client = db; b.cloud.client = db;
await a.loadCloudState(); await b.loadCloudState();
a.getData().trips[0].name = "Geplanter Trip"; a.saveData();
b.getData().trips[0].expenses.push({ id: "expense-b", title: "Unterkunft", amount: 300, payer: "Elisa", participants: seed.members }); b.saveData();
await Promise.all([a.saveCloudState(), b.saveCloudState()]);
assert.equal(db.row.payload.trips[0].name, "Geplanter Trip");
assert.equal(db.row.payload.trips[0].expenses[0].id, "expense-b");
await a.loadCloudState(true);
assert.equal(a.getData().trips[0].expenses[0].id, "expense-b", "poll must refresh the reader");

const { release, reached } = db.holdNextAck();
a.getData().trips[0].name = "Neuer Name"; a.saveData();
const saving = a.saveCloudState();
await reached;
a.getData().trips[0].expenses.push({ id: "expense-a", title: "Essen", amount: 50, payer: "Lara", participants: seed.members }); a.saveData();
release(); await saving;
assert(a.pending(), "edits during an upload must remain pending");
assert(a.getData().trips[0].expenses.some((expense) => expense.id === "expense-a"));
await a.saveCloudState();
assert(db.row.payload.trips[0].expenses.some((expense) => expense.id === "expense-a"));

const offline = client(); offline.cloud.client = db;
await offline.loadCloudState();
offline.getData().trips.push({ ...copy(base.trips[0]), id: "offline-trip", name: "Offline Trip" }); offline.saveData();
const restarted = client(offline.storage); restarted.cloud.client = db;
assert(restarted.pending(), "pending status must survive restart");
assert(restarted.getData().trips.some((trip) => trip.id === "offline-trip"));
db.payload = { ...db.row.payload, wishList: [{ id: "wish-remote", title: "Remote room", city: "Paris" }] };
await restarted.loadCloudState(); await restarted.saveCloudState();
assert(db.row.payload.trips.some((trip) => trip.id === "offline-trip"));
assert(db.row.payload.wishList.some((room) => room.id === "wish-remote"));
const beforeOldEvent = copy(restarted.getData());
restarted.applyCloudPayload(seed, "2026-10-06T09:00:00.000001Z");
assert.deepEqual(copy(restarted.getData()), beforeOldEvent, "old events cannot undo a newer revision");

const legacy = client(new Map([["tools2escape:v2", JSON.stringify(base)]]));
legacy.cloud.client = database(seed);
await legacy.loadCloudState();
assert.equal(legacy.cloud.recoveryTrips.length, 1, "orphan trip must be offered for recovery");
assert.equal(JSON.parse(legacy.storage.get("tools2escape:recovery:v1")).payload.trips[0].id, "trip-1");
legacy.restoreLocalTrips(); await legacy.saveCloudState();
assert.equal(legacy.cloud.client.row.payload.trips[0].id, "trip-1");

const unavailable = client(new Map([["tools2escape:v2", JSON.stringify(base)]]));
unavailable.cloud.client = { from() { return { select() { return this; }, eq() { return this; }, single() { throw new Error("Failed to fetch"); } }; } };
await unavailable.loadCloudState();
assert.equal(unavailable.getData().trips[0].id, "trip-1");
assert(unavailable.cloud.error.includes("nicht erreichbar"));

const beforeFirstConnection = client(new Map([["tools2escape:v2", JSON.stringify(base)]]));
const firstConnectionDb = database({ ...base, wishList: [{ id: "fresh-wish", title: "Other user's room" }],
  trips: [{ ...copy(base.trips[0]), expenses: [{ id: "fresh-expense", title: "Hotel", amount: 100, payer: "Elisa", participants: seed.members }] }] });
beforeFirstConnection.cloud.client = firstConnectionDb;
beforeFirstConnection.getData().trips[0].name = "Edited before connecting";
beforeFirstConnection.saveData();
await beforeFirstConnection.loadCloudState(); await beforeFirstConnection.saveCloudState();
assert.equal(firstConnectionDb.row.payload.trips[0].name, "Edited before connecting");
assert.equal(firstConnectionDb.row.payload.trips[0].expenses[0].id, "fresh-expense");
assert.equal(firstConnectionDb.row.payload.wishList[0].id, "fresh-wish");

console.log(JSON.stringify({ ok: true, cases: ["two writers", "reader polling", "in-flight edits", "offline restart", "out-of-order event", "orphan recovery", "database unavailable", "edit before connecting"] }));
