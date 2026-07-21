const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./farm.db");

// Create movements table

db.run(`
CREATE TABLE IF NOT EXISTS movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER,
  fromLocation TEXT,
  toLocation TEXT,
  moveDate TEXT
)
`);
db.run(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task TEXT,
  completed INTEGER DEFAULT 0
)
`);
app.get("/", (req, res) => {
  res.send("Wern Villa Farm Manager API");
});

app.get("/movements", (req, res) => {
  db.all(
    "SELECT * FROM movements ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json(rows);
    }
  );
});
app.get("/tasks", (req, res) => {
  db.all(
    "SELECT * FROM tasks ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json(rows);
    }
  );
});

app.post("/tasks", (req, res) => {
  const { task } = req.body;

  db.run(
    `
    INSERT INTO tasks (task)
    VALUES (?)
    `,
    [task],
    function (err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({
        success: true,
        id: this.lastID,
      });
    }
  );
});

app.post("/movements", (req, res) => {
  const {
    number,
    fromLocation,
    toLocation,
    moveDate,
  } = req.body;

  db.run(
    `
    INSERT INTO movements
    (
      number,
      fromLocation,
      toLocation,
      moveDate
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      number,
      fromLocation,
      toLocation,
      moveDate,
    ],
    function (err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({
        success: true,
        id: this.lastID,
      });
    }
  );
});
app.get("/summary", (req, res) => {
  db.all(
    "SELECT * FROM movements",
    [],
    (err, movementRows) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      let totalMoved = 0;

      movementRows.forEach((move) => {
        totalMoved += move.number;
      });

      db.get(
        `
        SELECT COUNT(*) AS openTasks
        FROM tasks
        WHERE completed = 0
        `,
        [],
        (err, taskRow) => {
          if (err) {
            res.status(500).json(err);
            return;
          }

          res.json({
            totalSheep: 150,
            wernVilla: totalMoved,
            gellidywyll: 150 - totalMoved,
            openTasks: taskRow.openTasks,
          });
        }
      );
    }
  );
});
app.put("/tasks/:id/complete", (req, res) => {
  const { id } = req.params;

  db.run(
    `
    UPDATE tasks
    SET completed = 1
    WHERE id = ?
    `,
    [id],
    function (err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({
        success: true,
      });
    }
  );
});
app.get("/activity", (req, res) => {
  db.all(
    `
    SELECT
      id,
      number,
      fromLocation,
      toLocation,
      moveDate
    FROM movements
    ORDER BY id DESC
    LIMIT 10
    `,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json(rows);
    }
  );
});
app.listen(3001, () => {
  console.log(
    "Farm API running on https://wern-villa-farm-manager.onrender.com"
  );
});