import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const workspace = process.cwd();
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = Number(process.env.CDP_PORT || 9300 + Math.floor(Math.random() * 500));
const qaDir = path.join(workspace, "qa");
const fileUrl = `file:///${path.join(workspace, "index.html").replace(/\\/g, "/")}?qa`;
const ocrFixture = process.env.T2E_OCR_FIXTURE || "";

await fs.mkdir(qaDir, { recursive: true });
const profileDir = await fs.mkdtemp(path.join(qaDir, "edge-profile-"));

const edge = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1440,1000",
  fileUrl,
], { stdio: "ignore" });

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
    "document.querySelector('h1')?.textContent === 'Tools2EscApp' && Boolean(document.querySelector('.brand-logo')) && !document.querySelector('.eyebrow') && !document.body.textContent.includes('Escape Tracker') && Array.from(document.querySelectorAll('[data-view]')).map((button) => button.textContent).join('|') === 'Gespielt|Up Next|Trips|Karte|Statistik'",
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
      form.querySelector('[name="country"]').value = 'Frankreich';
      form.querySelector('[name="city"]').value = 'Lille';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })()
  `);
  await assertEval(cdp, "document.querySelectorAll('.wish-card').length", (value) => value === 36, "qa trip room added to up next");

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
      "JSON.stringify(Object.fromEntries(['title', 'provider', 'date', 'time', 'endTime', 'address'].map((name) => [name, document.querySelector(`#trip-item-form [name=\"${name}\"]`)?.value || ''])))",
      (value) => {
        const fields = JSON.parse(value);
        return fields.title === "Tokyo Lab"
          && fields.provider === "Escape Rush"
          && fields.date === "2023-10-28"
          && fields.time === "19:45"
          && fields.endTime === "20:55"
          && fields.address.includes("30 rue de");
      },
      "real booking screenshot extracts room details",
    );
    await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");
  }
  await evalPage(cdp, `
    (() => {
      document.querySelector('[data-import-trip-item]').click();
      const form = document.querySelector('#trip-import-form');
      const email = [
        'Subject: Airbnb reservation confirmed - Brussels Loft',
        'Content-Type: text/plain; charset=UTF-8',
        '',
        'Check-in: 12 October 2026 16:00',
        'Check-out: 15 October 2026 10:00',
        'Address: Rue du Test 12',
        'City: Brussels',
        'Booking reference: AIR-1234'
      ].join('\\n');
      const transfer = new DataTransfer();
      transfer.items.add(new File([email], 'airbnb-booking.eml', { type: 'message/rfc822' }));
      form.querySelector('[name="bookingFile"]').files = transfer.files;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return new Promise((resolve) => setTimeout(resolve, 150));
    })()
  `);
  await assertEval(
    cdp,
    "document.querySelector('#trip-item-form [name=\"type\"]')?.value === 'accommodation' && document.querySelector('#trip-item-form [name=\"date\"]')?.value === '2026-10-12' && document.querySelector('#trip-item-form [name=\"endDate\"]')?.value === '2026-10-15' && document.querySelector('#trip-item-form [name=\"address\"]')?.value.includes('Rue du Test 12')",
    Boolean,
    "booking text import extracts accommodation details",
  );
  await screenshot(cdp, path.join(qaDir, "trip-item-form.png"));
  await evalPage(cdp, "document.querySelector('#trip-item-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))");
  await assertEval(cdp, "document.querySelectorAll('.trip-item').length === 1 && Boolean(document.querySelector('.trip-item--accommodation .route-link'))", Boolean, "trip item and route link render");
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
        endTimeHidden: form.querySelector('[data-trip-item-field="endTime"]').hidden,
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
  await assertEval(cdp, "window.__qaAccommodationLabels.provider === 'Gastgeber' && window.__qaAccommodationLabels.date === 'Check-in' && window.__qaAccommodationLabels.timeHidden && window.__qaAccommodationLabels.endDate === 'Check-out' && window.__qaAccommodationLabels.endTimeHidden", Boolean, "accommodation fields adapt to type");
  await assertEval(cdp, "document.querySelectorAll('.trip-item').length === 2 && Boolean(document.querySelector('.trip-item--escape .route-link'))", Boolean, "manual escape room trip item renders");
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
  await assertEval(cdp, "document.querySelectorAll('.wish-card').length === 35 && !Array.from(document.querySelectorAll('.wish-card h2')).some((node) => node.textContent === 'QA Trip Room')", Boolean, "played trip room is removed from up next");
  await evalPage(cdp, "document.querySelector('[data-view=\"trips\"]').click()");
  await screenshot(cdp, path.join(qaDir, "trip-desktop.png"));

  await evalPage(cdp, "document.querySelector('[data-view=\"map\"]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('#map-canvas')) && document.querySelectorAll('.map-place').length > 0", Boolean, "map view renders city groups");
  await evalPage(cdp, "document.querySelector('#map-source').value = 'wish'; document.querySelector('#map-source').dispatchEvent(new Event('change', { bubbles: true }));");
  await assertEval(cdp, "document.querySelector('.map-summary strong')?.textContent", (value) => value === "35", "map source filters up next rooms");
  await evalPage(cdp, "document.querySelector('#map-source').value = 'played'; document.querySelector('#map-source').dispatchEvent(new Event('change', { bubbles: true }));");
  await evalPage(cdp, "new Promise((resolve) => setTimeout(resolve, 900))");
  await assertEval(cdp, "window.L ? document.querySelectorAll('.leaflet-marker-icon').length > 0 : true", Boolean, "map markers render when leaflet is available");

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
  while (Date.now() < deadline) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${debugPort}/json/list`);
      const target = targets.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl);
      if (target) return target;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("CDP target did not become available");
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function connectCdp(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let id = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  return {
    send(method, params = {}) {
      const messageId = ++id;
      socket.send(JSON.stringify({ id: messageId, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
      });
    },
    close() {
      socket.close();
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
  throw new Error("App did not render");
}

async function evalPage(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
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
