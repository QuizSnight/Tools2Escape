import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import net from "node:net";

const workspace = process.cwd();
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = Number(process.env.CDP_PORT || 9300 + Math.floor(Math.random() * 500));
const qaDir = path.join(workspace, "qa");
const workspaceUrl = `file:///${workspace.replace(/\\/g, "/")}/`;
const qaIndexPath = path.join(qaDir, "index.html");
const fileUrl = `file:///${qaIndexPath.replace(/\\/g, "/")}?qa`;
const ocrFixture = process.env.T2E_OCR_FIXTURE || "";
let browserLog = "";

process.on("uncaughtException", (error) => {
  console.error(error);
  if (browserLog) console.error(browserLog);
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  console.error(error);
  if (browserLog) console.error(browserLog);
  process.exit(1);
});

await fs.mkdir(qaDir, { recursive: true });
await fs.writeFile(qaIndexPath, await createQaIndexHtml());
const pdfFixture = process.env.T2E_PDF_FIXTURE || path.join(qaDir, "booking-test.pdf");
if (!process.env.T2E_PDF_FIXTURE) {
  await fs.writeFile(pdfFixture, createSimplePdf([
    "Escape Rush",
    "Escape Rush",
    "Your booking is confirmed!",
    "Tokyo Lab",
    "Saturday, 28 October 2023",
    "19:45 - 20:55",
  "Veranstaltungsort: Armin-T.-Wegner-Platz 3, 42103 Wuppertal (links neben der Kirche)",
  ]));
}
const profileDir = await fs.mkdtemp(path.join(qaDir, "edge-profile-"));

const edge = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-gpu-compositing",
  "--disable-gpu-rasterization",
  "--disable-features=Vulkan,DefaultANGLEVulkan,VulkanFromANGLE,DawnGraphite,UseSkiaRenderer",
  "--use-angle=swiftshader",
  "--use-gl=swiftshader",
  "--disable-dev-shm-usage",
  "--no-sandbox",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-allow-origins=*",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1440,1000",
  fileUrl,
], { stdio: ["ignore", "pipe", "pipe"] });

edge.stdout.on("data", (chunk) => {
  browserLog += chunk.toString();
});
edge.stderr.on("data", (chunk) => {
  browserLog += chunk.toString();
});

const failures = [];
const screenshots = [];

