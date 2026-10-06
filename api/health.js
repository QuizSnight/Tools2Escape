const fs = require("node:fs");
const path = require("node:path");

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") return response.status(405).json({ ok: false });
  if (process.env.CRON_SECRET && request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ ok: false });
  }
  try {
    const source = fs.readFileSync(path.join(__dirname, "../src/config.js"), "utf8");
    const config = Object.fromEntries([...source.matchAll(/(\w+)\s*:\s*"([^"]*)"/g)]
      .map((match) => [match[1], match[2]]));
    const endpoint = new URL("/rest/v1/team_state", config.supabaseUrl);
    endpoint.searchParams.set("id", `eq.${config.teamId}`);
    endpoint.searchParams.set("select", "id");
    const result = await fetch(endpoint, {
      headers: { apikey: config.supabaseAnonKey },
      signal: AbortSignal.timeout(15000),
    });
    if (!result.ok) throw new Error(`Database check failed: ${result.status}`);
    const rows = await result.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error("Team row missing");
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Database health check failed", error.message);
    return response.status(503).json({ ok: false });
  }
};
