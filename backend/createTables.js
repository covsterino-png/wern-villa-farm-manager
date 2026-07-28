require("dotenv").config();

const { createClient } = require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS flockGroups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);

  await db.execute(`
CREATE TABLE IF NOT EXISTS medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  doseRate TEXT,
  withdrawalDays INTEGER,
  administrationMethod TEXT
)
    `);
  await db.execute(`  
    CREATE TABLE IF NOT EXISTS pregnancyScans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sheepId INTEGER,
  scanDate TEXT,
  result TEXT
  )
`);

  await db.execute(`
CREATE TABLE IF NOT EXISTS fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  size REAL,
  position INTEGER
)
      `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task TEXT,
      completed INTEGER DEFAULT 0,
      createdBy TEXT,
      completedBy TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER,
      fromLocation TEXT,
      toLocation TEXT,
      moveDate TEXT,
      movedBy TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groupName TEXT,
      treatment TEXT,
      treatmentDate TEXT,
      withdrawalDays INTEGER,
      cost REAL,
      notes TEXT,
      administeredBy TEXT
    )
  `);
  await db.execute(`
  CREATE TABLE IF NOT EXISTS flockRegister (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    count INTEGER,
    currentField TEXT,
    notes TEXT
  )
`);

  console.log("✅ Tables created");
}

createTables().catch(console.error);