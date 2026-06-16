import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(rootDir, "src", "config.js");

const fileConfig = await readAppConfig();
const supabaseUrl = valueFromEnvOrConfig("SUPABASE_URL", "supabaseUrl");
const supabaseAnonKey = valueFromEnvOrConfig("SUPABASE_ANON_KEY", "supabaseAnonKey");
const teamId = valueFromEnvOrConfig("SUPABASE_TEAM_ID", "teamId");

if (!supabaseUrl || !supabaseAnonKey || !teamId) {
  throw new Error("Supabase ping config missing. Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_TEAM_ID or keep src/config.js configured.");
}

const endpoint = new URL("/rest/v1/team_state", supabaseUrl);
endpoint.searchParams.set("id", `eq.${teamId}`);
endpoint.searchParams.set("select", "id,updated_at");
endpoint.searchParams.set("limit", "1");

const databasePing = await request(endpoint);
if (databasePing.ok) {
  const rows = JSON.parse(databasePing.body);
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error(`Supabase ping found no team_state row for team id "${teamId}".`);
  }

  console.log(`Supabase database ping ok: ${new URL(supabaseUrl).host} / ${teamId} / updated_at=${rows[0].updated_at || "unknown"}`);
} else {
  console.warn(`Supabase database ping skipped: ${databasePing.status} ${databasePing.body.slice(0, 250)}`);
  await assertOk(new URL("/auth/v1/health", supabaseUrl), "auth health");
  await assertOk(new URL("/storage/v1/bucket", supabaseUrl), "storage API");
  console.log(`Supabase fallback ping ok: ${new URL(supabaseUrl).host} / ${teamId}`);
}

async function assertOk(url, label) {
  const result = await request(url);
  if (!result.ok) throw new Error(`Supabase ${label} ping failed with ${result.status}: ${result.body.slice(0, 500)}`);
}

async function request(url) {
  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Accept: "application/json",
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.text(),
  };
}

async function readAppConfig() {
  try {
    return parseConfig(await fs.readFile(configPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

function valueFromEnvOrConfig(envName, configName) {
  return clean(process.env[envName]) || clean(fileConfig[configName]);
}

function parseConfig(source) {
  return Object.fromEntries(
    [...source.matchAll(/([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*"([^"]*)"/g)].map((match) => [match[1], match[2]]),
  );
}

function clean(value) {
  return String(value || "").trim();
}
