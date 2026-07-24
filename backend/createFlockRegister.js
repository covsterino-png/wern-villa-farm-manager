require("dotenv").config();

const { createClient } =
  require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken:
    process.env.TURSO_AUTH_TOKEN,
});

async function createTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS flockRegister (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        count INTEGER,
        currentField TEXT,
        notes TEXT
      )
    `);

    console.log(
      "✅ Flock Register table created"
    );
  } catch (error) {
    console.error(error);
  }
}

createTable();