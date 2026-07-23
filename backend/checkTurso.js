require("dotenv").config();

const { createClient } = require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function check() {
  const fields =
    await db.execute(
      "SELECT COUNT(*) AS count FROM fields"
    );

  const tasks =
    await db.execute(
      "SELECT COUNT(*) AS count FROM tasks"
    );

  const movements =
    await db.execute(
      "SELECT COUNT(*) AS count FROM movements"
    );

  const treatments =
    await db.execute(
      "SELECT COUNT(*) AS count FROM treatments"
    );

  console.log("Fields:", fields.rows);
  console.log("Tasks:", tasks.rows);
  console.log("Movements:", movements.rows);
  console.log("Treatments:", treatments.rows);
}

check();
