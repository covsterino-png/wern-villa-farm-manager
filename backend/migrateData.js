require("dotenv").config();

const sqlite3 = require("sqlite3").verbose();
const { createClient } = require("@libsql/client");

const sqliteDb = new sqlite3.Database("./farm.db");

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function getRows(sql) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrate() {
  console.log("Migrating fields...");
  const fields = await getRows("SELECT * FROM fields");

  for (const field of fields) {
    await turso.execute({
      sql: "INSERT INTO fields (id, name) VALUES (?, ?)",
      args: [field.id, field.name],
    });
  }

  console.log("Migrating medicines...");
  const medicines = await getRows("SELECT * FROM medicines");

  for (const medicine of medicines) {
    await turso.execute({
      sql: "INSERT INTO medicines (id, name) VALUES (?, ?)",
      args: [medicine.id, medicine.name],
    });
  }

  console.log("Migrating flock groups...");
  const flockGroups = await getRows(
    "SELECT * FROM flockGroups"
  );

  for (const group of flockGroups) {
    await turso.execute({
      sql: "INSERT INTO flockGroups (id, name) VALUES (?, ?)",
      args: [group.id, group.name],
    });
  }

  console.log("Migrating tasks...");
  const tasks = await getRows("SELECT * FROM tasks");

  for (const task of tasks) {
    await turso.execute({
      sql: `
      INSERT INTO tasks
      (
        id,
        task,
        completed,
        createdBy,
        completedBy
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        task.id,
        task.task,
        task.completed,
        task.createdBy,
        task.completedBy,
      ],
    });
  }

  console.log("Migrating movements...");
  const movements = await getRows(
    "SELECT * FROM movements"
  );

  for (const move of movements) {
    await turso.execute({
      sql: `
      INSERT INTO movements
      (
        id,
        number,
        fromLocation,
        toLocation,
        moveDate,
        movedBy
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        move.id,
        move.number,
        move.fromLocation,
        move.toLocation,
        move.moveDate,
        move.movedBy,
      ],
    });
  }

  console.log("Migrating treatments...");
  const treatments = await getRows(
    "SELECT * FROM treatments"
  );

  for (const treatment of treatments) {
    await turso.execute({
      sql: `
      INSERT INTO treatments
      (
        id,
        groupName,
        treatment,
        treatmentDate,
        withdrawalDays,
        cost,
        notes,
        administeredBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        treatment.id,
        treatment.groupName,
        treatment.treatment,
        treatment.treatmentDate,
        treatment.withdrawalDays,
        treatment.cost,
        treatment.notes,
        treatment.administeredBy,
      ],
    });
  }

  console.log("✅ Migration complete");
}

migrate().catch(console.error);