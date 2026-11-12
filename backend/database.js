const { createClient } = require("@libsql/client");

const LOCAL_DEV_DATABASE_URL = "file:./dev.db";

// Render sets RENDER on every deployed service (live and staging alike).
function isDeployed(env = process.env) {
  return Boolean(env.RENDER) || env.NODE_ENV === "production";
}

// Deployed services use TURSO_*. Anywhere else uses DEV_TURSO_* (or a local
// SQLite file), so credentials for the live database in a local .env file are
// never picked up by accident.
function resolveDatabaseConfig(env = process.env) {
  if (isDeployed(env)) {
    if (!env.TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL must be set on deployed services.");
    }
    return {
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
      label: "deployed database",
    };
  }

  return {
    url: env.DEV_TURSO_DATABASE_URL || LOCAL_DEV_DATABASE_URL,
    authToken: env.DEV_TURSO_AUTH_TOKEN,
    label: env.DEV_TURSO_DATABASE_URL ? "development Turso database" : "local development file",
  };
}

function createDatabaseClient(env = process.env) {
  const { url, authToken, label } = resolveDatabaseConfig(env);
  console.log(`Using ${label}: ${url}`);
  return createClient({ url, authToken });
}

module.exports = { createDatabaseClient, resolveDatabaseConfig, isDeployed };
