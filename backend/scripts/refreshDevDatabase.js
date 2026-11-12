// Replaces the development database's data with a copy of the live data.
//
//   SOURCE_TURSO_DATABASE_URL / SOURCE_TURSO_AUTH_TOKEN  database to copy from (read only)
//   DEV_TURSO_DATABASE_URL / DEV_TURSO_AUTH_TOKEN        database to overwrite
//
// Locally, SOURCE_* falls back to TURSO_* from backend/.env.local.
// The source is only ever read, so a read-only Turso token is enough for it.
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });
const { createClient } = require("@libsql/client");
const { isDeployed, resolveDatabaseConfig } = require("../database");
const { applySchema } = require("./initDevDatabase");

// Never copied: credentials, and anything the dev server could act on for real
// (its reminder job pushes notifications; smart devices point at real hardware;
// EID submissions could be resent).
const EXCLUDED_TABLES = new Set([
  "authUsers",
  "passkeys",
  "pushSubscriptions",
  "apiKeys",
  "appConfig",
  "smartDevices",
  "floorplanDevices",
  "eidCymruMovementSubmissions",
  "notifications",
  "clickLog",
  "appOpenEvents",
  "devNotes",
  "changeLog",
]);

const BATCH_SIZE = 200;
const quote = (name) => `"${String(name).replace(/"/g, '""')}"`;

async function copyTable(source, dev, table) {
  const first = await source.execute(`SELECT * FROM ${quote(table)} LIMIT 1`);
  const columns = first.columns;
  await dev.execute(`DELETE FROM ${quote(table)}`);
  if (columns.length === 0) return 0;

  const insert = `INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
  let copied = 0;
  for (let offset = 0; ; offset += BATCH_SIZE) {
    const page = await source.execute({
      sql: `SELECT * FROM ${quote(table)} LIMIT ? OFFSET ?`,
      args: [BATCH_SIZE, offset],
    });
    if (page.rows.length === 0) break;
    await dev.batch(
      page.rows.map((row) => ({ sql: insert, args: columns.map((column) => row[column]) })),
      "write"
    );
    copied += page.rows.length;
  }
  return copied;
}

async function main() {
  if (isDeployed()) throw new Error("Refusing to run on a deployed service.");

  const sourceUrl = process.env.SOURCE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const sourceToken = process.env.SOURCE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  if (!sourceUrl) throw new Error("Set SOURCE_TURSO_DATABASE_URL (or TURSO_DATABASE_URL) to the live database.");

  const target = resolveDatabaseConfig();
  const protectedUrls = [sourceUrl, process.env.TURSO_DATABASE_URL].filter(Boolean);
  if (protectedUrls.includes(target.url)) {
    throw new Error("The development database is the same as the live database. Nothing was changed.");
  }
  if (!process.env.DEV_TURSO_DATABASE_URL) {
    throw new Error("Set DEV_TURSO_DATABASE_URL: this script only refreshes a separate Turso development database.");
  }

  const source = createClient({ url: sourceUrl, authToken: sourceToken });
  const dev = createClient({ url: target.url, authToken: target.authToken });

  await applySchema(source, dev);

  const tables = await source.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%' AND name NOT LIKE 'libsql_%' ORDER BY name"
  );

  let total = 0;
  for (const { name } of tables.rows) {
    if (EXCLUDED_TABLES.has(name)) {
      console.log(`skipped  ${name}`);
      continue;
    }
    const count = await copyTable(source, dev, name);
    total += count;
    console.log(`copied   ${name}: ${count} rows`);
  }
  console.log(`Done: ${total} rows copied to the development database.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
