require("dotenv").config();

const { createClient } =
  require("@libsql/client");

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken:
    process.env.TURSO_AUTH_TOKEN,
});
const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "*"
  })
);app.use(express.json());


app.get("/", (req, res) => {
  res.send("Wern Villa Farm Manager API");
});
app.get("/test-fields", (req, res) => {
  res.json({
    success: true,
    message: "Fields route is alive",
  });
});

app.get("/movements", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM movements ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/field-status", async (req, res) => {
  try {
    const fieldsResult = await turso.execute(
      "SELECT * FROM fields ORDER BY name"
    );

    const movementsResult = await turso.execute(
      "SELECT * FROM movements ORDER BY id ASC"
    );

    const today = new Date();

    const fieldStatus = fieldsResult.rows.map(
      (field) => {
        const fieldName = field.name;

        let sheepCount = 0;
        let lastMoveOut = null;

        movementsResult.rows.forEach((move) => {
          const count = Number(move.number || 0);

          if (move.toLocation === fieldName) {
            sheepCount += count;
          }

          if (move.fromLocation === fieldName) {
            sheepCount -= count;
            lastMoveOut = move.moveDate;
          }
        });

        let daysEmpty = 0;

        if (sheepCount <= 0 && lastMoveOut) {
          const parts = lastMoveOut.split("/");

          const moveDate = new Date(
            parts[2],
            parts[1] - 1,
            parts[0]
          );

          const diffMs =
            today.getTime() - moveDate.getTime();

          daysEmpty = Math.floor(
            diffMs / (1000 * 60 * 60 * 24)
          );
        }

        return {
          name: fieldName,
          sheepCount,
          daysEmpty,
          occupied: sheepCount > 0,
        };
      }
    );

    res.json(fieldStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
app.get("/tasks", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM tasks ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { task, createdBy } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO tasks
        (task, createdBy)
        VALUES (?, ?)
      `,
      args: [task, createdBy],
    });

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/movements", async (req, res) => {
  try {
    const {
      number,
      fromLocation,
      toLocation,
      moveDate,
      movedBy,
    } = req.body;

    const result = await turso.execute({
      sql: `
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
      args: [
        number,
        fromLocation,
        toLocation,
        moveDate,
        movedBy,
      ],
    });

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/summary", async (req, res) => {
  try {
    const movementResult = await turso.execute(
      "SELECT * FROM movements"
    );

    let totalMoved = 0;

    movementResult.rows.forEach((move) => {
      totalMoved += Number(move.number || 0);
    });

    const taskResult = await turso.execute(`
      SELECT COUNT(*) AS openTasks
      FROM tasks
      WHERE completed = 0
    `);

    res.json({
      totalSheep: 150,
      wernVilla: totalMoved,
      gellidywyll: 150 - totalMoved,
      openTasks: Number(
        taskResult.rows[0].openTasks
      ),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
app.put("/tasks/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const { completedBy } = req.body;

    await turso.execute({
      sql: `
        UPDATE tasks
        SET completed = 1,
            completedBy = ?
        WHERE id = ?
      `,
      args: [completedBy, id],
    });

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/activity", async (req, res) => {
  try {
    const result = await turso.execute(`
      SELECT
        id,
        number,
        fromLocation,
        toLocation,
        moveDate
      FROM movements
      ORDER BY id DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/fields", async (req, res) => {
  try {
    const result =
      await turso.execute(
        "SELECT * FROM fields ORDER BY name"
      );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/fields", async (req, res) => {
  try {
    const { name } = req.body;

    const result =
      await turso.execute({
        sql: `
          INSERT INTO fields (name)
          VALUES (?)
        `,
        args: [name],
      });

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/treatments", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM treatments ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/treatments", async (req, res) => {
  try {
    const {
      groupName,
      treatment,
      treatmentDate,
      withdrawalDays,
      cost,
      notes,
      administeredBy,
    } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO treatments
        (
          groupName,
          treatment,
          treatmentDate,
          withdrawalDays,
          cost,
          notes,
          administeredBy
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        groupName,
        treatment,
        treatmentDate,
        withdrawalDays,
        cost,
        notes,
        administeredBy,
      ],
    });

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/flock-groups", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM flockGroups ORDER BY name"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/flock-groups", async (req, res) => {
  try {
    const { name } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO flockGroups (name)
        VALUES (?)
      `,
      args: [name],
    });

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/medicines", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM medicines ORDER BY name"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/medicines", async (req, res) => {
  try {
    const { name } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO medicines (name)
        VALUES (?)
      `,
      args: [name],
    });

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/fields-count", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT COUNT(*) AS count FROM fields"
    );

    res.json({
      count: Number(result.rows[0].count),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/treatments-count", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT COUNT(*) AS count FROM treatments"
    );

    res.json({
      count: Number(result.rows[0].count),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/withdrawals-count", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM treatments"
    );

    const today = new Date();

    const active = result.rows.filter((item) => {
      if (!item.withdrawalDays) {
        return false;
      }

      const parts =
        item.treatmentDate.split("/");

      const treatmentDate = new Date(
        parts[2],
        parts[1] - 1,
        parts[0]
      );

      const withdrawalEnd =
        new Date(treatmentDate);

      withdrawalEnd.setDate(
        withdrawalEnd.getDate() +
          Number(item.withdrawalDays)
      );

      return withdrawalEnd >= today;
    });

    res.json({
      count: active.length,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/field-status", async (req, res) => {
  try {
    const fieldsResult = await turso.execute(
      "SELECT * FROM fields ORDER BY name"
    );

    const movementsResult = await turso.execute(
      "SELECT * FROM movements ORDER BY id ASC"
    );

    const today = new Date();

    const fieldStatus = fieldsResult.rows.map(
      (field) => {
        const fieldName = field.name;

        let sheepCount = 0;
        let lastMoveOut = null;

        movementsResult.rows.forEach((move) => {
          const count = Number(move.number || 0);

          if (move.toLocation === fieldName) {
            sheepCount += count;
          }

          if (move.fromLocation === fieldName) {
            sheepCount -= count;
            lastMoveOut = move.moveDate;
          }
        });

        let daysEmpty = 0;

        if (sheepCount <= 0 && lastMoveOut) {
          const parts = lastMoveOut.split("/");

          const moveDate = new Date(
            parts[2],
            parts[1] - 1,
            parts[0]
          );

          const diffMs =
            today.getTime() - moveDate.getTime();

          daysEmpty = Math.floor(
            diffMs / (1000 * 60 * 60 * 24)
          );
        }

        return {
          name: fieldName,
          sheepCount,
          daysEmpty,
          occupied: sheepCount > 0,
        };
      }
    );

    res.json(fieldStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
app.get("/field-status", async (req, res) => {
  try {
    const fieldsResult = await turso.execute(
      "SELECT * FROM fields ORDER BY name"
    );

    const movementsResult = await turso.execute(
      "SELECT * FROM movements ORDER BY id ASC"
    );

    const today = new Date();

    const fieldStatus = fieldsResult.rows.map(
      (field) => {
        const fieldName = field.name;

        let sheepCount = 0;
        let lastMoveOut = null;

        movementsResult.rows.forEach((move) => {
          const count = Number(move.number || 0);

          if (move.toLocation === fieldName) {
            sheepCount += count;
          }

          if (move.fromLocation === fieldName) {
            sheepCount -= count;
            lastMoveOut = move.moveDate;
          }
        });

        let daysEmpty = 0;

        if (
          sheepCount <= 0 &&
          lastMoveOut
        ) {
          const parts =
            lastMoveOut.split("/");

          const moveDate = new Date(
            parts[2],
            parts[1] - 1,
            parts[0]
          );

          const diffMs =
            today.getTime() -
            moveDate.getTime();

          daysEmpty = Math.floor(
            diffMs /
              (1000 * 60 * 60 * 24)
          );
        }

const currentSheep =
  sheepCount < 0 ? 0 : sheepCount;

return {
  name: fieldName,
  sheepCount: currentSheep,
  daysEmpty,
  occupied: currentSheep > 0,
};
      }
    );

    res.json(fieldStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
app.listen(3001, () => {
  console.log(
    "Farm API running on https://wern-villa-api.onrender.com"
  );
});