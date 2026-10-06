import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("src/app.js", "utf8").replace(
  /\}\(\)\);\s*$/,
  "window.__test = { tripStartForDate, tripPlanStartWaypoints, tripPlanAnalysis, renderTripPlanBucket, renderTripFinalBucket };}());",
);
const context = {
  window: {
    location: { search: "?qa", href: "http://localhost/?qa", pathname: "/", hash: "" },
    history: { replaceState() {} }, T2E_CONFIG: {},
    T2E_SEED_DATA: { version: 2, members: [], played: [], wishList: [], trips: [], other: [], regionPresets: [] },
    T2E_PLANNING_DATA: { sources: {}, terpeca: [], escaperoomers: [] },
  },
  document: { getElementById: () => ({}), addEventListener() {} },
  localStorage: { getItem: () => null, setItem() {} },
  console, URLSearchParams, URL, setTimeout, clearTimeout, Intl,
};
vm.runInNewContext(source, context);
const api = context.window.__test;
const trip = {
  id: "trip", startDate: "2026-10-09", endDate: "2026-10-13",
  items: [
    { id: "start", type: "start", title: "Startadresse", date: "2026-10-09", address: "Home", coords: [50.94, 6.96] },
    { id: "stay", type: "accommodation", title: "Airbnb Paris", date: "2026-10-11", endDate: "2026-10-13", coords: [48.86, 2.43] },
    { id: "home", type: "start", title: "Lari", date: "2026-10-13", address: "Home", coords: [50.94, 6.96] },
  ], planItems: [], expenses: [],
};
const snapshot = JSON.stringify(trip);
assert.equal(api.tripStartForDate(trip, trip.startDate).id, "start");
assert.equal(api.tripStartForDate(trip, trip.endDate), null);
const destination = api.tripPlanStartWaypoints(trip).find((item) => item.isDestination);
assert.equal(destination.title, "Lari");
let analysis = api.tripPlanAnalysis(trip);
assert.equal(analysis.legsByTargetId.get(destination.id).sourceTitle, "Airbnb Paris");
assert.equal(analysis.warningsById.size, 0);
assert.equal(JSON.stringify(trip), snapshot, "Rendering and routing must not mutate shared trip data");

trip.planItems.push({ id: "room", title: "Last Room", date: trip.endDate, time: "23:59", duration: 60, coords: [48.8, 2.3] });
analysis = api.tripPlanAnalysis(trip);
assert.equal(analysis.legsByTargetId.get(destination.id).sourceTitle, "Last Room");
assert.equal(analysis.warningsById.size, 0, "Destination has no artificial deadline at midnight");
for (const render of [api.renderTripPlanBucket, api.renderTripFinalBucket]) {
  const html = render(trip, trip.endDate, "Return day", trip.planItems, analysis);
  assert.ok(html.includes("Zieladresse"));
  assert.ok(!html.includes("<strong>Startadresse</strong>"));
  assert.ok(html.includes("von Last Room - Fahrzeit"));
  assert.ok(html.indexOf("trip-plan-destination-marker") > html.lastIndexOf("Last Room</"), "Destination is last in both calendar modes");
}

const roomCoords = trip.planItems[0].coords;
trip.planItems[0].coords = null;
analysis = api.tripPlanAnalysis(trip);
assert.equal(analysis.legsByTargetId.has(destination.id), false, "Unknown last station must not route from an older station");
trip.planItems[0].coords = roomCoords;

trip.items = trip.items.filter((item) => item.type !== "accommodation");
trip.planItems[0].date = "2026-10-11";
analysis = api.tripPlanAnalysis(trip);
assert.equal(analysis.legsByTargetId.get(destination.id).sourceTitle, "Last Room", "Return-only day uses last previous station");
assert.ok(analysis.routeLegs.some((leg) => leg.targetId === destination.id), "Return leg is present on map");

trip.startDate = trip.endDate;
assert.equal(api.tripPlanStartWaypoints(trip).some((item) => item.isDestination), false, "Single-day start remains a start");
console.log("Trip destination checks passed: accommodation, later room, return-only day, final placement, no shared mutation.");
