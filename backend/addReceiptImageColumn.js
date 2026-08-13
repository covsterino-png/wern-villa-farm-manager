require("dotenv").config();

const { createClient } = require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addReceiptImageColumn() {
  try {
    await db.execute(`
      ALTER TABLE transactions ADD COLUMN receiptImageUrl TEXT
    `);
    console.log("✅ receiptImageUrl column added to transactions table");
  } catch (e) {
    if (e.message.includes("duplicate column")) {
      console.log("ℹ️  Column already exists");
    } else {
      console.error("Error adding column:", e);
    }
  }
}

addReceiptImageColumn().catch(console.error);
