// Creates the development database schema (tables and indexes, no rows).
//
// Usage (from backend/):
//   SCHEMA_SOURCE_URL=libsql://... SCHEMA_SOURCE_AUTH_TOKEN=... npm run db:init-dev
//
// The source is only read (sqlite_master). The target is the development
// database from database.js (DEV_TURSO_* or ./dev.db), never TURSO_*.
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });
const { createClient } = require("@libsql/client");
const { isDeployed, resolveDatabaseConfig } = require("../database");

async function applySchema(source, dev) {
  const { rows } = await source.execute(`
    SELECT type, name, sql FROM sqlite_master
    WHERE sql IS NOT NULL
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_litestream_%'
      AND name NOT LIKE 'libsql_%'
    ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name
  `);

  for (const row of rows) {
    const statement = String(row.sql).replace(
      /^CREATE (TABLE|INDEX|UNIQUE INDEX)\s+(?!IF NOT EXISTS)/i,
      "CREATE $1 IF NOT EXISTS "
    );
    await dev.execute(statement);
  }
  return rows.length;
}

async function main() {
  if (isDeployed()) {
    throw new Error("Refusing to run on a deployed service.");
  }

  const sourceUrl = process.env.SCHEMA_SOURCE_URL;
  if (!sourceUrl) {
    throw new Error("Set SCHEMA_SOURCE_URL (and SCHEMA_SOURCE_AUTH_TOKEN if needed) to the database whose schema should be copied.");
  }

  const target = resolveDatabaseConfig();
  if (target.url === sourceUrl) {
    throw new Error("The source and development databases are the same.");
  }

  const source = createClient({ url: sourceUrl, authToken: process.env.SCHEMA_SOURCE_AUTH_TOKEN });
  const dev = createClient({ url: target.url, authToken: target.authToken });
  const count = await applySchema(source, dev);
  console.log(`Applied ${count} schema statements to ${target.url}. No data was copied.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { applySchema };
