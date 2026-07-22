const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(
  cors({
    origin: "*"
  })
);app.use(express.json());

const db = new sqlite3.Database("./farm.db");

db.run(`
ALTER TABLE movements
ADD COLUMN movedBy TEXT
`, (err) => {
  if (err) {
    console.log("movedBy column already exists");
  }
});

db.run(`
ALTER TABLE tasks
ADD COLUMN createdBy TEXT
`, (err) => {
  if (err) {
    console.log("createdBy column already exists");
  }
});

db.run(`
ALTER TABLE tasks
ADD COLUMN completedBy TEXT
`, (err) => {
  if (err) {
    console.log("completedBy column already exists");
  }
});

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
  completed INTEGER DEFAULT 0,
  createdBy TEXT,
  completedBy TEXT
)
`);
db.run(`
CREATE TABLE IF NOT EXISTS fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
)
`);
app.get("/", (req, res) => {
  res.send("Wern Villa Farm Manager API");
});
app.get("/test-fields", (req, res) => {
  res.json({
    success: true,
    message: "Fields route is alive",
  });
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
const { task, createdBy } = req.body;
  db.run(
    `
INSERT INTO tasks (task, createdBy)
VALUES (?, ?)
    `,
    [task, createdBy],
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
  movedBy,
} = req.body;
  db.run(
    `
INSERT INTO movements
(
  number,
  fromLocation,
  toLocation,
  moveDate,
  movedBy
)
VALUES (?, ?, ?, ?, ?)
    `,
[
  number,
  fromLocation,
  toLocation,
  moveDate,
  movedBy,
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
  const { completedBy } = req.body;

  db.run(
    `
    UPDATE tasks
    SET completed = 1,
        completedBy = ?
    WHERE id = ?
    `,
    [completedBy, id],
    
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
app.get("/debug-tasks", (req, res) => {
  db.all(
    "SELECT * FROM tasks",
    [],
    (err, rows) => {
      res.json(rows);
    }
  );
});
app.get("/debug-movements", (req, res) => {
  db.all(
    "SELECT * FROM movements",
    [],
    (err, rows) => {
      res.json(rows);
    }
  );
});
app.get("/fields", (req, res) => {
  db.all(
    "SELECT * FROM fields ORDER BY name",
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

app.post("/fields", (req, res) => {
  const { name } = req.body;

  db.run(
    `
    INSERT INTO fields (name)
    VALUES (?)
    `,
    [name],
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
app.listen(3001, () => {
  console.log(
    "Farm API running on https://wern-villa-api.onrender.com"
  );
});