try {
  const target = await waitForTarget(port);
  const cdp = await connectCdp(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await waitForApp(cdp);

  await assertEval(cdp, "document.title", (value) => value === "Tools2EscApp", "document title");
  await assertEval(
    cdp,
    "document.querySelector('h1')?.textContent === 'Tools2EscApp' && Boolean(document.querySelector('.brand-logo')) && !document.querySelector('.eyebrow') && !document.body.textContent.includes('Escape Tracker') && Array.from(document.querySelectorAll('[data-view]')).map((button) => button.textContent).join('|') === 'Gespielt|Up Next|Trips|TERPECA & ER|Karte|Statistik'",
    Boolean,
    "single app heading with logo",
  );
  await assertEval(
    cdp,
    "!document.querySelector('[data-export-excel]') && !document.body.textContent.includes('Excel exportieren') && !document.body.textContent.includes('Online')",
    Boolean,
    "header has no export action or online badge",
  );
  await assertEval(
    cdp,
    "document.querySelectorAll('.room-card').length === window.T2E_SEED_DATA.played.length",
    Boolean,
    "played cards count",
  );
  await assertEval(
    cdp,
    "document.querySelector('.kpi strong').textContent === String(window.T2E_SEED_DATA.played.length)",
    Boolean,
    "played KPI",
  );
  await assertEval(cdp, "document.querySelectorAll('.played-kpis .kpi').length", (value) => value === 2, "played KPI count");
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('#region-filter option')).map((option) => option.textContent.replace(/ \\(\\d+\\)$/, '')).join('|')",
    (value) => value === "Alle|DE|Athen|NRW|Hamburg (HH)|BeNeLux|Spanien|Polen|Ungarn|Tschechien|Frankreich|Irland|UK|Portugal|Italien|Finnland|Kroatien",
    "region filter preset options only",
  );
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('#region-filter option')).find((option) => option.textContent.startsWith('DE'))?.textContent",
    (value) => value === "DE (192)",
    "germany city count",
  );
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('#region-filter option')).find((option) => option.textContent.startsWith('NRW'))?.textContent",
    (value) => value === "NRW (138)",
    "nrw city count",
  );
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('#region-filter option')).find((option) => option.textContent.startsWith('Hamburg'))?.textContent",
    (value) => value === "Hamburg (HH) (17)",
    "hamburg state region count",
  );
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('#region-filter option')).find((option) => option.textContent.startsWith('BeNeLux'))?.textContent",
    (value) => value === "BeNeLux (29)",
    "benelux dynamic city count",
  );
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('#region-filter option')).find((option) => option.textContent.startsWith('Spanien'))?.textContent",
    (value) => value === "Spanien (16)",
    "spain dynamic city count",
  );
  await assertEval(
    cdp,
    "['Polen (9)', 'Ungarn (9)', 'Tschechien (5)', 'Frankreich (5)', 'Irland (4)', 'UK (4)', 'Portugal (3)', 'Italien (2)', 'Finnland (1)', 'Kroatien (1)'].every((label) => Array.from(document.querySelectorAll('#region-filter option')).some((option) => option.textContent === label))",
    Boolean,
    "additional country region counts",
  );
  await assertEval(cdp, "document.querySelector('#played-search').placeholder", (value) => value === "Raum, Anbieter, Stadt", "played search placeholder");

  await screenshot(cdp, path.join(qaDir, "desktop.png"));

  await evalPage(cdp, `
    document.querySelector('#played-search').focus();
    document.querySelector('#played-search').value = 'Dark ';
    document.querySelector('#played-search').dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await assertEval(cdp, "document.activeElement.id", (value) => value === "played-search", "played search keeps focus");
  await assertEval(cdp, "document.querySelector('#played-search').value", (value) => value === "Dark ", "played search keeps spaces");
  await evalPage(cdp, `
    document.querySelector('#played-search').value = 'Mollys';
    document.querySelector('#played-search').dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await assertEval(cdp, "document.querySelectorAll('.room-card').length", (value) => value === 1, "played search filter");
  await evalPage(cdp, `
    document.querySelector('#played-search').value = '';
    document.querySelector('#played-search').dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await evalPage(cdp, `
    document.querySelector('[data-member-filter="Sebi"]').click();
    document.querySelector('[data-member-filter="Lara"]').click();
    document.querySelector('[data-member-filter="Ari"]').click();
  `);
  await assertEval(
    cdp,
    "document.querySelectorAll('.room-card').length > 0 && document.querySelectorAll('.room-card').length < window.T2E_SEED_DATA.played.length",
    Boolean,
    "multi member played-by filter",
  );
  await evalPage(cdp, "document.querySelector('[data-member-filter=\"team\"]').click()");

  await evalPage(cdp, "document.querySelector('[data-open-room]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('#room-form'))", Boolean, "room modal opens");
  await assertEval(
    cdp,
    "document.querySelectorAll('[name=\"difficulty\"]').length === 5 && document.querySelectorAll('[name=\"scare\"]').length === 6 && document.querySelectorAll('[name=\"rating-base-Sebi\"]').length === 10 && Boolean(document.querySelector('[name=\"unrated-Sebi\"]'))",
    Boolean,
    "room modal uses button controls",
  );
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");

  await evalPage(cdp, "document.querySelector('[data-view=\"planning\"]').click(); document.querySelector('#planning-status').value = 'all'; document.querySelector('#planning-status').dispatchEvent(new Event('change', { bubbles: true }));");
  await assertEval(cdp, "document.querySelectorAll('.planning-room').length === 100 && document.querySelector('#planning-source').value === 'terpeca'", Boolean, "TERPECA top 100 renders");
  await assertEval(cdp, "Array.from(document.querySelectorAll('#planning-status option')).every((option) => /\\(\\d+\\)$/.test(option.textContent))", Boolean, "planning status filters show counts");
  await assertEval(
    cdp,
    "(() => { const card = Array.from(document.querySelectorAll('.planning-room')).find((node) => node.textContent.includes('Kuriosum: Artifact of Darkness')); return card?.querySelector('.planning-state')?.textContent === 'Gespielt'; })()",
    Boolean,
    "TERPECA alternate title matches played room",
  );
  await assertEval(
    cdp,
    "(() => { const card = Array.from(document.querySelectorAll('.planning-room')).find((node) => node.textContent.includes(\"Molly's Game\")); return card?.querySelector('.planning-state')?.textContent === 'Gespielt'; })()",
    Boolean,
    "TERPECA apostrophe title matches played room",
  );
  await evalPage(cdp, "document.querySelector('#planning-source').value = 'escaperoomers'; document.querySelector('#planning-source').dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#planning-status').value = 'all'; document.querySelector('#planning-status').dispatchEvent(new Event('change', { bubbles: true }));");
  await assertEval(cdp, "document.querySelectorAll('.planning-room').length === window.T2E_PLANNING_DATA.escaperoomers.length && Array.from(document.querySelectorAll('.planning-rank strong')).every((node) => Number(node.textContent) <= 20) && document.querySelectorAll('#planning-region option').length > 40", Boolean, "EscapeRoomers regional top 20 renders");
  await screenshot(cdp, path.join(qaDir, "planning-desktop.png"));
  await evalPage(cdp, `
    (() => {
      window.__qaManualPlanningCard = Array.from(document.querySelectorAll('.planning-room')).find((card) => card.querySelector('.planning-state')?.textContent !== 'Gespielt');
      window.__qaManualPlanningTitle = window.__qaManualPlanningCard?.querySelector('h2')?.textContent || '';
      window.__qaManualPlanningCard?.querySelector('[data-planning-link]')?.click();
      const form = document.querySelector('#planning-link-form');
      const search = form.querySelector('#planning-link-search');
      search.value = 'Secret';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      window.__qaPlanningLinkSearchCount = Array.from(form.querySelectorAll('#planning-link-select option')).filter((option) => !option.disabled).length;
      form.querySelector('[name="playedRoomId"]').value = window.T2E_SEED_DATA.played.find((room) => room.title === 'Secret Subway').id;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(cdp, "window.__qaPlanningLinkSearchCount > 0 && window.__qaPlanningLinkSearchCount < window.T2E_SEED_DATA.played.length", Boolean, "manual planning link search filters played rooms");
  await assertEval(cdp, "(() => { const card = Array.from(document.querySelectorAll('.planning-room')).find((node) => node.querySelector('h2')?.textContent === window.__qaManualPlanningTitle); return card?.querySelector('.planning-state')?.textContent === 'Gespielt'; })()", Boolean, "manual planning link marks source room as played");
  await evalPage(cdp, "Array.from(document.querySelectorAll('.planning-room')).find((node) => node.querySelector('h2')?.textContent === window.__qaManualPlanningTitle).querySelector('[data-planning-link]').click(); document.querySelector('[data-remove-planning-link]').click();");
  await assertEval(cdp, "(() => { const card = Array.from(document.querySelectorAll('.planning-room')).find((node) => node.querySelector('h2')?.textContent === window.__qaManualPlanningTitle); return card?.querySelector('.planning-state')?.textContent !== 'Gespielt'; })()", Boolean, "manual planning link can be removed");
  await evalPage(cdp, "window.__qaPlanningWishTitle = document.querySelector('[data-planning-upnext]').closest('.planning-room').querySelector('h2').textContent; document.querySelector('[data-planning-upnext]').click(); document.querySelector('[data-view=\"upnext\"]').click();");
  await assertEval(cdp, "Array.from(document.querySelectorAll('.wish-card h2')).some((node) => node.textContent === window.__qaPlanningWishTitle)", Boolean, "planning room can be added to up next");
  await evalPage(cdp, "window.confirm = () => true; Array.from(document.querySelectorAll('.wish-card')).find((card) => card.querySelector('h2').textContent === window.__qaPlanningWishTitle).querySelector('[data-delete-wish]').click();");
  await assertEval(cdp, "document.querySelectorAll('.wish-card').length === 35", Boolean, "planning up next action can be cleaned up");

  await evalPage(cdp, "document.querySelector('[data-view=\"upnext\"]').click()");
  await assertEval(cdp, "document.querySelectorAll('.wish-card').length", (value) => value === 35, "up next cards count");
  await assertEval(cdp, "document.querySelector('[data-open-wish]')?.textContent", (value) => value === "Geplanten Raum ergänzen", "up next add button label");
  await evalPage(cdp, "document.querySelector('[data-open-wish]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('#wish-form'))", Boolean, "wish modal opens");
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-open-wish]').click();
      const form = document.querySelector('#wish-form');
      form.querySelector('[name="title"]').value = 'QA Trip Room';
      form.querySelector('[name="provider"]').value = 'QA Escape';
      form.querySelector('[name="country"]').value = 'Belgien';
      form.querySelector('[name="city"]').value = 'Brüssel';
      form.querySelector('[name="notes"]').value = 'Info: Dauer 90 Min.; Schauspieler: ja';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-open-wish]').click();
      const form = document.querySelector('#wish-form');
      form.querySelector('[name="title"]').value = 'QA Bulk Room';
      form.querySelector('[name="provider"]').value = 'QA Escape';
      form.querySelector('[name="country"]').value = 'Belgien';
      form.querySelector('[name="city"]').value = 'Brüssel';
      form.querySelector('[name="notes"]').value = 'Info: Dauer 60 Min.';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(cdp, "document.querySelectorAll('.wish-card').length", (value) => value === 37, "qa trip rooms added to up next");

  await evalPage(cdp, "document.querySelector('[data-view=\"trips\"]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('[data-open-trip]'))", Boolean, "trips view renders");
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-open-trip]').click();
      const form = document.querySelector('#trip-form');
      window.__qaTripFormSimple = !form.querySelector('[name="destination"]') && !form.querySelector('[name="notes"]');
      window.__qaTripRangePicker = Boolean(form.querySelector('#trip-date-range')._flatpickr);
      form.querySelector('[name="name"]').value = 'Belgien & Frankreich';
      form.querySelector('#trip-date-range')._flatpickr.setDate(['2026-10-12', '2026-10-15'], true, 'Y-m-d');
      form.querySelector('#trip-date-range')._flatpickr.open();
      return true;
    })()
  `);
  await screenshot(cdp, path.join(qaDir, "trip-range-picker.png"));
  await evalPage(cdp, "document.querySelector('#trip-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))");
  await assertEval(cdp, "document.querySelector('.trip-title-row h2')?.textContent", (value) => value === "Belgien & Frankreich", "trip detail opens after create");
  await assertEval(cdp, "document.querySelectorAll('.trip-kpis .kpi').length === 3", Boolean, "trip overview omits appointment count");
  await assertEval(cdp, "window.__qaTripFormSimple && window.__qaTripRangePicker", Boolean, "trip form only uses name and one range picker");

  await evalPage(cdp, "document.querySelector('[data-view=\"upnext\"]').click(); Array.from(document.querySelectorAll('.wish-card')).find((card) => card.querySelector('h2')?.textContent === 'QA Trip Room').querySelector('[data-plan-wish]').click();");
  await assertEval(cdp, "Boolean(document.querySelector('#plan-candidate-form'))", Boolean, "up next room can be planned as trip candidate");
  await evalPage(cdp, "document.querySelector('#plan-candidate-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))");
  await assertEval(
    cdp,
    "document.querySelector('[data-view=\"upnext\"]').classList.contains('is-active') && !document.querySelector('.trip-plan-card')",
    Boolean,
    "planning a room keeps the current up next view",
  );
  await evalPage(cdp, "window.__qaPlanDuplicateAlert = ''; window.alert = (message) => { window.__qaPlanDuplicateAlert = message; }; Array.from(document.querySelectorAll('.wish-card')).find((card) => card.querySelector('h2')?.textContent === 'QA Trip Room').querySelector('[data-plan-wish]').click(); document.querySelector('#plan-candidate-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));");
  await assertEval(cdp, "window.__qaPlanDuplicateAlert === 'Raum bereits in der Planung enthalten' && Boolean(document.querySelector('#plan-candidate-form'))", Boolean, "duplicate planning shows message and keeps modal open");
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");
  await evalPage(cdp, "document.querySelector('[data-toggle-bulk-plan=\"upnext\"]').click(); Array.from(document.querySelectorAll('.wish-card')).find((card) => card.querySelector('h2')?.textContent === 'QA Bulk Room').querySelector('[data-bulk-plan-checkbox]').click(); document.querySelector('[data-bulk-plan-add]').click();");
  await assertEval(cdp, "document.querySelector('[data-view=\"upnext\"]').classList.contains('is-active') && document.body.textContent.includes('1 Raum wurde zur Planung hinzugefügt')", Boolean, "bulk up next planning stays on current view");
  await evalPage(cdp, "document.querySelector('[data-view=\"trips\"]').click()");
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('.trip-plan-card h4')).some((node) => node.textContent === 'QA Trip Room') && Array.from(document.querySelectorAll('.trip-plan-card h4')).some((node) => node.textContent === 'QA Bulk Room') && Array.from(document.querySelectorAll('.trip-plan-card')).find((card) => card.querySelector('h4')?.textContent === 'QA Trip Room').querySelector('[data-trip-plan-field=\"duration\"]')?.value === '90' && Boolean(document.querySelector('#trip-plan-map'))",
    Boolean,
    "trip planning candidates render with map and automatic duration",
  );
  await assertEval(
    cdp,
    "getComputedStyle(document.querySelector('.trip-plan-layout')).gridTemplateColumns.split(' ').length >= 2 && document.querySelector('.trip-plan-left')?.contains(document.querySelector('#trip-plan-map')) && Boolean(document.querySelector('.trip-plan-calendar'))",
    Boolean,
    "desktop trip planning uses map/open rooms left and calendar right",
  );
  await assertEval(cdp, "getComputedStyle(document.querySelector('.trip-plan-map-shell')).position === 'static'", Boolean, "trip planning map does not stick while scrolling");
  await assertEval(cdp, "window.L ? Array.from(document.querySelectorAll('.leaflet-tooltip')).some((node) => node.textContent.includes('✓')) : true", Boolean, "scheduled trip planning map labels include checkmark");
  await evalPage(cdp, `
    (() => {
      const card = Array.from(document.querySelectorAll('.trip-plan-card')).find((entry) => entry.querySelector('h4')?.textContent === 'QA Trip Room');
      const target = document.querySelector('[data-plan-drop-date="2026-10-13"][data-trip-id]');
      const drop = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(drop, 'dataTransfer', { value: { getData: () => card.dataset.tripId + '|' + card.dataset.planDrag } });
      target.dispatchEvent(drop);
      const moved = Array.from(document.querySelectorAll('.trip-plan-card')).find((entry) => entry.querySelector('h4')?.textContent === 'QA Trip Room');
      window.__qaTripPlanDragged = moved.closest('[data-plan-drop-date]')?.dataset.planDropDate === '2026-10-13';
      moved.querySelector('[data-trip-plan-field="time"]').value = '16:30';
      moved.querySelector('[data-trip-plan-field="time"]').dispatchEvent(new Event('change', { bubbles: true }));
      moved.querySelector('[data-trip-plan-field="duration"]').value = '75';
      moved.querySelector('[data-trip-plan-field="duration"]').dispatchEvent(new Event('change', { bubbles: true }));
      moved.querySelector('[data-plan-to-trip]').click();
      return true;
    })()
  `);
  await assertEval(
    cdp,
    "window.__qaTripPlanDragged && document.querySelector('#trip-item-form [name=\"title\"]')?.value === 'QA Trip Room' && document.querySelector('#trip-item-form [name=\"date\"]')?.value === '2026-10-13' && document.querySelector('#trip-item-form [name=\"time\"]')?.value === '16:30' && document.querySelector('#trip-item-form [name=\"duration\"]')?.value === '75' && !Array.from(document.querySelectorAll('#trip-item-form [name=\"time\"] option')).some((option) => option.value.endsWith(':07'))",
    Boolean,
    "trip planning candidate can be dragged into day and opens scheduled item form",
  );
  await evalPage(cdp, `
    (() => {
      const form = document.querySelector('#trip-item-form');
      form.querySelector('[name="address"]').value = 'Rue Persist 44, 1000 Bruxelles';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(
    cdp,
    "(() => { const card = Array.from(document.querySelectorAll('.trip-plan-card')).find((entry) => entry.querySelector('h4')?.textContent === 'QA Trip Room'); const text = card?.textContent || ''; return card?.textContent.includes('Termin bearbeiten') && card?.textContent.includes('Rue Persist 44') && !/Belgien\\s*·\\s*Belgien/.test(text) && !card.querySelector('.trip-plan-card__head small'); })()",
    Boolean,
    "scheduled trip plan card keeps edited address, edit label and compact location",
  );
  await assertEval(cdp, "(() => { const marker = Array.from(document.querySelectorAll('.trip-plan-stay-marker')).find((node) => node.textContent.includes('Zur Unterkunft')); return Boolean(marker?.querySelector('.route-link--small')) && marker.textContent.includes(' - Ankunft'); })() || !document.querySelector('.trip-plan-stay-marker')", Boolean, "accommodation calendar marker combines route and arrival details");
  await evalPage(cdp, "Array.from(document.querySelectorAll('.trip-plan-card')).find((entry) => entry.querySelector('h4')?.textContent === 'QA Trip Room').querySelector('[data-plan-to-trip]').click()");
  await assertEval(
    cdp,
    "document.querySelector('#trip-item-form [name=\"address\"]')?.value === 'Rue Persist 44, 1000 Bruxelles'",
    Boolean,
    "reopened trip plan appointment keeps edited address",
  );
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");

  await evalPage(cdp, "document.querySelector('[data-view=\"planning\"]').click(); document.querySelector('#planning-status').value = 'unplayed'; document.querySelector('#planning-status').dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('[data-toggle-bulk-plan=\"planning\"]').click(); document.querySelector('.planning-room [data-bulk-plan-checkbox]').click(); document.querySelector('[data-bulk-plan-add]').click();");
  await assertEval(cdp, "document.querySelector('[data-view=\"planning\"]').classList.contains('is-active') && document.body.textContent.includes('Raum wurde zur Planung hinzugefügt')", Boolean, "bulk TERPECA planning stays on current view");
  await evalPage(cdp, `
    (() => {
      document.querySelector('#planning-status').value = 'upnext';
      document.querySelector('#planning-status').dispatchEvent(new Event('change', { bubbles: true }));
      window.__qaPlanningUpNextTitle = document.querySelector('.planning-room h2')?.textContent || '';
      document.querySelector('#planning-status').value = 'unplayed';
      document.querySelector('#planning-status').dispatchEvent(new Event('change', { bubbles: true }));
      window.__qaPlanningStatusOptions = Array.from(document.querySelectorAll('#planning-status option')).map((option) => option.textContent).join('|');
      return true;
    })()
  `);
  await assertEval(
    cdp,
    "window.__qaPlanningStatusOptions.includes('Noch nicht gespielt') && (!window.__qaPlanningUpNextTitle || Array.from(document.querySelectorAll('.planning-room h2')).some((node) => node.textContent === window.__qaPlanningUpNextTitle))",
    Boolean,
    "unplayed planning status keeps up next rooms visible",
  );

  await evalPage(cdp, "document.querySelector('[data-view=\"map\"]').click(); document.querySelector('#map-source').value = 'wish'; document.querySelector('#map-source').dispatchEvent(new Event('change', { bubbles: true }));");
  await assertEval(cdp, "Boolean(document.querySelector('.map-room [data-plan-wish]')) && Boolean(document.querySelector('.map-room [data-wish-trip]'))", Boolean, "map up next rooms expose planning actions");
  await evalPage(cdp, "document.querySelector('.map-room [data-plan-wish]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('#plan-candidate-form'))", Boolean, "map up next planning action opens plan modal");
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click(); document.querySelector('[data-view=\"trips\"]').click();");

  await evalPage(cdp, "document.querySelector('[data-view=\"upnext\"]').click(); Array.from(document.querySelectorAll('.wish-card')).find((card) => card.querySelector('h2')?.textContent === 'QA Trip Room').querySelector('[data-wish-trip]').click();");
  await assertEval(cdp, "Boolean(document.querySelector('#wish-trip-form'))", Boolean, "up next room can be assigned to trip");
  await evalPage(cdp, "document.querySelector('#wish-trip-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))");
  await assertEval(
    cdp,
    "document.querySelector('#trip-item-form [name=\"title\"]')?.value === 'QA Trip Room' && document.querySelector('#trip-item-form [name=\"provider\"]')?.value === 'QA Escape' && document.querySelector('#trip-item-form [name=\"address\"]')?.value.includes('Brüssel') && document.querySelector('#trip-item-form [name=\"duration\"]')?.value === '90'",
    Boolean,
    "up next trip action prefills room details and duration",
  );
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");

  await evalPage(cdp, "document.querySelector('[data-view=\"planning\"]').click(); document.querySelector('#planning-status').value = 'all'; document.querySelector('#planning-status').dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('[data-planning-trip]').click();");
  await assertEval(cdp, "Boolean(document.querySelector('#planning-trip-form'))", Boolean, "planning room can be assigned to trip");
  await evalPage(cdp, "document.querySelector('#planning-trip-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))");
  await assertEval(cdp, "Boolean(document.querySelector('#trip-item-form [name=\"duration\"]')) && document.querySelector('#trip-item-form [name=\"title\"]')?.value", Boolean, "planning trip action prefills room and duration");
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click(); document.querySelector('[data-view=\"trips\"]').click();");

  await evalPage(cdp, `
    new Promise((resolve, reject) => {
      const request = indexedDB.open('tools2escape-share-target', 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('shares')) request.result.createObjectStore('shares', { keyPath: 'id' });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('shares', 'readwrite');
        transaction.objectStore('shares').put({
          id: 'pending',
          title: 'Booking confirmed',
          text: [
            'Escape Rush',
            'Escape Rush',
            'Your booking is confirmed!',
            'Tokyo Lab',
            'Saturday, 28 October 2023',
            '19:45 - 20:55',
            'Address: 30 rue de l automne, Ixelles, Bruxelles 1050'
          ].join('\\n'),
          url: '',
          files: [],
          receivedAt: new Date().toISOString()
        });
        transaction.oncomplete = () => {
          database.close();
          resolve(true);
        };
        transaction.onerror = () => reject(transaction.error);
      };
    })
  `);
  await cdp.send("Page.navigate", { url: `${fileUrl}&share-target=pending` });
  await waitForApp(cdp);
  await evalPage(cdp, `
    new Promise((resolve) => {
      const deadline = Date.now() + 5000;
      const timer = setInterval(() => {
        if (document.querySelector('#trip-share-form') || Date.now() > deadline) {
          clearInterval(timer);
          resolve(true);
        }
      }, 50);
    })
  `);
  await assertEval(cdp, "Boolean(document.querySelector('#trip-share-form')) && document.querySelector('.share-booking-preview')?.textContent.includes('Tokyo Lab')", Boolean, "shared email opens trip import");
  await screenshot(cdp, path.join(qaDir, "trip-share-import.png"));
  await evalPage(cdp, "document.querySelector('#trip-share-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))");
  await assertEval(
    cdp,
    "document.querySelector('#trip-item-form [name=\"title\"]')?.value === 'Tokyo Lab' && document.querySelector('#trip-item-form [name=\"provider\"]')?.value === 'Escape Rush' && document.querySelector('#trip-item-form [name=\"date\"]')?.value === '2023-10-28' && document.querySelector('#trip-item-form [name=\"time\"]')?.value === '19:45' && document.querySelector('#trip-item-form [name=\"duration\"]')?.value === '70' && !document.querySelector('#trip-item-form [name=\"endTime\"]')",
    Boolean,
    "shared email extracts booking details",
  );
  await evalPage(cdp, "document.querySelector('#trip-item-form [data-close-modal]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('#trip-share-form'))", Boolean, "canceling shared review returns to trip selection");
  await cdp.send("Page.navigate", { url: fileUrl });
  await waitForApp(cdp);
  await evalPage(cdp, "document.querySelector('[data-view=\"trips\"]').click(); document.querySelector('[data-open-trip-detail]').click()");

  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-import-room-url]').click();
      const form = document.querySelector('#trip-url-import-form');
      form.querySelector('[name="url"]').value = 'https://example.com/tokyo-lab';
      form.querySelector('[name="sourceText"]').value = [
        '<!doctype html><html><head>',
        '<title>Tokyo Lab - Escape Rush</title>',
        '<meta property="og:site_name" content="Escape Rush">',
        '<meta property="og:title" content="Tokyo Lab">',
        '<script type="application/ld+json">',
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'Tokyo Lab',
          provider: { name: 'Escape Rush' },
          duration: 'PT70M',
          location: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '30 rue de l automne',
              postalCode: '1050',
              addressLocality: 'Ixelles',
              addressCountry: 'Belgium',
            },
          },
        }),
        '</script></head><body>',
        '<h1>Tokyo Lab</h1>',
        '<p>Price for 5 players: 175 EUR</p>',
        '<p>Available times: 10:00 12:15 19:45</p>',
        '</body></html>'
      ].join('\\n');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return new Promise((resolve) => setTimeout(resolve, 150));
    })()
  `);
  await evalPage(cdp, `
    (() => {
      const card = Array.from(document.querySelectorAll('.trip-plan-card')).find((entry) => entry.querySelector('h4')?.textContent === 'Tokyo Lab');
      const date = card?.querySelector('[data-trip-plan-field="date"]');
      if (date) {
        date.value = '2026-10-13';
        date.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    })()
  `);
  await assertEval(
    cdp,
    "(() => { const cards = Array.from(document.querySelectorAll('.trip-plan-card')); const card = cards.find((entry) => entry.querySelector('h4')?.textContent === 'Tokyo Lab'); return { found: Boolean(card), titles: cards.map((entry) => entry.querySelector('h4')?.textContent), text: card?.textContent || '', slots: Array.from(card?.querySelectorAll('[data-trip-slot]') || []).map((button) => button.textContent), date: card?.querySelector('[data-trip-plan-field=\"date\"]')?.value || '' }; })()",
    (value) => value.found && value.text.includes('Escape Rush') && value.text.includes('70 Min.') && value.text.includes('35,00') && value.slots.includes('19:45'),
    "room website import extracts title, price, duration, address and slots into trip planning",
  );
  await assertEval(
    cdp,
    "(() => { const card = Array.from(document.querySelectorAll('.trip-plan-card')).find((entry) => entry.querySelector('h4')?.textContent === 'Tokyo Lab'); return Boolean(card?.querySelector('h4 a.title-link')) && !Array.from(card?.querySelectorAll('.trip-item__actions a') || []).some((link) => /Website/i.test(link.textContent)); })()",
    Boolean,
    "trip planning links website through title only",
  );
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-import-room-url]').click();
      const form = document.querySelector('#trip-url-import-form');
      form.querySelector('[name="url"]').value = 'https://www.adventurerooms-hamburg.de/escape-room/verrueckter-professor/';
      form.querySelector('[name="sourceText"]').value = [
        '<!doctype html><html><head>',
        '<title>100% verrückter Professor | AdventureRooms Hamburg</title>',
        '<meta property="og:site_name" content="AdventureRooms Hamburg | Drei spannende Escape Room Abenteuer mitten in Hamburg">',
        '<meta property="og:title" content="100% verrückter Professor | AdventureRooms Hamburg">',
        '<script type="application/ld+json">',
        JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home' },
                { '@type': 'ListItem', position: 2, name: 'Escape Room Beschreibung' },
                { '@type': 'ListItem', position: 3, name: 'Der verrückte Professor' },
              ],
            },
            {
              '@type': 'WebPage',
              name: '100% verrückter Professor | AdventureRooms Hamburg',
              description: 'Der wohl schwierigste Escape Room hier im Detail.',
            },
            { '@type': 'Organization', name: 'AdventureRooms Hamburg' },
          ],
        }),
        '</script></head><body>',
        '<h1>100% verrückter Professor</h1>',
        '<p>window._wpemojiSettings {"translation-revision-date":"2025-05-24"} wp-google-map-plugin contact form.</p>',
        '<h4>WIE LANGE DAUERT ES?</h4>',
        '<p>Die Standardvariante dauert maximal 60 Min, hinzu kommen je ca. 15 Min Einführung und Nachbesprechung. Spätestens 1h30 nach eurer gebuchten Zeit seid ihr wieder auf freiem Fuss.</p>',
        '<table><tr><td>5 Spieler</td><td>27,50 € pro Spieler</td></tr></table>',
        '<p>AdventureRooms Hamburg<br>Heidenkampsweg 51</p><p>20097 Hamburg</p>',
        '</body></html>'
      ].join('\\n');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return new Promise((resolve) => setTimeout(resolve, 150));
    })()
  `);
  await assertEval(
    cdp,
    "(() => { const state = JSON.parse(localStorage.getItem('tools2escape:v2')); const item = state.trips.flatMap((trip) => trip.planItems || []).find((entry) => entry.link === 'https://www.adventurerooms-hamburg.de/escape-room/verrueckter-professor/'); return item && { title: item.title, provider: item.provider, duration: item.duration, address: item.address, pricePerPerson: item.pricePerPerson, notes: item.notes }; })()",
    (item) => item
      && item.title === 'Der Verrückte Professor'
      && item.provider === 'AdventureRooms Hamburg'
      && item.duration === 60
      && item.address === 'Heidenkampsweg 51, 20097 Hamburg'
      && item.pricePerPerson === 27.5
      && item.notes.includes('27,50')
      && item.notes.includes('bei 5 Spielern'),
    "AdventureRooms website import extracts clean room title, provider, duration, address and 5-player price",
  );

  if (ocrFixture) {
    await evalPage(cdp, "document.querySelector('[data-import-trip-item]').click()");
    const documentResult = await cdp.send("DOM.getDocument");
    const fileInput = await cdp.send("DOM.querySelector", { nodeId: documentResult.root.nodeId, selector: "#trip-import-file" });
    await cdp.send("DOM.setFileInputFiles", { nodeId: fileInput.nodeId, files: [ocrFixture] });
    await evalPage(cdp, `
      (() => {
        document.querySelector('#trip-import-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return new Promise((resolve) => {
          const deadline = Date.now() + 120000;
          const timer = setInterval(() => {
            if (document.querySelector('#trip-item-form') || document.querySelector('[data-import-status].is-error') || Date.now() > deadline) {
              clearInterval(timer);
              resolve(true);
            }
          }, 250);
        });
      })()
    `);
    await assertEval(
      cdp,
      "JSON.stringify(Object.fromEntries(['title', 'provider', 'date', 'time', 'duration', 'address'].map((name) => [name, document.querySelector(`#trip-item-form [name=\"${name}\"]`)?.value || ''])))",
      (value) => {
        const fields = JSON.parse(value);
        return fields.title === "Tokyo Lab"
          && fields.provider === "Escape Rush"
          && fields.date === "2023-10-28"
          && fields.time === "19:45"
          && fields.duration === "70"
          && fields.address.includes("30 rue de");
      },
      "real booking screenshot extracts room details",
    );
    await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");
  }
  await evalPage(cdp, "document.querySelector('[data-import-trip-item]').click()");
  await assertEval(
    cdp,
    "document.querySelector('#trip-import-file').accept.includes('.pdf') && document.querySelector('#trip-import-file').multiple",
    Boolean,
    "booking import accepts PDFs and multiple files",
  );
  const pdfDocumentResult = await cdp.send("DOM.getDocument");
  const pdfFileInput = await cdp.send("DOM.querySelector", { nodeId: pdfDocumentResult.root.nodeId, selector: "#trip-import-file" });
  await cdp.send("DOM.setFileInputFiles", { nodeId: pdfFileInput.nodeId, files: [pdfFixture] });
  await evalPage(cdp, `
    (() => {
      document.querySelector('#trip-import-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return new Promise((resolve) => {
        const deadline = Date.now() + 30000;
        const timer = setInterval(() => {
          if (document.querySelector('#trip-item-form') || document.querySelector('[data-import-status].is-error') || Date.now() > deadline) {
            clearInterval(timer);
            resolve(true);
          }
        }, 100);
      });
    })()
  `);
  await assertEval(
    cdp,
    "document.querySelector('#trip-item-form [name=\"title\"]')?.value === 'Tokyo Lab' && document.querySelector('#trip-item-form [name=\"provider\"]')?.value === 'Escape Rush' && document.querySelector('#trip-item-form [name=\"date\"]')?.value === '2023-10-28' && document.querySelector('#trip-item-form [name=\"time\"]')?.value === '19:45' && document.querySelector('#trip-item-form [name=\"duration\"]')?.value === '70' && document.querySelector('#trip-item-form [name=\"address\"]')?.value === 'Armin-T.-Wegner-Platz 3, 42103 Wuppertal' && document.querySelector('#trip-item-form [name=\"notes\"]')?.value.includes('Adresshinweis: links neben der Kirche')",
    Boolean,
    "text PDF extracts booking details",
  );
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-import-trip-item]').click();
      const form = document.querySelector('#trip-import-form');
      const firstPage = [
        'Subject: Airbnb reservation confirmed - Brussels Loft',
        'Check-in: 12 October 2026 16:00'
      ].join('\\n');
      const secondPage = [
        'Check-out: 15 October 2026 10:00',
        'Address: Rue du Test 12',
        'City: Brussels',
        'Booking reference: AIR-1234'
      ].join('\\n');
      const transfer = new DataTransfer();
      transfer.items.add(new File([firstPage], 'screenshot-1.txt', { type: 'text/plain' }));
      transfer.items.add(new File([secondPage], 'screenshot-2.txt', { type: 'text/plain' }));
      form.querySelector('[name="bookingFile"]').files = transfer.files;
      form.querySelector('[name="bookingFile"]').dispatchEvent(new Event('change', { bubbles: true }));
      window.__qaMultipleBookingFiles = form.querySelector('[name="bookingFile"]').multiple
        && transfer.files.length === 2
        && form.querySelector('[data-import-file-name]').textContent === '2 Dateien ausgewählt';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return new Promise((resolve) => setTimeout(resolve, 150));
    })()
  `);
  await assertEval(
    cdp,
    "window.__qaMultipleBookingFiles && document.querySelector('#trip-item-form [name=\"type\"]')?.value === 'accommodation' && document.querySelector('#trip-item-form [name=\"date\"]')?.value === '2026-10-12' && document.querySelector('#trip-item-form [name=\"endDate\"]')?.value === '2026-10-15' && document.querySelector('#trip-item-form [name=\"address\"]')?.value.includes('Rue du Test 12')",
    Boolean,
    "multiple booking files combine accommodation details",
  );
  await screenshot(cdp, path.join(qaDir, "trip-item-form.png"));
  await evalPage(cdp, "document.querySelector('#trip-item-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))");
  await assertEval(cdp, "document.querySelectorAll('.trip-item--accommodation').length >= 2 && Boolean(document.querySelector('.trip-item--accommodation .route-link')) && Boolean(document.querySelector('.trip-plan-stay-marker'))", Boolean, "accommodation renders as day start and end waypoint");
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-open-trip-item]').click();
      const form = document.querySelector('#trip-item-form');
      window.__qaEscapeLabels = {
        provider: form.querySelector('[data-trip-item-field="provider"] span').textContent,
        date: form.querySelector('[data-trip-item-field="date"] span').textContent,
        timeVisible: !form.querySelector('[data-trip-item-field="time"]').hidden,
        endDateHidden: form.querySelector('[data-trip-item-field="endDate"]').hidden,
      };
      form.querySelector('[name="type"]').value = 'accommodation';
      form.querySelector('[name="type"]').dispatchEvent(new Event('change', { bubbles: true }));
      window.__qaAccommodationLabels = {
        provider: form.querySelector('[data-trip-item-field="provider"] span').textContent,
        date: form.querySelector('[data-trip-item-field="date"] span').textContent,
        timeHidden: form.querySelector('[data-trip-item-field="time"]').hidden,
        endDate: form.querySelector('[data-trip-item-field="endDate"] span').textContent,
        durationHidden: form.querySelector('[data-trip-item-field="duration"]').hidden,
      };
      form.querySelector('[name="type"]').value = 'escape';
      form.querySelector('[name="type"]').dispatchEvent(new Event('change', { bubbles: true }));
      form.querySelector('[name="title"]').value = 'QA Trip Room';
      form.querySelector('[name="provider"]').value = 'QA Escape';
      form.querySelector('[name="date"]').value = '2026-10-13';
      form.querySelector('[name="time"]').value = '14:30';
      form.querySelector('[name="address"]').value = 'Rue Exemple 4, Lille';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(cdp, "window.__qaEscapeLabels.provider === 'Anbieter' && window.__qaEscapeLabels.date === 'Datum' && window.__qaEscapeLabels.timeVisible && window.__qaEscapeLabels.endDateHidden", Boolean, "escape room fields adapt to type");
  await assertEval(cdp, "window.__qaAccommodationLabels.provider === 'Gastgeber' && window.__qaAccommodationLabels.date === 'Check-in' && window.__qaAccommodationLabels.timeHidden && window.__qaAccommodationLabels.endDate === 'Check-out' && window.__qaAccommodationLabels.durationHidden", Boolean, "accommodation fields adapt to type");
  await assertEval(cdp, "Boolean(document.querySelector('.trip-item--escape .route-link')) && Boolean(document.querySelector('.trip-travel-row')) && document.body.textContent.includes('Späteste Abfahrt') && document.body.textContent.includes('Ankunft ca.')", Boolean, "manual escape room renders with accommodation travel timing");
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-open-trip-expense]').click();
      const form = document.querySelector('#trip-expense-form');
      form.querySelector('[name="title"]').value = 'Airbnb';
      form.querySelector('[name="amount"]').value = '100';
      form.querySelector('[name="payer"]').value = 'Sebi';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(cdp, "document.querySelector('.trip-expense')?.textContent.includes('Airbnb') && document.querySelector('.trip-settlement')?.textContent.includes('zahlt') && document.querySelector('.trip-settlement')?.textContent.includes('Sebi') && document.querySelector('.trip-settlement')?.textContent.includes('20,00')", Boolean, "trip expenses calculate tricount settlement");
  await evalPage(cdp, `
    (() => {
      window.__qaSettlementConfirm = '';
      window.confirm = (message) => { window.__qaSettlementConfirm = message; return true; };
      for (let index = 0; index < 8 && document.querySelector('[data-settlement-paid]'); index += 1) {
        document.querySelector('[data-settlement-paid]').click();
      }
      return true;
    })()
  `);
  await assertEval(cdp, "window.__qaSettlementConfirm.includes('gezahlt?') && document.querySelector('.trip-settlement')?.textContent.includes('Alles ausgeglichen')", Boolean, "settlement paid button records balancing payment");
  await evalPage(cdp, `
    (() => {
      const card = Array.from(document.querySelectorAll('.trip-plan-card')).find((entry) => entry.querySelector('[data-pay-plan-item]'));
      card.querySelector('[data-pay-plan-item]').click();
      const form = document.querySelector('#trip-expense-form');
      form.querySelector('[name="amount"]').value = '0';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(cdp, "Boolean(document.querySelector('.trip-plan-card .paid-action')) && document.querySelector('.trip-plan-card .paid-action')?.textContent.includes('✓ bezahlt')", Boolean, "paid planning room shows green paid button");
  await assertEval(cdp, "document.querySelectorAll('.trip-expense-list:not(.trip-expense-list--modal) .trip-expense').length <= 3 && Boolean(document.querySelector('[data-open-trip-expenses]'))", Boolean, "tricount preview shows only last three payments");
  await evalPage(cdp, "document.querySelector('[data-open-trip-expenses]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('#trip-expenses-modal-title')) && document.querySelectorAll('.trip-expense-list--modal .trip-expense').length > 3", Boolean, "all trip payments open in modal");
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-complete-trip-item]').click();
      const form = document.querySelector('#room-form');
      form.querySelector('[name="difficulty"][value="2"]').checked = true;
      form.querySelector('[name="scare"][value="1"]').checked = true;
      form.querySelector('[name="rating-base-Sebi"][value="8"]').checked = true;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(cdp, "Boolean(document.querySelector('.trip-item--escape .trip-complete')) && Boolean(document.querySelector('.trip-item--escape [data-edit-room]'))", Boolean, "trip escape room converts to played room");
  await evalPage(cdp, "document.querySelector('[data-view=\"upnext\"]').click()");
  await assertEval(cdp, "document.querySelectorAll('.wish-card').length === 36 && !Array.from(document.querySelectorAll('.wish-card h2')).some((node) => node.textContent === 'QA Trip Room')", Boolean, "played trip room is removed from up next");
  await evalPage(cdp, "document.querySelector('[data-view=\"trips\"]').click()");
  await screenshot(cdp, path.join(qaDir, "trip-desktop.png"));

  await evalPage(cdp, "document.querySelector('[data-view=\"map\"]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('#map-canvas')) && document.querySelectorAll('.map-place').length > 0", Boolean, "map view renders city groups");
  await evalPage(cdp, "document.querySelector('#map-source').value = 'wish'; document.querySelector('#map-source').dispatchEvent(new Event('change', { bubbles: true }));");
  await assertEval(cdp, "document.querySelector('.map-summary strong')?.textContent", (value) => value === "36", "map source filters up next rooms");
  await evalPage(cdp, "new Promise((resolve) => setTimeout(resolve, 900))");
  await evalPage(cdp, "window.__qaInitialMapZoom = Number(document.querySelector('#map-canvas')?.dataset.mapZoom || 0)");
  await evalPage(cdp, "if (window.L) { for (let index = 0; index < 5; index += 1) document.querySelector('.leaflet-control-zoom-in')?.click(); }");
  await evalPage(cdp, "new Promise((resolve) => setTimeout(resolve, 900))");
  await assertEval(cdp, "window.L ? Number(document.querySelector('#map-canvas')?.dataset.mapZoom || 0) > window.__qaInitialMapZoom : true", Boolean, "map zoom controls update viewport");
  await evalPage(cdp, "window.__qaMapViewport = `${document.querySelector('#map-canvas')?.dataset.mapZoom}|${document.querySelector('#map-canvas')?.dataset.mapCenter}`; document.querySelector('[data-toggle-bulk-plan=\"map\"]')?.click();");
  await evalPage(cdp, "new Promise((resolve) => setTimeout(resolve, 900))");
  await assertEval(cdp, "window.L ? `${document.querySelector('#map-canvas')?.dataset.mapZoom}|${document.querySelector('#map-canvas')?.dataset.mapCenter}` === window.__qaMapViewport : true", Boolean, "map list actions keep current viewport");
  await evalPage(cdp, "const list = document.querySelector('[data-map-list]'); if (list) { list.scrollTop = 180; window.__qaMapListScrollBefore = list.scrollTop; document.querySelector('[data-toggle-bulk-plan=\"map\"]')?.click(); }");
  await assertEval(cdp, "document.querySelector('[data-map-list]')?.scrollTop === window.__qaMapListScrollBefore", Boolean, "map list actions keep list scroll position");
  await evalPage(cdp, "document.querySelector('#map-source').value = 'played'; document.querySelector('#map-source').dispatchEvent(new Event('change', { bubbles: true }));");
  await evalPage(cdp, "new Promise((resolve) => setTimeout(resolve, 900))");
  await assertEval(cdp, "window.L ? document.querySelectorAll('.leaflet-marker-icon').length > 0 : true", Boolean, "map markers render when leaflet is available");
  await evalPage(cdp, "document.querySelector('#map-source').value = 'terpeca'; document.querySelector('#map-source').dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#map-planning-status').value = 'all'; document.querySelector('#map-planning-status').dispatchEvent(new Event('change', { bubbles: true }));");
  await assertEval(cdp, "document.querySelector('.map-summary strong')?.textContent === '100' && document.querySelectorAll('#map-region option').length > 10", Boolean, "TERPECA is available as map source");
  await evalPage(cdp, "document.querySelector('#map-source').value = 'escaperoomers'; document.querySelector('#map-source').dispatchEvent(new Event('change', { bubbles: true }));");
  await assertEval(
    cdp,
    "document.querySelector('[data-map-list]')?.textContent.includes('Wähle zuerst ein EscapeRoomers-Gebiet') && document.querySelectorAll('.map-place').length === 0 && document.querySelectorAll('#map-region option').length > 40",
    Boolean,
    "EscapeRoomers map source waits for a region",
  );
  await evalPage(cdp, `
    (() => {
      const region = document.querySelector('#map-region');
      const option = Array.from(region.options).find((entry) => entry.textContent.startsWith('Belgien'))
        || Array.from(region.options).find((entry) => entry.value !== 'all');
      region.value = option.value;
      region.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('#map-planning-status').value = 'all';
      document.querySelector('#map-planning-status').dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `);
  await assertEval(
    cdp,
    "(() => { const text = document.querySelector('[data-map-list]')?.textContent || ''; const renderedRooms = document.querySelectorAll('.map-room').length; return { stillWaiting: text.includes('Wähle zuerst ein EscapeRoomers-Gebiet'), region: document.querySelector('#map-region')?.value, renderedRooms }; })()",
    (value) => !value.stillWaiting && value.region !== "all" && value.renderedRooms > 0 && value.renderedRooms <= 20,
    "EscapeRoomers map region limits visible workload",
  );
  await evalPage(cdp, "document.querySelector('[data-map-list] [data-planning-link]').click()");
  await assertEval(
    cdp,
    "(() => { const backdrop = document.querySelector('.modal-backdrop'); const leafletControl = document.querySelector('.leaflet-control-container'); return { modal: backdrop ? Number(getComputedStyle(backdrop).zIndex) : 0, leaflet: leafletControl ? Number(getComputedStyle(leafletControl).zIndex || 0) : 0, hasForm: Boolean(document.querySelector('#planning-link-form')) }; })()",
    (value) => value.hasForm && value.modal > value.leaflet,
    "map planning link modal stays above leaflet",
  );
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");

  await evalPage(cdp, "document.querySelector('[data-view=\"stats\"]').click()");
  await assertEval(cdp, "document.querySelectorAll('.panel').length", (value) => value >= 4, "stats panels");
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('.compact-kpis .kpi span')).map((node) => node.textContent).join('|')",
    (value) => value.includes("Top-Stadt") && value.includes("Horror 3+") && value.includes("Ø Difficulty") && !value.includes("Up Next") && !value.includes("Ø Horror") && !value.includes("Einzelbewertungen"),
    "stats overview extended KPIs",
  );
  await assertEval(
    cdp,
    `
      (() => {
        const panel = Array.from(document.querySelectorAll('.panel')).find((entry) => entry.querySelector('h2')?.textContent === 'Top Räume');
        const rows = Array.from(panel.querySelectorAll('.rank-row')).map((row) => ({
          rank: row.children[0].textContent.trim(),
          score: row.querySelector('b').textContent.trim(),
        }));
        return rows.every((row, index) => rows.findIndex((entry) => entry.score === row.score) === index || rows.find((entry) => entry.score === row.score).rank === row.rank);
      })()
    `,
    Boolean,
    "top rooms share rank for same score",
  );
  await assertEval(
    cdp,
    `
      (() => {
        const panel = Array.from(document.querySelectorAll('.panel')).find((entry) => entry.querySelector('h2')?.textContent === 'Regionen');
        return Array.from(panel.querySelectorAll('.bar-row span')).map((node) => node.textContent).join('|');
      })()
    `,
    (value) => value === "DE|NRW|BeNeLux|Hamburg (HH)|Spanien|Athen|Polen|Ungarn|Frankreich|Tschechien|Irland|UK|Portugal|Italien|Finnland|Kroatien",
    "regions sorted by played rooms",
  );
  await assertEval(
    cdp,
    `
      (() => {
        const panel = Array.from(document.querySelectorAll('.panel')).find((entry) => entry.querySelector('h2')?.textContent === 'Kontrovers');
        const rows = Array.from(panel.querySelectorAll('.controversy-row')).map((row) => ({
          detail: row.querySelector('small')?.textContent || '',
          spread: Number(row.querySelector('b')?.textContent?.replace(',', '.')),
        }));
        return rows.length > 0 && rows.every((row) => row.spread >= 2.5 && /\\b\\d+(\\.\\d)?\\b · .*\\b\\d+(\\.\\d)?\\b/.test(row.detail));
      })()
    `,
    Boolean,
    "controversy threshold and rating details",
  );
  await assertEval(cdp, "document.querySelector('.member-table strong').textContent", (value) => value === "Sebi", "team stats sorted by count");
  await assertEval(cdp, "document.querySelector('.member-table span').textContent", (value) => value === "238 gespielt · 231 Bewertungen", "team stats include trip room rating");
  await assertEval(
    cdp,
    "window.T2E_SEED_DATA.played.find((room) => room.title === 'Mission Zeitreise')?.playedBy?.join('|')",
    (value) => value === "Sebi|Elisa|Lara|Nikolai|Ari",
    "dash ratings imported as played",
  );

  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-view="played"]').click();
      const countFor = (label) => {
        const option = Array.from(document.querySelectorAll('#region-filter option')).find((entry) => entry.textContent.startsWith(label));
        return Number(option?.textContent.match(/\\((\\d+)\\)$/)?.[1] || 0);
      };
      window.__qaRegionCounts = { de: countFor('DE'), nrw: countFor('NRW') };
      document.querySelector('[data-open-room]').click();
      const form = document.querySelector('#room-form');
      form.querySelector('[name="title"]').value = 'QA Münster';
      form.querySelector('[name="provider"]').value = 'QA';
      form.querySelector('[name="city"]').value = 'Münster';
      form.querySelector('[name="rating-base-Sebi"][value="8"]').checked = true;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(
    cdp,
    `
      (() => {
        const countFor = (label) => {
          const option = Array.from(document.querySelectorAll('#region-filter option')).find((entry) => entry.textContent.startsWith(label));
          return Number(option?.textContent.match(/\\((\\d+)\\)$/)?.[1] || 0);
        };
        return countFor('DE') === window.__qaRegionCounts.de + 1 && countFor('NRW') === window.__qaRegionCounts.nrw + 1;
      })()
    `,
    Boolean,
    "new room city auto assigns DE and NRW",
  );

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await evalPage(cdp, "document.querySelector('[data-view=\"trips\"]').click()");
  await screenshot(cdp, path.join(qaDir, "trip-mobile.png"));
  await assertEval(cdp, "document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1", Boolean, "trip view has no horizontal overflow");
  await evalPage(cdp, "document.querySelector('[data-open-trip-item]').click()");
  await screenshot(cdp, path.join(qaDir, "trip-item-mobile-form.png"));
  await assertEval(cdp, "!document.querySelector('#trip-item-form [name=\"city\"]') && !document.querySelector('#trip-item-form [name=\"bookingReference\"]')", Boolean, "mobile trip form omits city and booking reference");
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");
  await evalPage(cdp, "document.querySelector('.trip-item')?.scrollIntoView({ block: 'start' })");
  await screenshot(cdp, path.join(qaDir, "trip-mobile-item.png"));
  await evalPage(cdp, "document.querySelector('[data-view=\"played\"]').click()");
  await screenshot(cdp, path.join(qaDir, "mobile.png"));
  await assertEval(cdp, "document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1", Boolean, "no horizontal overflow");

  await evalPage(cdp, `
    (() => {
      const seed = JSON.parse(JSON.stringify(window.T2E_SEED_DATA));
      seed.played = seed.played.slice(0, 49).map((room, index) => ({
        ...room,
        id: 'qa-milestone-' + index,
        playedBy: ['Sebi'],
        ratings: Object.fromEntries(seed.members.map((member) => [member, member === 'Sebi' ? 8 : null])),
      }));
      seed.wishList = [];
      seed.trips = [];
      localStorage.setItem('tools2escape:v2', JSON.stringify(seed));
      return true;
    })()
  `);
  await cdp.send("Page.reload", { ignoreCache: true });
  await waitForApp(cdp);
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-open-room]').click();
      const form = document.querySelector('#room-form');
      form.querySelector('[name="title"]').value = 'QA Jubiläum';
      form.querySelector('[name="provider"]').value = 'QA';
      form.querySelector('[name="city"]').value = 'Köln';
      form.querySelector('[name="rating-base-Sebi"][value="8"]').checked = true;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(
    cdp,
    "document.querySelector('.celebration-modal')?.textContent.includes('Sebi') && document.querySelector('.celebration-modal')?.textContent.includes('50. Raum')",
    Boolean,
    "room milestone celebration appears",
  );
  await evalPage(cdp, "document.querySelector('[data-close-celebration]').click()");

  await cdp.close();
} finally {
  edge.kill();
  await Promise.race([
    new Promise((resolve) => edge.once("exit", resolve)),
    sleep(1500),
  ]);
  if (profileDir.startsWith(qaDir)) {
    try {
      await fs.rm(profileDir, { recursive: true, force: true });
    } catch {
      // Edge can keep its profile lock for a moment after headless shutdown.
    }
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures, screenshots }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, screenshots }, null, 2));

