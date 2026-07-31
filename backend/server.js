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
const axios = require("axios");


const app = express();

app.use(
  cors({
    origin: "*"
  })

  
);app.use(express.json());

app.post("/sheep/:id/scheduled", async (req, res) => {
  const {
    dueDate,
    eventType,
    notes,
    repeatEvery,
    numberOfEvents,
    repeatUntilResolved,
  } = req.body;
if (repeatUntilResolved) {
  await turso.execute({
    sql: `
      INSERT INTO sheepEvents
      (
        sheepId,
        eventType,
        notes,
        status,
        dueDate,
        autoRepeat,
        repeatEvery,
        repeatNumber
      )
      VALUES
      (?, ?, ?, 'scheduled', ?, 1, ?, 1)
    `,
    args: [
      req.params.id,
      `${eventType} #1`,
      notes,
      dueDate,
      repeatEvery,
    ],
  });

  return res.json({
    success: true,
  });
}  for (
    let i = 0;
    i < numberOfEvents;
    i++
  ) {
    const date = new Date(dueDate);

    date.setDate(
      date.getDate() +
        i * repeatEvery
    );

    const formattedDate =
      date
        .toISOString()
        .split("T")[0];

    const title =
      numberOfEvents > 1
        ? `${eventType} ${
            i + 1
          } of ${numberOfEvents}`
        : eventType;

    await turso.execute({
      sql: `
        INSERT INTO sheepEvents
        (
          sheepId,
          eventType,
          notes,
          status,
          dueDate
        )
        VALUES (?, ?, ?, 'scheduled', ?)
      `,
      args: [
        req.params.id,
        title,
        notes,
        formattedDate,
      ],
    });
  }

  res.json({
    success: true,
  });
});

