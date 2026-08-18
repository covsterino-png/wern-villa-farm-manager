require("dotenv").config();
const { createClient } = require("@libsql/client");
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

(async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT NOT NULL,
      title TEXT,
      message TEXT,
      data TEXT,
      read INTEGER DEFAULT 0,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ notifications table created");
})();
