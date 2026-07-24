require("dotenv").config();

const { createClient } =
  require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken:
    process.env.TURSO_AUTH_TOKEN,
});

async function updateTable() {
  try {
    await db.execute(`
      ALTER TABLE fields
      ADD COLUMN position INTEGER
    `);

    console.log(
      "✅ Position column added"
    );
  } catch (error) {
    console.log(error.message);
  }
}

updateTable();