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
      CREATE TABLE IF NOT EXISTS sheep (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        eid TEXT,
        sex TEXT,
        dob TEXT,
        groupName TEXT,
        mother TEXT,
        currentField TEXT,
        status TEXT,
        notes TEXT
      )
    `);

    console.log(
      "✅ Sheep table created"
    );
  } catch (error) {
    console.error(error);
  }
}

createTable();