async function waitForTarget(debugPort) {
  const deadline = Date.now() + 15000;
  let attemptedCreate = false;
  while (Date.now() < deadline) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${debugPort}/json/list`);
      const target = targets.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl);
      if (target) return target;
      if (!attemptedCreate) {
        attemptedCreate = true;
        const created = await fetchJson(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(fileUrl)}`, { method: "PUT" });
        if (created?.webSocketDebuggerUrl) return created;
      }
    } catch {
      await sleep(250);
    }
  }
  throw new Error("CDP target did not become available");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function connectCdp(url) {
  const endpoint = new URL(url);
  const socket = net.createConnection({
    host: endpoint.hostname,
    port: Number(endpoint.port),
  });
  const pending = new Map();
  let id = 0;
  let incoming = Buffer.alloc(0);
  let ready = false;

  await new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString("base64");
    const requestPath = `${endpoint.pathname}${endpoint.search}`;
    const fail = (error) => {
      socket.destroy();
      reject(error);
    };

    socket.once("error", fail);
    socket.once("connect", () => {
      socket.write([
        `GET ${requestPath} HTTP/1.1`,
        `Host: ${endpoint.host}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "Origin: devtools://devtools",
        "",
        "",
      ].join("\r\n"));
    });

    socket.on("data", (chunk) => {
      incoming = Buffer.concat([incoming, chunk]);
      if (!ready) {
        const headerEnd = incoming.indexOf("\r\n\r\n");
        if (headerEnd < 0) return;
        const header = incoming.slice(0, headerEnd).toString("latin1");
        incoming = incoming.slice(headerEnd + 4);
        if (!/^HTTP\/1\.1 101\b/.test(header)) {
          fail(new Error(`CDP websocket handshake failed: ${header.split("\r\n")[0] || "no response"}`));
          return;
        }
        ready = true;
        socket.off("error", fail);
        socket.on("error", (error) => rejectPending(error));
        socket.on("close", () => rejectPending(new Error("CDP socket closed")));
        resolve();
      }
      readFrames();
    });
  });

  function rejectPending(error) {
    pending.forEach(({ reject }) => reject(error));
    pending.clear();
  }

  function readFrames() {
    while (incoming.length >= 2) {
      const firstByte = incoming[0];
      const secondByte = incoming[1];
      const opcode = firstByte & 0x0f;
      const masked = Boolean(secondByte & 0x80);
      let length = secondByte & 0x7f;
      let offset = 2;

      if (length === 126) {
        if (incoming.length < 4) return;
        length = incoming.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (incoming.length < 10) return;
        const bigLength = incoming.readBigUInt64BE(2);
        if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("CDP frame too large");
        length = Number(bigLength);
        offset = 10;
      }

      const maskOffset = masked ? 4 : 0;
      const totalLength = offset + maskOffset + length;
      if (incoming.length < totalLength) return;

      let payload = incoming.slice(offset + maskOffset, totalLength);
      if (masked) {
        const mask = incoming.slice(offset, offset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }
      incoming = incoming.slice(totalLength);

      if (opcode === 0x8) {
        socket.end();
        rejectPending(new Error("CDP socket closed"));
        return;
      }
      if (opcode === 0x9) {
        writeFrame(payload, 0x0a);
        continue;
      }
      if (opcode !== 0x1) continue;

      const message = JSON.parse(payload.toString("utf8"));
      handleMessage(message);
    }
  }

  function handleMessage(message) {
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }

  function writeFrame(payload, opcode = 0x1) {
    const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), "utf8");
    const mask = crypto.randomBytes(4);
    let header;
    if (data.length < 126) {
      header = Buffer.alloc(2);
      header[1] = 0x80 | data.length;
    } else if (data.length < 65536) {
      header = Buffer.alloc(4);
      header[1] = 0x80 | 126;
      header.writeUInt16BE(data.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(data.length), 2);
    }
    header[0] = 0x80 | opcode;
    const masked = Buffer.from(data.map((byte, index) => byte ^ mask[index % 4]));
    socket.write(Buffer.concat([header, mask, masked]));
  }

  return {
    send(method, params = {}) {
      const messageId = ++id;
      writeFrame(JSON.stringify({ id: messageId, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
      });
    },
    close() {
      writeFrame(Buffer.alloc(0), 0x8);
      socket.end();
    },
  };
}

async function waitForApp(cdp) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const ready = await evalPage(cdp, "Boolean(document.querySelector('.room-card'))");
    if (ready) return;
    await sleep(100);
  }
  const debug = await evalPage(cdp, "({ title: document.title, body: document.body.innerText.slice(0, 800), html: document.documentElement.innerHTML.slice(0, 800) })").catch((error) => ({ error: error.message }));
  throw new Error(`App did not render: ${JSON.stringify(debug)}`);
}

async function evalPage(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result.value;
}

async function assertEval(cdp, expression, predicate, label) {
  const value = await evalPage(cdp, expression);
  const pass = predicate(value);
  if (!pass) failures.push({ label, value });
}

async function screenshot(cdp, outputPath) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await fs.writeFile(outputPath, Buffer.from(result.data, "base64"));
  screenshots.push(outputPath);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createQaIndexHtml() {
  const source = await fs.readFile(path.join(workspace, "index.html"), "utf8");
  const flatpickrStub = `
    <script>
      window.flatpickr = function(input, options) {
        const api = {
          setDate(values, triggerChange) {
            const list = (Array.isArray(values) ? values : [values]).filter(Boolean).map((value) => value instanceof Date ? value : new Date(String(value).slice(0, 10) + "T00:00:00"));
            input.value = list.map((date) => date.toISOString().slice(0, 10)).join(" bis ");
            if (triggerChange && options && typeof options.onChange === "function") options.onChange(list);
          },
          open() {},
          destroy() {},
        };
        input._flatpickr = api;
        if (options && Array.isArray(options.defaultDate) && options.defaultDate.length) api.setDate(options.defaultDate, false);
        return api;
      };
      window.flatpickr.l10ns = { de: {} };
    </script>
  `;
  return source
    .replace(/<link[^>]+https:\/\/cdn\.jsdelivr\.net[^>]+>\s*/g, "")
    .replace(/<script[^>]+https:\/\/cdn\.jsdelivr\.net[^>]+><\/script>\s*/g, "")
    .replace("<head>", `<head>\n    <base href="${workspaceUrl}">`)
    .replace('<script src="src/config.js"></script>', `${flatpickrStub}\n    <script src="src/config.js"></script>`);
}

function createSimplePdf(lines) {
  const escapePdfText = (value) => value.replace(/([\\()])/g, "\\$1");
  const content = [
    "BT",
    "/F1 14 Tf",
    "50 790 Td",
    ...lines.flatMap((line, index) => index
      ? ["0 -28 Td", `(${escapePdfText(line)}) Tj`]
      : [`(${escapePdfText(line)}) Tj`]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`,
  ];

  let source = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(source, "ascii");
    source += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(source, "ascii");
  source += `xref\n0 ${objects.length + 1}\n`;
  source += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    source += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(source, "ascii");
}
