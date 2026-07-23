require("dotenv").config();

const { createClient } = require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function viewFields() {
  const result = await db.execute(
    "SELECT * FROM fields ORDER BY id"
  );

  console.log(result.rows);
}

viewFields();