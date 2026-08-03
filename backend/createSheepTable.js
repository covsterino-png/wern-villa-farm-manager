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
    await db.execute(`
  CREATE TABLE IF NOT EXISTS sheepHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sheepId INTEGER NOT NULL,
    eventType TEXT NOT NULL,
    details TEXT,
    createdBy TEXT,
    eventDate DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
await db.execute(`
CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY,
  imageUrl TEXT,
  rawText TEXT,
  createdDate TEXT
)
`);

await db.execute(`
CREATE TABLE sheepTasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sheepId INTEGER NOT NULL,
  taskDate TEXT NOT NULL,
  taskType TEXT NOT NULL,
  notes TEXT,
  completed INTEGER DEFAULT 0
)
`);
await db.execute(`
CREATE TABLE sheepEvents (
  id INTEGER PRIMARY KEY,
  sheepId INTEGER,
  eventDate TEXT,
  eventType TEXT,
  notes TEXT
)
`);
await db.execute(`
CREATE TABLE healthCases (
  id INTEGER PRIMARY KEY,
  sheepId INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  createdDate TEXT DEFAULT CURRENT_DATE,
  resolvedDate TEXT
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