app.post("/receipts/ocr", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      null,
      {
        params: {
          apikey: process.env.OCR_SPACE_API_KEY,
          url: imageUrl,
          language: "eng",
        },
      }
    );

    const rawText =
      response.data.ParsedResults?.[0]
        ?.ParsedText || "";

    await turso.execute({
      sql: `
        INSERT INTO receipts
        (
          imageUrl,
          rawText,
          createdDate
        )
        VALUES
        (?, ?, DATE('now'))
      `,
      args: [
        imageUrl,
        rawText,
      ],
    });

    res.json({
      success: true,
      rawText,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/sheep/group/:groupName", async (req, res) => {
  try {
    const { groupName } = req.params;

    const result = await turso.execute({
      sql: `
        SELECT *
        FROM sheep
        WHERE groupName = ?
        ORDER BY name
      `,
      args: [groupName],
    });

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.put("/scheduled/:id/complete", async (req, res) => {
  const event = await turso.execute({
    sql: `
      SELECT *
      FROM sheepEvents
      WHERE id = ?
    `,
    args: [req.params.id],
  });

  const scheduledEvent =
    event.rows[0];
    if (scheduledEvent.autoRepeat) {
  const nextDate = new Date(
    scheduledEvent.dueDate
  );

  nextDate.setDate(
    nextDate.getDate() +
    scheduledEvent.repeatEvery
  );

  await turso.execute({
    sql: `
      INSERT INTO sheepEvents
      (
        sheepId,
        eventType,
        notes,
        status,
        dueDate,
        autoRepeat,
        repeatEvery,
        repeatNumber
      )
      VALUES
      (?, ?, ?, 'scheduled', ?, 1, ?, ?)
    `,
    args: [
      scheduledEvent.sheepId,
      `${scheduledEvent.eventType.replace(
        / #\d+$/,
        ""
      )} #${
        scheduledEvent.repeatNumber + 1
      }`,
      scheduledEvent.notes,
      nextDate
        .toISOString()
        .split("T")[0],
      scheduledEvent.repeatEvery,
      scheduledEvent.repeatNumber + 1,
    ],
  });
}

  await turso.execute({
    sql: `
      UPDATE sheepEvents
      SET status = 'completed'
      WHERE id = ?
    `,
    args: [req.params.id],
  });

  await turso.execute({
    sql: `
      INSERT INTO sheepHistory
      (
        sheepId,
        eventType,
        details,
        eventDate
      )
      VALUES (?, ?, ?, ?)
    `,
    args: [
      scheduledEvent.sheepId,
      scheduledEvent.eventType,
      scheduledEvent.notes,
      new Date()
        .toISOString()
        .split("T")[0],
    ],
  });

  res.json({
    success: true,
  });
});
app.get("/tasks/today", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT
          sheepEvents.*,
          sheep.name AS sheepName
        FROM sheepEvents
        JOIN sheep
          ON sheep.id = sheepEvents.sheepId
        WHERE sheepEvents.status = 'scheduled'
        AND sheepEvents.dueDate <= date('now')
        ORDER BY sheepEvents.dueDate
      `,
    });

    res.json(result.rows);
  } catch (err) {
    console.error("TASKS TODAY ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});
app.get("/sheep/:id/scheduled", async (req, res) => {
  const result = await turso.execute({
    sql: `
      SELECT *
      FROM sheepEvents
      WHERE sheepId = ?
      AND status = 'scheduled'
      ORDER BY dueDate
    `,
    args: [req.params.id],
  });

  res.json(result.rows);
});

app.get("/sheep/:id/weights", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT *
        FROM weights
        WHERE sheepId = ?
        ORDER BY weightDate DESC
      `,
      args: [req.params.id],
    });

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.post("/sheep/:id/weights", async (req, res) => {
  try {
    const { weight, weightDate } =
      req.body;

    await turso.execute({
      sql: `
        INSERT INTO weights
        (
          sheepId,
          weight,
          weightDate
        )
        VALUES (?, ?, ?)
      `,
      args: [
        req.params.id,
        weight,
        weightDate,
      ],
    });

    await turso.execute({
      sql: `
        INSERT INTO sheepHistory
        (
          sheepId,
          eventType,
          details
        )
        VALUES (?, ?, ?)
      `,
      args: [
        req.params.id,
        "Weight Recorded",
        `${weight} kg`,
      ],
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.get("/sheep/:id/lambings", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT *
        FROM lambings
        WHERE sheepId = ?
        ORDER BY lambingDate DESC
      `,
      args: [req.params.id],
    });

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.post("/sheep/:id/lambings", async (req, res) => {
  try {
    const {
      lambingDate,
      males,
      females,
      dead,
      notes,
    } = req.body;

    await turso.execute({
      sql: `
        INSERT INTO lambings
        (
          sheepId,
          lambingDate,
          males,
          females,
          dead,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        req.params.id,
        lambingDate,
        males,
        females,
        dead,
        notes,
      ],
    });

    const totalBorn =
      Number(males) +
      Number(females);

    await turso.execute({
      sql: `
        INSERT INTO sheepHistory
        (
          sheepId,
          eventType,
          details
        )
        VALUES (?, ?, ?)
      `,
      args: [
        req.params.id,
        "Lambing",
        `${totalBorn} lambs born (${males} male, ${females} female)`,
      ],
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.get("/sheep/:id/events", async (req, res) => {
  const result =
    await turso.execute({
      sql: `
        SELECT *
        FROM sheepEvents
        WHERE sheepId = ?
        ORDER BY eventDate DESC
      `,
      args: [req.params.id],
    });

  res.json(result.rows);
});

app.post("/sheep/:id/events", async (req, res) => {
  const {
    eventDate,
    eventType,
    notes,
  } = req.body;

  await turso.execute({
    sql: `
      INSERT INTO sheepEvents
      (
        sheepId,
        eventDate,
        eventType,
        notes
      )
      VALUES (?, ?, ?, ?)
    `,
    args: [
      req.params.id,
      eventDate,
      eventType,
      notes,
    ],
  });

  await turso.execute({
    sql: `
      INSERT INTO sheepHistory
      (
        sheepId,
        eventType,
        details,
        eventDate
      )
      VALUES (?, ?, ?, ?)
    `,
    args: [
      req.params.id,
      eventType,
      notes,
      eventDate,
    ],
  });

  res.json({
    success: true,
  });
});
app.get("/sheep-history", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM sheepHistory ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/", (req, res) => {
  res.send("Wern Villa Farm Manager API");
});
app.get("/test-fields", (req, res) => {
  res.json({
    success: true,
    message: "Fields route is alive",
  });
});
app.get("/sheep", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM sheep ORDER BY name"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get(
  "/sheep/:id/history",
  async (req, res) => {
    try {
      const result =
        await turso.execute({
          sql: `
            SELECT *
            FROM sheepHistory
            WHERE sheepId = ?
            ORDER BY id DESC
          `,
          args: [req.params.id],
        });

      res.json(result.rows);
    } catch (error) {
      res.status(500).json(error);
    }
  }
);
app.get("/flock-register", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM flockRegister ORDER BY name"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/recent-history", async (req, res) => {
  try {
    const result = await turso.execute(`
      SELECT *
      FROM sheepHistory
      ORDER BY eventDate DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/sheep/:id/scans", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT *
        FROM pregnancyScans
        WHERE sheepId = ?
        ORDER BY scanDate DESC
      `,
      args: [req.params.id],
    });

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
app.post("/sheep/:id/scans", async (req, res) => {
  try {
    const { scanDate, result } = req.body;

    await turso.execute({
      sql: `
        INSERT INTO pregnancyScans
        (
          sheepId,
          scanDate,
          result
        )
        VALUES (?, ?, ?)
      `,
      args: [
        req.params.id,
        scanDate,
        result,
      ],
    });

    await turso.execute({
      sql: `
        INSERT INTO sheepHistory
        (
          sheepId,
          eventType,
          details
        )
        VALUES (?, ?, ?)
      `,
      args: [
        req.params.id,
        "Pregnancy Scan",
        result,
      ],
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
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
app.get("/flock-register-summary", async (req, res) => {
  try {
    const groups = await turso.execute(
      "SELECT * FROM flockRegister ORDER BY name"
    );

    const sheep = await turso.execute(
      "SELECT groupName FROM sheep"
    );

    const summary = groups.rows.map(
      (group) => {
        const count = sheep.rows.filter(
          (s) =>
            s.groupName === group.name
        ).length;

        return {
          ...group,
          sheepCount: count,
        };
      }
    );

    res.json(summary);
  } catch (error) {
    res.status(500).json(error);
  }
});
app.post("/move-group", async (req, res) => {
  try {
    const { groupName, newField } =
      req.body;

    await turso.execute({
      sql: `
        UPDATE flockRegister
        SET currentField = ?
        WHERE name = ?
      `,
      args: [newField, groupName],
    });

    await turso.execute({
      sql: `
        UPDATE sheep
        SET currentField = ?
        WHERE groupName = ?
      `,
      args: [newField, groupName],
    });
    const sheepResult =
  await turso.execute({
    sql: `
      SELECT id
      FROM sheep
      WHERE groupName = ?
    `,
    args: [groupName],
  });

for (const sheep of sheepResult.rows) {
  await turso.execute({
    sql: `
      INSERT INTO sheepHistory
      (
        sheepId,
        eventType,
        details
      )
      VALUES (?, ?, ?)
    `,
    args: [
      sheep.id,
      "Movement",
      `Moved to ${newField}`,
    ],
  });
}

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.put("/sheep/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      eid,
      sex,
      dob,
      groupName,
      mother,
      currentField,
      status,
      notes,
    } = req.body;

    await turso.execute({
      sql: `
        UPDATE sheep
        SET
          name = ?,
          eid = ?,
          sex = ?,
          dob = ?,
          groupName = ?,
          mother = ?,
          currentField = ?,
          status = ?,
          notes = ?
        WHERE id = ?
      `,
      args: [
        name,
        eid,
        sex,
        dob,
        groupName,
        mother,
        currentField,
        status,
        notes,
        id,
      ],
    });

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/flock-register", async (req, res) => {
  try {
    console.log(req.body);
    const {
      name,
      currentField,
      notes,
    } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO flockRegister
        (
          name,
          currentField,
          notes
        )
        VALUES (?, ?, ?)
      `,
      args: [
        name,
        currentField,
        notes,
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
app.post("/sheep", async (req, res) => {
  try {
    const {
      name,
      eid,
      sex,
      dob,
      groupName,
      mother,
      currentField,
      status,
      notes,
    } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO sheep
        (
          name,
          eid,
          sex,
          dob,
          groupName,
          mother,
          currentField,
          status,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        name,
        eid,
        sex,
        dob,
        groupName,
        mother,
        currentField,
        status,
        notes,
      ],
    });
    const sheepId = Number(
  result.lastInsertRowid
);

await turso.execute({
  sql: `
    INSERT INTO sheepHistory
    (
      sheepId,
      eventType,
      details
    )
    VALUES (?, ?, ?)
  `,
  args: [
    sheepId,
    "Created",
    "Sheep record created",
  ],
});

res.json({
  success: true,
  id: sheepId,
});
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
    const sheepResult = await turso.execute(
      "SELECT COUNT(*) AS count FROM sheep"
    );

    const groupsResult = await turso.execute(
      "SELECT COUNT(*) AS count FROM flockRegister"
    );

const fieldsResult = await turso.execute(
  "SELECT COUNT(DISTINCT currentField) AS count FROM flockRegister WHERE currentField IS NOT NULL AND currentField != ''"
);

    const tasksResult = await turso.execute(`
      SELECT COUNT(*) AS openTasks
      FROM tasks
      WHERE completed = 0
    `);

    res.json({
      totalSheep: Number(
        sheepResult.rows[0].count
      ),

      groups: Number(
        groupsResult.rows[0].count
      ),

      occupiedFields: Number(
        fieldsResult.rows[0].count
      ),

      openTasks: Number(
        tasksResult.rows[0].openTasks
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
const { name, size } = req.body;
    const result =
      await turso.execute({
        sql: `
INSERT INTO fields (
  name,
  size
)
VALUES (?, ?)
        `,
        args: [name, size],
      });

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.put("/fields/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      size,
      position,
    } = req.body;

    await turso.execute({
      sql: `
        UPDATE fields
        SET
          name = ?,
          size = ?,
          position = ?
        WHERE id = ?
      `,
      args: [
        name,
        size,
        position,
        id,
      ],
    });

    res.json({
      success: true,
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
    const {
      name,
      doseRate,
      withdrawalDays,
      administrationMethod,
    } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO medicines (
          name,
          doseRate,
          withdrawalDays,
          administrationMethod
        )
        VALUES (?, ?, ?, ?)
      `,
      args: [
        name,
        doseRate,
        withdrawalDays,
        administrationMethod,
      ],
    });

    res.json({
      success: true,
      id: Number(
        result.lastInsertRowid
      ),
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

    const groupsResult = await turso.execute(
      "SELECT * FROM flockRegister"
    );

    const sheepResult = await turso.execute(
      "SELECT * FROM sheep"
    );

    const fieldStatus = fieldsResult.rows.map(
      (field) => {
        const groupsInField =
          groupsResult.rows.filter(
            (group) =>
              group.currentField ===
              field.name
          );

        const sheepCount =
          sheepResult.rows.filter(
            (sheep) =>
              sheep.currentField ===
              field.name
          ).length;

        return {
          name: field.name,
          size: field.size,
          position: field.position,
          sheepCount,
          occupied:
            groupsInField.length > 0,
          groups:
            groupsInField.map(
              (group) => group.name
            ),
          daysEmpty: 0,
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