require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });
const crypto = require("crypto");
const {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} = require("@simplewebauthn/server");

const { createClient } =
  require("@libsql/client");
const cloudinary = require("cloudinary").v2;
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken:
    process.env.TURSO_AUTH_TOKEN,
});
const cron = require("node-cron");
// email sending removed (SendGrid) — using in-app notifications only
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const express = require("express");

const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const app = express();
const upload = multer();

const authSecret = process.env.AUTH_SECRET;
const loginUsers = {
  David: process.env.DAVID_PASSWORD,
  Gemma: process.env.GEMMA_PASSWORD,
};
const authSetupKey = process.env.AUTH_SETUP_KEY;
const rpName = "Wern Villa Farm Manager";
const rpID = process.env.WEBAUTHN_RP_ID || "wern-villa-frontend.onrender.com";
const expectedOrigin = process.env.WEBAUTHN_ORIGIN || "https://wern-villa-frontend.onrender.com";
const passkeyChallenges = new Map();

function createSessionToken(user) {
  const payload = Buffer.from(JSON.stringify({
    user,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", authSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSessionToken(token) {
  if (!authSecret || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", authSecret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16)) {
  return {
    salt: salt.toString("base64url"),
    hash: crypto.scryptSync(password, salt, 64).toString("base64url"),
  };
}

function passwordsMatch(password, storedHash, storedSalt) {
  const candidate = crypto.scryptSync(password, Buffer.from(storedSalt, "base64url"), 64);
  const expected = Buffer.from(storedHash, "base64url");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

async function ensureTransactionsTable() {
  await turso.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transDate TEXT,
        description TEXT,
        amount REAL,
        payer TEXT,
        payee TEXT,
        shared INTEGER DEFAULT 0,
        settled INTEGER DEFAULT 0,
        createdDate TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `,
  });
}

async function ensurePasskeysTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS passkeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT NOT NULL,
      credentialId TEXT NOT NULL UNIQUE,
      publicKey TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureAuthUsersTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS authUsers (
      userName TEXT PRIMARY KEY,
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT NOT NULL,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureHeroPointsTables() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS heroPoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      points INTEGER NOT NULL,
      description TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedBy TEXT,
      updatedDate TEXT
    )
  `);
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS heroRewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cost INTEGER NOT NULL,
      active INTEGER DEFAULT 1,
      createdBy TEXT NOT NULL,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedDate TEXT
    )
  `);
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS heroRedemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rewardId INTEGER NOT NULL,
      rewardName TEXT NOT NULL,
      cost INTEGER NOT NULL,
      requestedBy TEXT NOT NULL,
      requestedDate TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'requested',
      completedBy TEXT,
      completedDate TEXT
    )
  `);
}

async function ensureReceiptsTable() {
  await turso.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imageUrl TEXT,
        rawText TEXT,
        supplier TEXT,
        total REAL,
        createdDate TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `,
  });

  for (const column of ["supplier TEXT", "total REAL"]) {
    try {
      await turso.execute(`ALTER TABLE receipts ADD COLUMN ${column}`);
    } catch (error) {
      if (!error.message.includes("duplicate column")) {
        throw error;
      }
    }
  }
}

app.use(
  cors({
    origin: "*"
  })

  
);app.use(express.json());

async function getStoredUser(username) {
  const result = await turso.execute({
    sql: "SELECT * FROM authUsers WHERE userName = ?",
    args: [username],
  });
  return result.rows[0] || null;
}

function isValidUserName(username) {
  return username === "David" || username === "Gemma";
}

app.post("/auth/setup-password", async (req, res) => {
  try {
    const { username, password, setupKey } = req.body || {};
    if (!authSetupKey) return res.status(503).json({ error: "Password setup is not configured on the server" });
    if (!isValidUserName(username)) return res.status(400).json({ error: "Unknown user" });
    if (setupKey !== authSetupKey) return res.status(401).json({ error: "The setup key is incorrect" });
    if (typeof password !== "string" || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    if (await getStoredUser(username)) return res.status(409).json({ error: "This user already has a password" });
    const { hash, salt } = hashPassword(password);
    await turso.execute({
      sql: "INSERT INTO authUsers (userName, passwordHash, passwordSalt) VALUES (?, ?, ?)",
      args: [username, hash, salt],
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Password setup error:", error);
    return res.status(500).json({ error: "Could not set password" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  const storedUser = await getStoredUser(username);
  const passwordIsValid = storedUser
    ? typeof password === "string" && passwordsMatch(password, storedUser.passwordHash, storedUser.passwordSalt)
    : typeof password === "string" && loginUsers[username] && password === loginUsers[username];
  if (!authSecret || !isValidUserName(username) || !passwordIsValid) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  return res.json({ user: username, token: createSessionToken(username) });
});

app.use((req, res, next) => {
  if (
    req.path === "/" ||
    req.path === "/auth/login" ||
    req.path === "/auth/setup-password" ||
    req.path === "/auth/passkey/login/options" ||
    req.path === "/auth/passkey/login/verify"
  ) return next();
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  const session = readSessionToken(token);
  if (!session) return res.status(401).json({ error: "Authentication required" });
  req.user = session.user;
  return next();
});

app.post("/auth/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof newPassword !== "string" || newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    const storedUser = await getStoredUser(req.user);
    const currentIsValid = storedUser
      ? typeof currentPassword === "string" && passwordsMatch(currentPassword, storedUser.passwordHash, storedUser.passwordSalt)
      : typeof currentPassword === "string" && currentPassword === loginUsers[req.user];
    if (!currentIsValid) return res.status(401).json({ error: "Current password is incorrect" });
    const { hash, salt } = hashPassword(newPassword);
    await turso.execute({
      sql: `
        INSERT INTO authUsers (userName, passwordHash, passwordSalt)
        VALUES (?, ?, ?)
        ON CONFLICT(userName) DO UPDATE SET
          passwordHash = excluded.passwordHash,
          passwordSalt = excluded.passwordSalt,
          updatedDate = CURRENT_TIMESTAMP
      `,
      args: [req.user, hash, salt],
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Password change error:", error);
    return res.status(500).json({ error: "Could not change password" });
  }
});

app.post("/auth/passkey/login/options", async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!isValidUserName(username)) return res.status(400).json({ error: "Unknown user" });
    const result = await turso.execute({
      sql: "SELECT credentialId, transports FROM passkeys WHERE userName = ?",
      args: [username],
    });
    if (result.rows.length === 0) return res.status(404).json({ error: "No passkey registered for this user" });
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      allowCredentials: result.rows.map((row) => ({
        id: row.credentialId,
        transports: row.transports ? JSON.parse(row.transports) : undefined,
      })),
    });
    passkeyChallenges.set(`login:${username}`, options.challenge);
    return res.json(options);
  } catch (error) {
    console.error("Passkey login options error:", error);
    return res.status(500).json({ error: "Could not start passkey login" });
  }
});

app.post("/auth/passkey/login/verify", async (req, res) => {
  try {
    const { username, response } = req.body || {};
    const expectedChallenge = passkeyChallenges.get(`login:${username}`);
    passkeyChallenges.delete(`login:${username}`);
    if (!expectedChallenge || !isValidUserName(username)) return res.status(400).json({ error: "Passkey login has expired" });
    const result = await turso.execute({
      sql: "SELECT * FROM passkeys WHERE userName = ? AND credentialId = ?",
      args: [username, response?.id],
    });
    const stored = result.rows[0];
    if (!stored) return res.status(401).json({ error: "This passkey is not registered" });
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: stored.credentialId,
        publicKey: Buffer.from(stored.publicKey, "base64url"),
        counter: Number(stored.counter),
        transports: stored.transports ? JSON.parse(stored.transports) : undefined,
      },
    });
    if (!verification.verified) return res.status(401).json({ error: "Passkey verification failed" });
    await turso.execute({
      sql: "UPDATE passkeys SET counter = ? WHERE credentialId = ?",
      args: [verification.authenticationInfo.newCounter, stored.credentialId],
    });
    return res.json({ user: username, token: createSessionToken(username) });
  } catch (error) {
    console.error("Passkey login verification error:", error);
    return res.status(401).json({ error: "Passkey verification failed" });
  }
});

app.post("/auth/passkey/register/options", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: "SELECT credentialId FROM passkeys WHERE userName = ?",
      args: [req.user],
    });
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: req.user,
      userDisplayName: req.user,
      userID: Buffer.from(req.user),
      attestationType: "none",
      userVerification: "required",
      excludeCredentials: result.rows.map((row) => ({ id: row.credentialId })),
    });
    passkeyChallenges.set(`register:${req.user}`, options.challenge);
    return res.json(options);
  } catch (error) {
    console.error("Passkey registration options error:", error);
    return res.status(500).json({ error: "Could not start passkey registration" });
  }
});

app.post("/auth/passkey/register/verify", async (req, res) => {
  try {
    const expectedChallenge = passkeyChallenges.get(`register:${req.user}`);
    passkeyChallenges.delete(`register:${req.user}`);
    if (!expectedChallenge) return res.status(400).json({ error: "Passkey registration has expired" });
    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });
    if (!verification.verified || !verification.registrationInfo) return res.status(400).json({ error: "Passkey registration failed" });
    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    await turso.execute({
      sql: "INSERT INTO passkeys (userName, credentialId, publicKey, counter, transports) VALUES (?, ?, ?, ?, ?)",
      args: [req.user, credential.id, Buffer.from(credential.publicKey).toString("base64url"), credential.counter, JSON.stringify(req.body.response?.transports || [])],
    });
    return res.json({ success: true, credentialDeviceType, credentialBackedUp });
  } catch (error) {
    console.error("Passkey registration verification error:", error);
    return res.status(400).json({ error: "Passkey registration failed" });
  }
});

ensureTransactionsTable().catch((error) => {
  console.error("Failed to ensure transactions table:", error);
});

ensureReceiptsTable().catch((error) => {
  console.error("Failed to ensure receipts table:", error);
});

app.post("/sheep/:id/scheduled", async (req, res) => {
  console.log(req.body);
  const {
    dueDate,
    eventType,
    notes,
    repeatEvery,
    numberOfEvents,
    repeatUntilResolved,
    caseId,
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
        repeatNumber,
        caseId
      )
      VALUES
      (?, ?, ?, 'scheduled', ?, 1, ?, 1, ?)
    `,
    args: [
      req.params.id,
      `${eventType} #1`,
      notes,
      dueDate,
      repeatEvery,
      caseId,
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
          dueDate,
          caseId
        )
        VALUES (?, ?, ?, 'scheduled', ?, ?)
      `,
      args: [
        req.params.id,
        title,
        notes,
        formattedDate,
        caseId,
      ],
    });
  }

  res.json({
    success: true,
  });
});

app.get("/receipts/:id", async (req, res) => {
  try {
    const receipt = await turso.execute({
      sql: `
        SELECT *
        FROM receipts
        WHERE id = ?
      `,
      args: [req.params.id],
    });

    const items = await turso.execute({
      sql: `
        SELECT *
        FROM receiptItems
        WHERE receiptId = ?
      `,
      args: [req.params.id],
    });

    res.json({
      receipt: receipt.rows[0],
      items: items.rows,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/receipts", async (req, res) => {
  try {
    const result = await turso.execute(`
      SELECT *
      FROM receipts
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// Financial transactions: create / list / settle
app.get("/transactions", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT *
        FROM transactions
        ORDER BY id DESC
      `,
    });

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.post("/transactions", upload.single("receipt"), async (req, res) => {
  try {
    const {
      transDate,
      description,
      amount,
      payer,
      payee,
      shared,
    } = req.body;

    let receiptImageUrl = null;

    if (req.file) {
      try {
        const uploadResult =
          await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
            {
              folder: "transaction-receipts",
            }
          );
        receiptImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
      }
    }

    await turso.execute({
      sql: `
        INSERT INTO transactions
        (transDate, description, amount, payer, payee, shared, receiptImageUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        transDate,
        description,
        amount,
        payer,
        payee,
        shared ? 1 : 0,
        receiptImageUrl,
      ],
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.put("/transactions/:id/settle", async (req, res) => {
  try {
    await turso.execute({
      sql: `
        UPDATE transactions
        SET settled = 1,
            amount = 0
        WHERE id = ?
      `,
      args: [req.params.id],
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.post(
  "/receipts/ocr",
  upload.single("receipt"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
        });
      }

      const formData = new FormData();

      formData.append(
        "apikey",
        process.env.OCR_SPACE_API_KEY
      );

      formData.append(
        "file",
        req.file.buffer,
        req.file.originalname
      );

      formData.append(
        "language",
        "eng"
      );

      const response = await axios.post(
        "https://api.ocr.space/parse/image",
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      console.log(
        "OCR RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      const rawText =
        response.data?.ParsedResults
          ?.map((r) => r.ParsedText)
          .join("\n")
          .trim() || "";

          const uploadResult =
  await cloudinary.uploader.upload(
    `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
    {
      folder: "receipts",
    }
  );

const imageUrl = uploadResult.secure_url;


const lines = rawText
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
const amountMatches = [
  ...rawText
    .replace(/[oO]/g, "0")
    .matchAll(/([0-9]+)\.([0-9]{2})/g),
];

console.log(
  "AMOUNTS:",
  amountMatches.map(
    (m) => `${m[1]}.${m[2]}`
  )
);

const supplier =
  lines[0] || "Unknown";

let total = null;



if (amountMatches.length > 0) {
  const amounts = amountMatches.map(
    (m) => Number(`${m[1]}.${m[2]}`)
  );

  total = Math.max(...amounts);
}

console.log("RAW TEXT:");
console.log(rawText);

console.log("SUPPLIER:", supplier);
console.log("TOTAL:", total);
const insertResult = await turso.execute({
  sql: `
    INSERT INTO receipts
    (
      imageUrl,
      rawText,
      supplier,
      total,
      createdDate
    )
    VALUES
    (?, ?, ?, ?, DATE('now'))
  `,
args: [
  imageUrl,
  rawText,
  supplier,
  total,
],
});

      res.json({
        success: true,
        rawText,
        receiptId: Number(insertResult.lastInsertRowid),
        imageUrl,
      });
    } catch (error) {
      console.error(
        "OCR ERROR:",
        error.response?.data ||
          error.message
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);
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

app.post("/sheep/:id/health-cases", async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
    } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO healthCases
        (
          sheepId,
          title,
          description,
          priority
        )
        VALUES (?, ?, ?, ?)
      `,
      args: [
        req.params.id,
        title,
        description,
        priority || "medium",
      ],
    });
    await addHistory(
  req.params.id,
  "🩺 Health Case",
  title,
  new Date()
    .toISOString()
    .split("T")[0]
);

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/sheep/:id/health-cases", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT *
        FROM healthCases
        WHERE sheepId = ?
        ORDER BY createdDate DESC
      `,
      args: [req.params.id],
    });

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/health-cases/:id/actions", async (req, res) => {
  try {
    const {
      actionType,
      notes,
    } = req.body;

    await turso.execute({
      sql: `
        INSERT INTO healthCaseActions
        (
          caseId,
          actionType,
          notes
        )
        VALUES (?, ?, ?)
      `,
      args: [
        req.params.id,
        actionType,
        notes,
      ],
    });
await addHistory(
  sheepId,
  `🩺 ${actionType}`,
  notes,
  actionDate
);
    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/health-cases/:id/actions", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT *
        FROM healthCaseActions
        WHERE caseId = ?
        ORDER BY actionDate DESC
      `,
      args: [req.params.id],
    });

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.put(
  "/health-cases/:id/resolve",
  async (req, res) => {
    try {
      const caseId = req.params.id;

      await turso.execute({
        sql: `
          UPDATE healthCases
          SET status = 'resolved'
          WHERE id = ?
        `,
        args: [caseId],
      });

      await turso.execute({
        sql: `
          UPDATE sheepEvents
          SET status = 'completed'
          WHERE caseId = ?
        `,
        args: [caseId],
      });

      res.json({
        success: true,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: error.message,
      });
    }
  }
);
app.put(
  "/scheduled/:id/stop",
  async (req, res) => {
    await turso.execute({
      sql: `
        UPDATE sheepEvents
        SET autoRepeat = 0
        WHERE id = ?
      `,
      args: [req.params.id],
    });

    res.json({
      success: true,
    });
  }
);
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
    await addHistory(
  req.params.id,
  "🍼 Lambing",
  `${males} male, ${females} female, ${dead} dead`,
  lambingDate
);


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
await addHistory(
  req.params.id,
  eventType,
  notes,
  eventDate
);
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

async function addHistory(
  sheepId,
  eventType,
  details,
  eventDate
) {
  await turso.execute({
    sql: `
      INSERT INTO sheepHistory (
        sheepId,
        eventType,
        details,
        eventDate
      )
      VALUES (?, ?, ?, ?)
    `,
    args: [
      sheepId,
      eventType,
      details,
      eventDate,
    ],
  });
}

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
    await addHistory(
  req.params.id,
  "🤰 Scan",
  result,
  scanDate
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
  await addHistory(
    sheep.id,
    "🚚 Movement",
    `Moved to ${newField}`,
    new Date()
      .toISOString()
      .split("T")[0]
  );
}

res.json({
  success: true,
});  } catch (error) {
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
    await addHistory(
  sheepId,
  "✅ Scheduled Event",
  eventType,
  completedDate
);

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
      sheepId,
      sheepName,
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
  sheepId,
  sheepName,
  treatment,
  treatmentDate,
  withdrawalDays,
  cost,
  notes,
  administeredBy
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
args: [
  groupName,
  sheepId,
  sheepName,
  treatment,
  treatmentDate,
  withdrawalDays,
  cost,
  notes,
  administeredBy,
],
    });
await addHistory(
  sheepId,
  "💉 Treatment",
  `${treatment} - ${notes || ""}`,
  treatmentDate
);
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
app.put("/manual-calendar-events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      eventDate,
      category,
      notes,
      notifyDavid,
      notifyGemma,
      reminderDate,
      reminderTime
    } = req.body;

    await turso.execute({
      sql: `
        UPDATE calendarEvents
        SET
          title = ?,
          eventDate = ?,
          category = ?,
          notes = ?,
          notifyDavid = ?,
          notifyGemma = ?,
          reminderDate = ?,
          reminderTime = ?
        WHERE id = ?
      `,
      args: [
        title,
        eventDate,
        category,
        notes,
        notifyDavid ? 1 : 0,
        notifyGemma ? 1 : 0,
        reminderDate || null,
        reminderTime || null,
        id,
      ],
    });

    // create notification for updates
    const message = `${title} updated to ${eventDate}`;
    if (notifyDavid) {
      await turso.execute({
        sql: `INSERT INTO notifications (userName, title, message, data) VALUES (?, ?, ?, ?)`,
        args: ["David", "Calendar Event Updated", message, JSON.stringify({ id })],
      });

      // email sending removed — in-app notification created instead
    }

    if (notifyGemma) {
      await turso.execute({
        sql: `INSERT INTO notifications (userName, title, message, data) VALUES (?, ?, ?, ?)`,
        args: ["Gemma", "Calendar Event Updated", message, JSON.stringify({ id })],
      });

      // email sending removed — in-app notification created instead
    }

    res.json({
      success: true
    });

  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
app.delete(
  "/manual-calendar-events/:id",
  async (req, res) => {
    try {
      await turso.execute({
        sql: `
          DELETE FROM calendarEvents
          WHERE id = ?
        `,
        args: [req.params.id],
      });

      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  }
);

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

app.put("/medicines/:id", async (req, res) => {
  const {
    name,
    doseRate,
    withdrawalDays,
    administrationMethod,
  } = req.body;

  await turso.execute({
    sql: `
      UPDATE medicines
      SET
        name = ?,
        doseRate = ?,
        withdrawalDays = ?,
        administrationMethod = ?
      WHERE id = ?
    `,
    args: [
      name,
      doseRate,
      withdrawalDays,
      administrationMethod,
      req.params.id,
    ],
  });

  res.json({
    success: true,
  });
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

app.get("/calendar-events", async (req, res) => {
  try {
    const treatments =
      await turso.execute(
        "SELECT * FROM treatments"
      );

    const manualEvents =
      await turso.execute(
        "SELECT * FROM calendarEvents"
      );

    const events = [];

    // Withdrawals

    for (const treatment of treatments.rows) {
      if (
        Number(
          treatment.withdrawalDays
        ) > 0
      ) {
        const date = new Date(
          treatment.treatmentDate
            .split("/")
            .reverse()
            .join("-")
        );

        date.setDate(
          date.getDate() +
            Number(
              treatment.withdrawalDays
            )
        );

        events.push({
          type: "withdrawal",
          date: date
            .toISOString()
            .split("T")[0],
          sheepName:
            treatment.sheepName,
          treatment:
            treatment.treatment,
        });
      }
    }

    // Manual Events

    for (const event of manualEvents.rows) {
      events.push({
        id: event.id,
        type: "manual",
        date: event.eventDate,
        title: event.title,
        category: event.category,
        notes: event.notes,
        createdBy:
          event.createdBy,
      });
    }

    res.json(events);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/manual-calendar-events", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM calendarEvents"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Notifications APIs
app.get("/notifications", async (req, res) => {
  try {
    const { user } = req.query;

    const result = await turso.execute({
      sql: `SELECT * FROM notifications WHERE userName = ? ORDER BY id DESC`,
      args: [user || "David"],
    });

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.put("/notifications/:id/read", async (req, res) => {
  try {
    await turso.execute({
      sql: `UPDATE notifications SET read = 1 WHERE id = ?`,
      args: [req.params.id],
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/manual-calendar-events", async (req, res) => {
  try {
    const {
      title,
      eventDate,
      category,
      notes,
      createdBy,
      notifyDavid,
      notifyGemma,
      reminderDate,
      reminderTime,
    } = req.body;

    const result = await turso.execute({
      sql: `
        INSERT INTO calendarEvents
        (
          title,
          eventDate,
          category,
          notes,
          createdBy,
          notifyDavid,
          notifyGemma,
          reminderDate,
          reminderTime
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        title,
        eventDate,
        category,
        notes,
        createdBy,
        notifyDavid ? 1 : 0,
        notifyGemma ? 1 : 0,
        reminderDate || null,
        reminderTime || null,
      ],
    });

    // create in-app notifications and send emails if requested
    const eventId = Number(result.lastInsertRowid);
    const message = `${title} on ${eventDate}`;

    if (notifyDavid) {
      await turso.execute({
        sql: `INSERT INTO notifications (userName, title, message, data) VALUES (?, ?, ?, ?)`,
        args: [
          "David",
          "Calendar Event Created",
          message,
          JSON.stringify({ eventId }),
        ],
      });

      // email sending removed — in-app notification created instead
    }

    if (notifyGemma) {
      await turso.execute({
        sql: `INSERT INTO notifications (userName, title, message, data) VALUES (?, ?, ?, ?)`,
        args: [
          "Gemma",
          "Calendar Event Created",
          message,
          JSON.stringify({ eventId }),
        ],
      });

      // email sending removed — in-app notification created instead
    }

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
      "SELECT treatmentDate FROM treatments"
    );

    const now = new Date();

    const count = result.rows.filter(
      (t) => {
        if (!t.treatmentDate) {
          return false;
        }

        const [day, month, year] =
          t.treatmentDate.split("/");

        return (
          Number(month) ===
            now.getMonth() + 1 &&
          Number(year) ===
            now.getFullYear()
        );
      }
    ).length;

    res.json({ count });
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

app.get("/hero-points", async (req, res) => {
  try {
    const [entries, rewards, redemptions] = await Promise.all([
      turso.execute("SELECT * FROM heroPoints ORDER BY id DESC"),
      turso.execute("SELECT * FROM heroRewards WHERE active = 1 ORDER BY cost, name"),
      turso.execute("SELECT * FROM heroRedemptions ORDER BY id DESC"),
    ]);
    const balance = entries.rows.reduce((total, entry) => total + Number(entry.points), 0);
    res.json({ balance, entries: entries.rows, rewards: rewards.rows, redemptions: redemptions.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/hero-points", async (req, res) => {
  try {
    const { points, description } = req.body || {};
    const amount = Number(points);
    if (!Number.isInteger(amount) || amount <= 0 || !String(description || "").trim()) {
      return res.status(400).json({ error: "Points must be a positive whole number with a description" });
    }
    const result = await turso.execute({
      sql: "INSERT INTO heroPoints (points, description, createdBy) VALUES (?, ?, ?)",
      args: [amount, String(description).trim(), req.user],
    });
    return res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put("/hero-points/:id", async (req, res) => {
  try {
    if (req.user !== "David") return res.status(403).json({ error: "Only David can edit Hero Points" });
    const { points, description } = req.body || {};
    const amount = Number(points);
    if (!Number.isInteger(amount) || amount <= 0 || !String(description || "").trim()) {
      return res.status(400).json({ error: "Points must be a positive whole number with a description" });
    }
    await turso.execute({
      sql: "UPDATE heroPoints SET points = ?, description = ?, updatedBy = ?, updatedDate = CURRENT_TIMESTAMP WHERE id = ?",
      args: [amount, String(description).trim(), req.user, req.params.id],
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/hero-rewards", async (req, res) => {
  try {
    if (req.user !== "David") return res.status(403).json({ error: "Only David can manage rewards" });
    const { name, cost } = req.body || {};
    const amount = Number(cost);
    if (!String(name || "").trim() || !Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: "Reward name and positive whole-number cost are required" });
    const result = await turso.execute({
      sql: "INSERT INTO heroRewards (name, cost, createdBy) VALUES (?, ?, ?)",
      args: [String(name).trim(), amount, req.user],
    });
    return res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put("/hero-rewards/:id", async (req, res) => {
  try {
    if (req.user !== "David") return res.status(403).json({ error: "Only David can manage rewards" });
    const { name, cost } = req.body || {};
    const amount = Number(cost);
    if (!String(name || "").trim() || !Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: "Reward name and positive whole-number cost are required" });
    await turso.execute({
      sql: "UPDATE heroRewards SET name = ?, cost = ?, updatedDate = CURRENT_TIMESTAMP WHERE id = ?",
      args: [String(name).trim(), amount, req.params.id],
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/hero-rewards/:id/redeem", async (req, res) => {
  try {
    if (req.user !== "David" && req.user !== "Gemma") return res.status(403).json({ error: "Unknown user" });
    const rewardResult = await turso.execute({ sql: "SELECT * FROM heroRewards WHERE id = ? AND active = 1", args: [req.params.id] });
    const reward = rewardResult.rows[0];
    if (!reward) return res.status(404).json({ error: "Reward not found" });
    const entries = await turso.execute("SELECT points FROM heroPoints");
    const balance = entries.rows.reduce((total, entry) => total + Number(entry.points), 0);
    if (balance < Number(reward.cost)) return res.status(400).json({ error: "Not enough Hero Points" });
    const pending = await turso.execute({ sql: "SELECT id FROM heroRedemptions WHERE status = 'requested' AND rewardId = ?", args: [req.params.id] });
    if (pending.rows.length > 0) return res.status(409).json({ error: "This reward already has a pending request" });
    await turso.execute({
      sql: "INSERT INTO heroRedemptions (rewardId, rewardName, cost, requestedBy) VALUES (?, ?, ?, ?)",
      args: [reward.id, reward.name, reward.cost, req.user],
    });
    return res.json({ success: true, status: "requested" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put("/hero-redemptions/:id/complete", async (req, res) => {
  try {
    if (req.user !== "David") return res.status(403).json({ error: "Only David can mark redemptions complete" });
    const result = await turso.execute({ sql: "SELECT * FROM heroRedemptions WHERE id = ? AND status = 'requested'", args: [req.params.id] });
    const redemption = result.rows[0];
    if (!redemption) return res.status(404).json({ error: "Pending redemption not found" });
    const entries = await turso.execute("SELECT points FROM heroPoints");
    const balance = entries.rows.reduce((total, entry) => total + Number(entry.points), 0);
    if (balance < Number(redemption.cost)) return res.status(400).json({ error: "Not enough Hero Points" });
    await turso.execute({
      sql: "INSERT INTO heroPoints (points, description, createdBy) VALUES (?, ?, ?)",
      args: [-Number(redemption.cost), `Redeemed: ${redemption.rewardName}`, req.user],
    });
    await turso.execute({
      sql: "UPDATE heroRedemptions SET status = 'completed', completedBy = ?, completedDate = CURRENT_TIMESTAMP WHERE id = ?",
      args: [req.user, req.params.id],
    });
    return res.json({ success: true, status: "completed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log(
    "Farm API running on https://wern-villa-api.onrender.com"
  );
});

// Scheduler: send reminder emails at the scheduled reminderDate/reminderTime
cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].slice(0, 5); // HH:MM

    const result = await turso.execute({
      sql: `SELECT * FROM calendarEvents WHERE reminderDate = ? AND reminderTime = ?`,
      args: [dateStr, timeStr],
    });

    for (const ev of result.rows) {
      const message = `${ev.title} is due on ${ev.eventDate}`;

      if (ev.notifyDavid) {
        await turso.execute({
          sql: `INSERT INTO notifications (userName, title, message, data) VALUES (?, ?, ?, ?)`,
          args: ["David", "Reminder", message, JSON.stringify({ id: ev.id })],
        });

        // email sending removed — in-app notification created instead
      }

      if (ev.notifyGemma) {
        await turso.execute({
          sql: `INSERT INTO notifications (userName, title, message, data) VALUES (?, ?, ?, ?)`,
          args: ["Gemma", "Reminder", message, JSON.stringify({ id: ev.id })],
        });

        // email sending removed — in-app notification created instead
      }
    }
  } catch (err) {
    console.error("Reminder scheduler error:", err.message || err);
  }
});

ensurePasskeysTable().catch((error) => {
  console.error("Failed to ensure passkeys table:", error);
});

ensureAuthUsersTable().catch((error) => {
  console.error("Failed to ensure auth users table:", error);
});

ensureHeroPointsTables().catch((error) => {
  console.error("Failed to ensure Hero Points tables:", error);
});