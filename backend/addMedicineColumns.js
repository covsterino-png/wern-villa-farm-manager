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
      ALTER TABLE medicines
      ADD COLUMN doseRate TEXT
    `);

    await db.execute(`
      ALTER TABLE medicines
      ADD COLUMN withdrawalDays INTEGER
    `);

    await db.execute(`
      ALTER TABLE medicines
      ADD COLUMN administrationMethod TEXT
    `);

    console.log(
      "✅ Medicine table updated"
    );
  } catch (error) {
    console.log(error.message);
  }
}

updateTable();