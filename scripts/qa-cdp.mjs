import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const workspace = process.cwd();
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = Number(process.env.CDP_PORT || 9300 + Math.floor(Math.random() * 500));
const qaDir = path.join(workspace, "qa");
const fileUrl = `file:///${path.join(workspace, "index.html").replace(/\\/g, "/")}`;

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
    "document.querySelector('h1')?.textContent === 'Tools2EscApp' && Boolean(document.querySelector('.brand-logo')) && !document.querySelector('.eyebrow') && !document.body.textContent.includes('Escape Tracker')",
    Boolean,
    "single app heading with logo",
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
    (value) => value === "Alle|DE|Athen|NRW|Hamburg (HH)|BeNeLux|Spanien",
    "region filter preset options only",
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
    (value) => value === "Spanien (14)",
    "spain dynamic city count",
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
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");

  await evalPage(cdp, "document.querySelector('[data-view=\"upnext\"]').click()");
  await assertEval(cdp, "document.querySelectorAll('.wish-card').length", (value) => value === 35, "up next cards count");
  await assertEval(cdp, "document.querySelector('[data-open-wish]')?.textContent", (value) => value === "Geplanten Raum ergänzen", "up next add button label");
  await evalPage(cdp, "document.querySelector('[data-open-wish]').click()");
  await assertEval(cdp, "Boolean(document.querySelector('#wish-form'))", Boolean, "wish modal opens");
  await evalPage(cdp, "document.querySelector('[data-close-modal]').click()");

  await evalPage(cdp, "document.querySelector('[data-view=\"stats\"]').click()");
  await assertEval(cdp, "document.querySelectorAll('.panel').length", (value) => value >= 4, "stats panels");
  await assertEval(
    cdp,
    "Array.from(document.querySelectorAll('.compact-kpis .kpi span')).map((node) => node.textContent).join('|')",
    (value) => value.includes("Top-Stadt") && value.includes("Horror 3+") && value.includes("Ø Difficulty") && !value.includes("Up Next") && !value.includes("Ø Horror"),
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
    (value) => value === "DE|NRW|BeNeLux|Hamburg (HH)|Athen|Spanien",
    "regions sorted by rated rooms",
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

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
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
