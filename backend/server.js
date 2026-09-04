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
const webpush = require("web-push");
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}
turso.execute(`
  CREATE TABLE IF NOT EXISTS pushSubscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userName TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).catch((error) => console.error("Failed to ensure pushSubscriptions table:", error.message));
turso.execute(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userName TEXT NOT NULL,
    title TEXT,
    message TEXT,
    data TEXT,
    read INTEGER DEFAULT 0,
    createdDate TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).catch((error) => console.error("Failed to ensure notifications table:", error.message));
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

async function ensureTreatmentColumns() {
  try {
    await turso.execute(
      "ALTER TABLE treatments ADD COLUMN volumeMl REAL"
    );
  } catch (error) {
    if (!error.message.toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }
}

async function ensureMedicineColumns() {
  for (const column of ["costPerMl REAL", "bottleVolumeMl REAL", "bottleCost REAL"]) {
    try {
      await turso.execute(
        `ALTER TABLE medicines ADD COLUMN ${column}`
      );
    } catch (error) {
      if (!error.message.toLowerCase().includes("duplicate column")) {
        throw error;
      }
    }
  }
}

async function ensureFeedTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS feedRecords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groupName TEXT NOT NULL,
      feedType TEXT NOT NULL,
      feedDate TEXT NOT NULL,
      totalCost REAL NOT NULL DEFAULT 0,
      sheepCount INTEGER NOT NULL DEFAULT 0,
      costPerSheep REAL NOT NULL DEFAULT 0,
      notes TEXT,
      recordedBy TEXT
    )
  `);
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS feedRecordGroups (
      feedRecordId INTEGER NOT NULL,
      groupName TEXT NOT NULL,
      sheepCount INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (feedRecordId, groupName)
    )
  `);
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

async function ensureAppOpenEventsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS appOpenEvents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT NOT NULL,
      openedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      userAgent TEXT,
      ipAddress TEXT,
      lastScreen TEXT
    )
  `);
  try {
    await turso.execute("ALTER TABLE appOpenEvents ADD COLUMN lastScreen TEXT");
  } catch (error) {
    if (!String(error.message || "").includes("duplicate column")) throw error;
  }
}

async function ensureChangeLogTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS changeLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      statusCode INTEGER NOT NULL,
      details TEXT,
      changedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureClickLogTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS clickLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT NOT NULL,
      target TEXT NOT NULL,
      screen TEXT NOT NULL,
      clickedAt TEXT DEFAULT CURRENT_TIMESTAMP
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
      deliveryDate TEXT,
      status TEXT NOT NULL DEFAULT 'requested',
      completedBy TEXT,
      completedDate TEXT
    )
  `);
  try {
    await turso.execute("ALTER TABLE heroRedemptions ADD COLUMN deliveryDate TEXT");
  } catch (error) {
    if (!error.message.toLowerCase().includes("duplicate column")) throw error;
  }
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

async function ensureSheepEarTagColumns() {
  for (const column of ["tagStatus TEXT", "earTags TEXT"]) {
    try {
      await turso.execute(`ALTER TABLE sheep ADD COLUMN ${column}`);
    } catch (error) {
      if (!error.message.toLowerCase().includes("duplicate column")) {
        throw error;
      }
    }
  }
}

async function ensureFieldFarmColumn() {
  try {
    await turso.execute("ALTER TABLE fields ADD COLUMN farm TEXT");
  } catch (error) {
    if (!error.message.toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }

  // Wern Villa's four fields are the only ones with a map position.
  await turso.execute(`
    UPDATE fields
    SET farm = CASE
      WHEN position IS NOT NULL THEN 'Wern Villa'
      ELSE 'Gellidywyll'
    END
    WHERE farm IS NULL OR farm = ''
  `);
}

const WERN_VILLA_BUILDINGS = [
  "Lambing Shed",
  "Bay 1",
  "Bay 2",
  "Bay 3",
  "Bay 4",
  "Bay 5",
  "Bay 6",
];

async function ensureFieldTypeColumn() {
  try {
    await turso.execute("ALTER TABLE fields ADD COLUMN type TEXT");
  } catch (error) {
    if (!error.message.toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }

  await turso.execute(`
    UPDATE fields
    SET type = 'field'
    WHERE type IS NULL OR type = ''
  `);

  for (const name of WERN_VILLA_BUILDINGS) {
    const existing = await turso.execute({
      sql: "SELECT id FROM fields WHERE name = ? AND farm = ?",
      args: [name, "Wern Villa"],
    });

    if (existing.rows.length === 0) {
      await turso.execute({
        sql: "INSERT INTO fields (name, farm, type) VALUES (?, ?, 'building')",
        args: [name, "Wern Villa"],
      });
    } else {
      await turso.execute({
        sql: "UPDATE fields SET type = 'building' WHERE id = ?",
        args: [existing.rows[0].id],
      });
    }
  }
}

async function ensureEidCymruMovementSubmissionsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS eidCymruMovementSubmissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movementId INTEGER,
      sourceFarm TEXT NOT NULL,
      destinationFarm TEXT NOT NULL,
      sourceCph TEXT,
      destinationCph TEXT,
      movementDate TEXT NOT NULL,
      animalEids TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      externalReference TEXT,
      lastError TEXT,
      submittedAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  for (const column of ["sourceCph TEXT", "destinationCph TEXT"]) {
    try {
      await turso.execute(`ALTER TABLE eidCymruMovementSubmissions ADD COLUMN ${column}`);
    } catch (error) {
      if (!error.message.toLowerCase().includes("duplicate column")) throw error;
    }
  }
}

async function ensureFarmHoldingsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS farmHoldings (
      farm TEXT PRIMARY KEY,
      cph TEXT NOT NULL DEFAULT '',
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  for (const farm of ["Wern Villa", "Gellidywyll"]) {
    await turso.execute({
      sql: "INSERT OR IGNORE INTO farmHoldings (farm) VALUES (?)",
      args: [farm],
    });
  }
}

function eidCymruConfigurationError() {
  const required = [
    "EID_CYMRU_API_URL",
    "EID_CYMRU_API_TOKEN",
  ];
  const missing = required.filter((name) => !process.env[name]);
  return missing.length ? `Missing EID Cymru configuration: ${missing.join(", ")}` : null;
}

async function eidCymruHoldingForFarm(farm) {
  const result = await turso.execute({
    sql: "SELECT cph FROM farmHoldings WHERE farm = ?",
    args: [farm],
  });
  const cph = String(result.rows[0]?.cph || "").trim();
  if (!cph) throw new Error(`Missing CPH number for ${farm}`);
  return cph;
}

async function submitEidCymruMovement(submission) {
  const configurationError = eidCymruConfigurationError();
  if (configurationError) throw new Error(configurationError);

  const response = await axios.post(
    process.env.EID_CYMRU_API_URL,
    {
      fromHolding: submission.sourceCph || await eidCymruHoldingForFarm(submission.sourceFarm),
      toHolding: submission.destinationCph || await eidCymruHoldingForFarm(submission.destinationFarm),
      movementDate: submission.movementDate,
      animalEids: JSON.parse(submission.animalEids),
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.EID_CYMRU_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  return response.data?.reference || response.data?.id || null;
}

async function deliverEidCymruMovement(submissionId) {
  const result = await turso.execute({
    sql: "SELECT * FROM eidCymruMovementSubmissions WHERE id = ?",
    args: [submissionId],
  });
  const submission = result.rows[0];
  if (!submission || submission.status !== "review") return submission;

  try {
    await turso.execute({
      sql: "UPDATE eidCymruMovementSubmissions SET status = 'submitting', lastError = NULL WHERE id = ?",
      args: [submissionId],
    });
    const externalReference = await submitEidCymruMovement(submission);
    await turso.execute({
      sql: `
        UPDATE eidCymruMovementSubmissions
        SET status = 'submitted', externalReference = ?, lastError = NULL, submittedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [externalReference, submissionId],
    });
  } catch (error) {
    await turso.execute({
      sql: "UPDATE eidCymruMovementSubmissions SET status = 'review', lastError = ? WHERE id = ?",
      args: [error.response?.data?.message || error.message, submissionId],
    });
  }

  const updated = await turso.execute({
    sql: "SELECT * FROM eidCymruMovementSubmissions WHERE id = ?",
    args: [submissionId],
  });
  return updated.rows[0];
}

async function createEidCymruReviewSubmission({
  sourceFarm,
  destinationFarm,
  sourceCph,
  destinationCph,
  sourceLocation,
  destinationLocation,
  movementDate,
  animalEids,
  movedBy,
}) {
  const missingEidError = animalEids.some((eid) => !String(eid || "").trim())
    ? "Every sheep must have an EID before this move can be submitted to EID Cymru."
    : null;
  const missingCounterpartyCph = (sourceFarm === "External holding" && !sourceCph)
    || (destinationFarm === "External holding" && !destinationCph);
  const submissionError = missingEidError || (missingCounterpartyCph
    ? "A counterparty CPH number is required before this move can be submitted to EID Cymru."
    : null);
  const movementResult = await turso.execute({
    sql: `
      INSERT INTO movements (number, fromLocation, toLocation, moveDate, movedBy)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [animalEids.length, sourceLocation, destinationLocation, movementDate, movedBy],
  });
  const result = await turso.execute({
    sql: `
      INSERT INTO eidCymruMovementSubmissions
        (movementId, sourceFarm, destinationFarm, sourceCph, destinationCph,
         movementDate, animalEids, status, lastError)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      Number(movementResult.lastInsertRowid),
      sourceFarm,
      destinationFarm,
      sourceCph || null,
      destinationCph || null,
      movementDate,
      JSON.stringify(animalEids.filter((eid) => String(eid || "").trim())),
      submissionError ? "blocked" : "review",
      submissionError,
    ],
  });
  const submission = await turso.execute({
    sql: "SELECT * FROM eidCymruMovementSubmissions WHERE id = ?",
    args: [Number(result.lastInsertRowid)],
  });
  return submission.rows[0];
}

async function ensureSalesTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleType TEXT NOT NULL DEFAULT 'livestock',
      saleDate TEXT NOT NULL,
      description TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      unitPrice REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      customer TEXT,
      sheepId INTEGER,
      notes TEXT,
      recordedBy TEXT,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureLivestockPurchasesTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS livestockPurchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheepId INTEGER NOT NULL,
      purchaseDate TEXT NOT NULL,
      seller TEXT,
      sellerCph TEXT,
      price REAL NOT NULL DEFAULT 0,
      notes TEXT,
      recordedBy TEXT,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureNotesTables() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      kind TEXT NOT NULL DEFAULT 'note',
      createdBy TEXT,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS noteItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      noteId INTEGER NOT NULL,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureAppConfigTables() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS appConfig (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      category TEXT DEFAULT 'general',
      updatedBy TEXT,
      updatedDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS smartDevices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'toggle',
      icon TEXT DEFAULT '💡',
      endpointUrl TEXT,
      state TEXT DEFAULT 'off',
      location TEXT,
      createdBy TEXT,
      updatedDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS devNotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT DEFAULT 'bug',
      title TEXT NOT NULL,
      details TEXT,
      screen TEXT,
      reportedBy TEXT,
      status TEXT DEFAULT 'open',
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureSmartDeviceHaColumn() {
  try {
    await turso.execute("ALTER TABLE smartDevices ADD COLUMN haEntityId TEXT");
  } catch (error) {
    if (!error.message.toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }
}

function homeAssistantConfigured() {
  return Boolean(process.env.HOMEASSISTANT_URL && process.env.HOMEASSISTANT_TOKEN);
}

async function homeAssistantRequest(path, options = {}) {
  if (!homeAssistantConfigured()) {
    throw new Error("Home Assistant is not configured on this server");
  }
  const baseUrl = process.env.HOMEASSISTANT_URL.replace(/\/$/, "");
  return axios({
    url: `${baseUrl}${path}`,
    timeout: 8000,
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.HOMEASSISTANT_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
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

async function notifyDavidGemmaActive(screen) {
  await sendPushToUser("David", {
    title: "Gemma is active",
    message: screen ? `Gemma is active on ${screen}.` : "Gemma is active on the app.",
    data: { type: "gemma-active", screen },
  });
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

app.use((req, res, next) => {
  if (
    !["POST", "PUT", "PATCH", "DELETE"].includes(req.method) ||
    req.path === "/app-open-events" ||
    req.path === "/click-log"
  ) {
    return next();
  }

  res.on("finish", () => {
    if (res.statusCode >= 400) return;
    const body = { ...(req.body || {}) };
    for (const field of ["password", "currentPassword", "newPassword", "confirmPassword", "setupKey"]) {
      if (field in body) body[field] = "[redacted]";
    }
    turso.execute({
      sql: `
        INSERT INTO changeLog (userName, method, path, statusCode, details)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [req.user, req.method, req.path, res.statusCode, JSON.stringify(body)],
    }).catch((error) => console.error("Change log error:", error));
  });
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

app.post("/auth/admin-reset-password", async (req, res) => {
  try {
    if (req.user !== "David") return res.status(403).json({ error: "Only David can reset passwords" });
    const { username, newPassword } = req.body || {};
    if (!isValidUserName(username)) return res.status(400).json({ error: "Unknown user" });
    if (typeof newPassword !== "string" || newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
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
      args: [username, hash, salt],
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Admin password reset error:", error);
    return res.status(500).json({ error: "Could not reset password" });
  }
});

app.post("/app-open-events", async (req, res) => {
  try {
    const screen = String(req.body?.screen || "").trim().slice(0, 80) || null;
    if (req.user === "Gemma") {
      const recentActivity = await turso.execute({
        sql: `
          SELECT id
          FROM appOpenEvents
          WHERE userName = ?
            AND openedAt >= datetime('now', '-15 minutes')
          LIMIT 1
        `,
        args: ["Gemma"],
      });

      if (recentActivity.rows.length === 0) {
        await notifyDavidGemmaActive(screen);
      }
    }

    await turso.execute({
      sql: "INSERT INTO appOpenEvents (userName, userAgent, ipAddress, lastScreen) VALUES (?, ?, ?, ?)",
      args: [req.user, req.get("user-agent") || null, req.get("x-forwarded-for") || req.ip || null, screen],
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("App open log error:", error);
    return res.status(500).json({ error: "Could not log app open" });
  }
});

app.post("/click-log", async (req, res) => {
  try {
    const target = String(req.body?.target || "").trim().slice(0, 160) || "Unknown element";
    const screen = String(req.body?.screen || "").trim().slice(0, 80) || "Unknown screen";
    await turso.execute({
      sql: "INSERT INTO clickLog (userName, target, screen) VALUES (?, ?, ?)",
      args: [req.user, target, screen],
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Click log error:", error);
    return res.status(500).json({ error: "Could not log click" });
  }
});

app.get("/click-log", async (req, res) => {
  try {
    if (req.user !== "David") return res.status(403).json({ error: "Only David can view the click log" });
    const selectedUser = String(req.query.userName || "").trim();
    const filterUser = isValidUserName(selectedUser) ? selectedUser : null;
    const result = await turso.execute({
      sql: `
        SELECT id, userName, target, screen, clickedAt
        FROM clickLog
        ${filterUser ? "WHERE userName = ?" : ""}
        ORDER BY id DESC
        LIMIT 1000
      `,
      args: filterUser ? [filterUser] : [],
    });
    return res.json(result.rows);
  } catch (error) {
    console.error("Click log fetch error:", error);
    return res.status(500).json({ error: "Could not load click log" });
  }
});

app.get("/app-open-events", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT e.id, e.userName, e.openedAt, e.userAgent, e.lastScreen
        FROM appOpenEvents e
        INNER JOIN (
          SELECT userName, MAX(id) AS id
          FROM appOpenEvents
          GROUP BY userName
        ) latest ON latest.id = e.id
        ORDER BY e.openedAt DESC, e.id DESC
      `,
    });
    return res.json(result.rows);
  } catch (error) {
    console.error("App open log fetch error:", error);
    return res.status(500).json({ error: "Could not load app open log" });
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

ensureTreatmentColumns().catch((error) => {
  console.error("Failed to ensure treatment columns:", error);
});

ensureMedicineColumns().catch((error) => {
  console.error("Failed to ensure medicine columns:", error);
});

ensureFeedTable().catch((error) => {
  console.error("Failed to ensure feed table:", error);
});

ensureReceiptsTable().catch((error) => {
  console.error("Failed to ensure receipts table:", error);
});

app.post("/sheep/:id/scheduled", async (req, res) => {
  const {
    dueDate,
    eventType,
    notes,
    repeatEvery,
    numberOfEvents,
    repeatUntilResolved,
    caseId,
  } = req.body || {};

  if (!dueDate || !eventType) {
    return res.status(400).json({ error: "dueDate and eventType are required" });
  }
  if (Number.isNaN(new Date(dueDate).getTime())) {
    return res.status(400).json({ error: "dueDate is not a valid date" });
  }

  // libsql rejects undefined, so optional columns must be explicit nulls.
  const eventNotes = notes ?? null;
  const eventCaseId = caseId ?? null;

  try {
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
      eventNotes,
      dueDate,
      Number(repeatEvery) || 0,
      eventCaseId,
    ],
  });

  return res.json({
    success: true,
  });
}  const totalEvents = Math.max(1, Number(numberOfEvents) || 1);
  const repeatInterval = Number(repeatEvery) || 0;

  for (
    let i = 0;
    i < totalEvents;
    i++
  ) {
    const date = new Date(dueDate);

    date.setDate(
      date.getDate() +
        i * repeatInterval
    );

    const formattedDate =
      date
        .toISOString()
        .split("T")[0];

    const title =
      totalEvents > 1
        ? `${eventType} ${
            i + 1
          } of ${totalEvents}`
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
        eventNotes,
        formattedDate,
        eventCaseId,
      ],
    });
  }

  res.json({
    success: true,
  });
  } catch (error) {
    console.error("Create scheduled event error:", error);
    res.status(500).json({ error: error.message });
  }
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
    } = req.body || {};

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
  const repeatEvery = Number(req.body?.repeatEvery);
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
  if (!scheduledEvent) {
    return res.status(404).json({ error: "Scheduled event not found" });
  }
    if (Number.isFinite(repeatEvery) && repeatEvery > 0) {
  const nextDate = new Date(
    scheduledEvent.dueDate
  );

  nextDate.setDate(
    nextDate.getDate() +
    repeatEvery
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
        repeatNumber,
        caseId
      )
      VALUES
      (?, ?, ?, 'scheduled', ?, 1, ?, ?, ?)
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
      repeatEvery,
      scheduledEvent.repeatNumber + 1,
      scheduledEvent.caseId,
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
    } = req.body || {};

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
    } = req.body || {};

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

// Cancelled events are kept for audit; both task views filter on 'scheduled'.
app.put("/scheduled/:id/cancel", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        UPDATE sheepEvents
        SET status = 'cancelled',
            autoRepeat = 0
        WHERE id = ?
          AND status = 'scheduled'
      `,
      args: [req.params.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "No scheduled task found to cancel" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Cancel scheduled event error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/sheep/:id/weights", async (req, res) => {
  try {
    const { weight, weightDate } =
      req.body || {};

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
    } = req.body || {};

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
  } = req.body || {};

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

// Sheep whose currentField is blank or does not match any field record.
app.get("/unassigned-sheep", async (req, res) => {
  try {
    const result = await turso.execute(`
      SELECT sheep.*
      FROM sheep
      LEFT JOIN fields
        ON fields.name = sheep.currentField
      WHERE fields.id IS NULL
      ORDER BY sheep.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Unassigned sheep error:", error);
    res.status(500).json({ error: error.message });
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
    const { scanDate, result } = req.body || {};

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
    const result = await turso.execute(`
      SELECT movements.*, eidCymruMovementSubmissions.id AS eidCymruSubmissionId,
        eidCymruMovementSubmissions.status AS eidCymruStatus,
        eidCymruMovementSubmissions.animalEids AS eidCymruAnimalEids,
        eidCymruMovementSubmissions.lastError AS eidCymruError
      FROM movements
      LEFT JOIN eidCymruMovementSubmissions
        ON eidCymruMovementSubmissions.movementId = movements.id
      ORDER BY movements.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/eid-cymru/holdings", async (req, res) => {
  try {
    const result = await turso.execute("SELECT farm, cph FROM farmHoldings ORDER BY farm");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/eid-cymru/holdings/:farm", async (req, res) => {
  try {
    const farm = decodeURIComponent(req.params.farm);
    const cph = String(req.body?.cph || "").trim();
    if (!["Wern Villa", "Gellidywyll"].includes(farm)) {
      return res.status(400).json({ error: "Unknown farm holding" });
    }
    if (!cph) return res.status(400).json({ error: "A CPH number is required" });
    await turso.execute({
      sql: "UPDATE farmHoldings SET cph = ?, updatedAt = CURRENT_TIMESTAMP WHERE farm = ?",
      args: [cph, farm],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/eid-cymru/submissions/:id/submit", async (req, res) => {
  try {
    const submission = await deliverEidCymruMovement(Number(req.params.id));
    if (!submission) return res.status(404).json({ error: "EID Cymru submission not found" });
    if (submission.status === "blocked") {
      return res.status(409).json({ error: submission.lastError || "This submission is blocked" });
    }
    if (submission.status === "submitting") {
      return res.status(409).json({ error: "This submission is already being sent" });
    }
    res.json({ status: submission.status, error: submission.lastError });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      req.body || {};

    if (!groupName || !newField) {
      return res.status(400).json({ error: "A group and destination field are required" });
    }

    const groupResult = await turso.execute({
      sql: "SELECT currentField FROM flockRegister WHERE name = ?",
      args: [groupName],
    });
    const sourceField = groupResult.rows[0]?.currentField;
    const fieldsResult = await turso.execute({
      sql: "SELECT name, farm FROM fields WHERE name IN (?, ?)",
      args: [sourceField, newField],
    });
    const fieldsByName = Object.fromEntries(fieldsResult.rows.map((field) => [field.name, field]));
    const sourceFarm = fieldsByName[sourceField]?.farm || "Gellidywyll";
    const destinationFarm = fieldsByName[newField]?.farm || "Gellidywyll";

    if (!fieldsByName[newField]) {
      return res.status(400).json({ error: "The destination field does not exist" });
    }

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
      SELECT id, eid
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

let eidCymruSubmission = null;
if (sourceField && sourceFarm !== destinationFarm) {
  const animalEids = sheepResult.rows
    .map((sheep) => String(sheep.eid || "").trim())
    .filter(Boolean);
  const missingEidError = animalEids.length !== sheepResult.rows.length
    ? "Every sheep must have an EID before this move can be submitted to EID Cymru."
    : null;

  const movementDate = new Date().toISOString().split("T")[0];
  const movementResult = await turso.execute({
    sql: `
      INSERT INTO movements (number, fromLocation, toLocation, moveDate, movedBy)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [sheepResult.rows.length, sourceField, newField, movementDate, "Group move"],
  });
  const submissionResult = await turso.execute({
    sql: `
      INSERT INTO eidCymruMovementSubmissions
        (movementId, sourceFarm, destinationFarm, movementDate, animalEids, status, lastError)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      Number(movementResult.lastInsertRowid),
      sourceFarm,
      destinationFarm,
      movementDate,
      JSON.stringify(animalEids),
      missingEidError ? "blocked" : "pending",
      missingEidError,
    ],
  });
  const queuedSubmission = await turso.execute({
    sql: "SELECT * FROM eidCymruMovementSubmissions WHERE id = ?",
    args: [Number(submissionResult.lastInsertRowid)],
  });
  eidCymruSubmission = queuedSubmission.rows[0];
}

res.json({
  success: true,
  eidCymru: eidCymruSubmission && {
    status: eidCymruSubmission.status,
    error: eidCymruSubmission.lastError,
  },
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
    } = req.body || {};

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

// Ear tag status and tag list (DEFRA tagging record), amendable independently of the main sheep edit form.
app.put("/sheep/:id/eartags", async (req, res) => {
  try {
    const { id } = req.params;
    const { tagStatus, earTags } = req.body || {};

    await turso.execute({
      sql: `
        UPDATE sheep
        SET
          tagStatus = ?,
          earTags = ?
        WHERE id = ?
      `,
      args: [
        tagStatus || null,
        JSON.stringify(Array.isArray(earTags) ? earTags : []),
        id,
      ],
    });

    await turso.execute({
      sql: `
        INSERT INTO sheepHistory
        (sheepId, eventType, details)
        VALUES (?, ?, ?)
      `,
      args: [id, "Ear Tags Updated", `Tag status: ${tagStatus || "Not set"}`],
    });

    res.json({ success: true });
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
    } = req.body || {};

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
    } = req.body || {};

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
    const { task, createdBy } = req.body || {};

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
    } = req.body || {};

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

    // A sheep's farm follows the field it stands in, so there is nothing to keep in sync.
    const byFarmResult = await turso.execute(`
      SELECT
        COALESCE(fields.farm, 'Unassigned') AS farm,
        COUNT(*) AS count
      FROM sheep
      LEFT JOIN fields
        ON fields.name = sheep.currentField
      GROUP BY COALESCE(fields.farm, 'Unassigned')
    `);

    const sheepByFarm = {};
    for (const row of byFarmResult.rows) {
      sheepByFarm[row.farm] = Number(row.count);
    }

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

      sheepByFarm,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
app.put("/tasks/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const { completedBy } = req.body || {};

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
const { name, size, farm, type } = req.body || {};
    const result =
      await turso.execute({
        sql: `
INSERT INTO fields (
  name,
  size,
  farm,
  type
)
VALUES (?, ?, ?, ?)
        `,
        args: [
          name ?? null,
          size ?? null,
          farm || "Gellidywyll",
          type === "building" ? "building" : "field",
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
app.put("/fields/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      size,
      position,
      farm,
      type,
    } = req.body || {};

    const existing = await turso.execute({
      sql: "SELECT * FROM fields WHERE id = ?",
      args: [id],
    });
    const field = existing.rows[0];
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    await turso.execute({
      sql: `
        UPDATE fields
        SET
          name = ?,
          size = ?,
          position = ?,
          farm = ?,
          type = ?
        WHERE id = ?
      `,
      args: [
        name ?? field.name,
        size ?? field.size,
        position ?? field.position,
        farm ?? field.farm ?? "Gellidywyll",
        type ?? field.type ?? "field",
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

app.get("/sheep/:id/financial-analysis", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `
        SELECT
          COUNT(*) AS treatmentCount,
          COALESCE(SUM(cost), 0) AS totalTreatmentCost,
          COALESCE(SUM(volumeMl), 0) AS totalVolumeMl,
          COALESCE(AVG(cost), 0) AS averageTreatmentCost
        FROM treatments
        WHERE sheepId = ?
      `,
      args: [req.params.id],
    });

    const treatments = await turso.execute({
      sql: `
        SELECT id, treatment, treatmentDate, volumeMl, cost,
               withdrawalDays, notes
        FROM treatments
        WHERE sheepId = ?
        ORDER BY treatmentDate DESC, id DESC
      `,
      args: [req.params.id],
    });

    const sheep = await turso.execute({
      sql: "SELECT groupName FROM sheep WHERE id = ?",
      args: [req.params.id],
    });
    const feed = sheep.rows[0]?.groupName
      ? await turso.execute({
          sql: `
            SELECT id, feedType AS description, feedDate,
                   costPerSheep AS cost, notes
            FROM feedRecords fr
            JOIN feedRecordGroups fg ON fg.feedRecordId = fr.id
            WHERE fg.groupName = ?
            ORDER BY feedDate DESC, id DESC
          `,
          args: [sheep.rows[0].groupName],
        })
      : { rows: [] };

    const feedSummary = feed.rows.reduce(
      (summary, item) => {
        summary.feedCount += 1;
        summary.totalFeedCost += Number(item.cost) || 0;
        return summary;
      },
      { feedCount: 0, totalFeedCost: 0 }
    );

    const sales = await turso.execute({
      sql: `
        SELECT id, saleType, saleDate, description, quantity,
               unitPrice, total, customer, notes
        FROM sales
        WHERE sheepId = ?
        ORDER BY saleDate DESC, id DESC
      `,
      args: [req.params.id],
    });

    const purchases = await turso.execute({
      sql: `
        SELECT id, purchaseDate, seller, price, notes
        FROM livestockPurchases
        WHERE sheepId = ?
        ORDER BY purchaseDate DESC, id DESC
      `,
      args: [req.params.id],
    });

    const totalIncome = sales.rows.reduce(
      (total, sale) => total + (Number(sale.total) || 0),
      0
    );

    const totalPurchaseCost = purchases.rows.reduce(
      (total, purchase) => total + (Number(purchase.price) || 0),
      0
    );

    const totalCost =
      Number(result.rows[0].totalTreatmentCost || 0) +
      feedSummary.totalFeedCost +
      totalPurchaseCost;

    res.json({
      summary: {
        ...result.rows[0],
        ...feedSummary,
        purchaseCount: purchases.rows.length,
        totalPurchaseCost,
        totalCost,
        totalIncome,
        netProfit: totalIncome - totalCost,
      },
      treatments: treatments.rows,
      feed: feed.rows,
      purchases: purchases.rows,
      sales: sales.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      volumeMl,
      cost,
      notes,
      administeredBy,
    } = req.body || {};

    if (!sheepId && groupName) {
      const flock = await turso.execute({
        sql: `
          SELECT id, name
          FROM sheep
          WHERE groupName = ?
          ORDER BY name
        `,
        args: [groupName],
      });

      if (flock.rows.length === 0) {
        return res.status(400).json({
          error: "No sheep found in the selected group",
        });
      }

      const flockCost = Number(cost) || 0;
      const flockVolume = Number(volumeMl) || 0;
      const costPerSheep = flockCost / flock.rows.length;
      const volumePerSheep = flockVolume / flock.rows.length;

      for (const sheep of flock.rows) {
        await turso.execute({
          sql: `
INSERT INTO treatments
(
  groupName,
  sheepId,
  sheepName,
  treatment,
  treatmentDate,
  withdrawalDays,
  volumeMl,
  cost,
  notes,
  administeredBy
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            groupName,
            sheep.id,
            sheep.name,
            treatment,
            treatmentDate,
            withdrawalDays,
            volumePerSheep,
            costPerSheep,
            notes,
            administeredBy,
          ],
        });

        await addHistory(
          sheep.id,
          "💉 Treatment",
          `${treatment} - ${notes || ""}`,
          treatmentDate
        );
      }

      return res.json({
        success: true,
        count: flock.rows.length,
      });
    }

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
  volumeMl,
  cost,
  notes,
  administeredBy
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        groupName,
        sheepId,
        sheepName,
        treatment,
        treatmentDate,
        withdrawalDays,
        volumeMl,
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
    } = req.body || {};

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
    const { name } = req.body || {};

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
    bottleVolumeMl,
    bottleCost,
  } = req.body || {};
  const calculatedCostPerMl = Number(bottleVolumeMl) > 0
    ? Number(bottleCost || 0) / Number(bottleVolumeMl)
    : Number(req.body?.costPerMl) || 0;

  await turso.execute({
    sql: `
      UPDATE medicines
      SET
        name = ?,
        doseRate = ?,
        withdrawalDays = ?,
        administrationMethod = ?,
        costPerMl = ?,
        bottleVolumeMl = ?,
        bottleCost = ?
      WHERE id = ?
    `,
    args: [
      name,
      doseRate,
      withdrawalDays,
      administrationMethod,
      calculatedCostPerMl,
      Number(bottleVolumeMl) || 0,
      Number(bottleCost) || 0,
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
      bottleVolumeMl,
      bottleCost,
    } = req.body || {};
    const calculatedCostPerMl = Number(bottleVolumeMl) > 0
      ? Number(bottleCost || 0) / Number(bottleVolumeMl)
      : 0;

    const result = await turso.execute({
      sql: `
        INSERT INTO medicines (
          name,
          doseRate,
          withdrawalDays,
          administrationMethod,
          costPerMl,
          bottleVolumeMl,
          bottleCost
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        name,
        doseRate,
        withdrawalDays,
        administrationMethod,
        calculatedCostPerMl,
        Number(bottleVolumeMl) || 0,
        Number(bottleCost) || 0,
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

// Sends a real OS-level push notification to every device the user has
// subscribed on. Removes subscriptions the browser reports as expired.
async function sendPushToUser(userName, { title, message, data }) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const result = await turso.execute({
    sql: `SELECT * FROM pushSubscriptions WHERE userName = ?`,
    args: [userName],
  });

  const payload = JSON.stringify({ title, body: message, data });

  for (const sub of result.rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await turso.execute({
          sql: `DELETE FROM pushSubscriptions WHERE id = ?`,
          args: [sub.id],
        });
      } else {
        console.error("Push send failed:", error.message);
      }
    }
  }
}

// Push subscription APIs
app.get("/push/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

app.post("/push/subscribe", async (req, res) => {
  try {
    const { userName, subscription } = req.body || {};
    if (!userName || !subscription?.endpoint) {
      return res.status(400).json({ error: "userName and subscription are required" });
    }

    await turso.execute({
      sql: `
        INSERT INTO pushSubscriptions (userName, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET userName = excluded.userName, p256dh = excluded.p256dh, auth = excluded.auth
      `,
      args: [userName, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/push/unsubscribe", async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    await turso.execute({
      sql: `DELETE FROM pushSubscriptions WHERE endpoint = ?`,
      args: [endpoint],
    });
    res.json({ success: true });
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

app.delete("/notifications/:id", async (req, res) => {
  try {
    await turso.execute({
      sql: `DELETE FROM notifications WHERE id = ?`,
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
    } = req.body || {};

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
          farm: field.farm || "Gellidywyll",
          type: field.type || "field",
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
    const { points, description, entryDate } = req.body || {};
    const amount = Number(points);
    if (!Number.isInteger(amount) || amount <= 0 || !String(description || "").trim()) {
      return res.status(400).json({ error: "Points must be a positive whole number with a description" });
    }
    const result = await turso.execute({
      sql: "INSERT INTO heroPoints (points, description, createdBy, createdDate) VALUES (?, ?, ?, ?)",
      args: [amount, String(description).trim(), req.user, entryDate || new Date().toISOString().slice(0, 10)],
    });
    return res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put("/hero-points/:id", async (req, res) => {
  try {
    if (req.user !== "David") return res.status(403).json({ error: "Only David can edit Hero Points" });
    const { points, description, entryDate } = req.body || {};
    const amount = Number(points);
    if (!Number.isInteger(amount) || amount <= 0 || !String(description || "").trim()) {
      return res.status(400).json({ error: "Points must be a positive whole number with a description" });
    }
    await turso.execute({
      sql: "UPDATE heroPoints SET points = ?, description = ?, createdDate = ?, updatedBy = ?, updatedDate = CURRENT_TIMESTAMP WHERE id = ?",
      args: [amount, String(description).trim(), entryDate || new Date().toISOString().slice(0, 10), req.user, req.params.id],
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
    const requestDate = req.body?.requestDate || new Date().toISOString().slice(0, 10);
    const deliveryDate = req.body?.deliveryDate || null;
    await turso.execute({
      sql: "INSERT INTO heroRedemptions (rewardId, rewardName, cost, requestedBy, requestedDate, deliveryDate) VALUES (?, ?, ?, ?, ?, ?)",
      args: [reward.id, reward.name, reward.cost, req.user, requestDate, deliveryDate],
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

// Converts a wall-clock date/time entered in the farm's local timezone
// (Europe/London) into the correct UTC instant, so reminders fire on time
// regardless of the server's own timezone (Render runs in UTC) or BST/GMT.
function londonLocalToUtc(dateStr, timeStr) {
  const naiveUtc = new Date(`${dateStr}T${timeStr}:00Z`);
  if (Number.isNaN(naiveUtc.getTime())) return naiveUtc;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(naiveUtc)
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  const asIfLondonWereUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return new Date(naiveUtc.getTime() + (naiveUtc.getTime() - asIfLondonWereUtc));
}

// Scheduler: send reminder emails at the scheduled reminderDate/reminderTime
cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();

    const result = await turso.execute({
      sql: `
        SELECT *
        FROM calendarEvents
        WHERE reminderDate IS NOT NULL
          AND reminderTime IS NOT NULL
      `,
    });

    for (const ev of result.rows) {
      const reminderAt = londonLocalToUtc(ev.reminderDate, ev.reminderTime);

      if (
        Number.isNaN(reminderAt.getTime()) ||
        reminderAt > now ||
        now.getTime() - reminderAt.getTime() > 2 * 60 * 1000
      ) {
        continue;
      }

      const message = `${ev.title} is due on ${ev.eventDate}`;
      const reminderData = JSON.stringify({
        id: ev.id,
        reminderDate: ev.reminderDate,
        reminderTime: ev.reminderTime,
      });

      if (ev.notifyDavid) {
        const existing = await turso.execute({
          sql: `
            SELECT id
            FROM notifications
            WHERE userName = ?
              AND title = 'Calendar Reminder'
              AND data = ?
            LIMIT 1
          `,
          args: ["David", reminderData],
        });

        if (existing.rows.length === 0) {
          await turso.execute({
            sql: `INSERT INTO notifications (userName, title, message, data) VALUES (?, ?, ?, ?)`,
            args: ["David", "Calendar Reminder", message, reminderData],
          });

          await sendPushToUser("David", { title: "Calendar Reminder", message, data: { eventId: ev.id } });
        }
      }

      if (ev.notifyGemma) {
        const existing = await turso.execute({
          sql: `
            SELECT id
            FROM notifications
            WHERE userName = ?
              AND title = 'Calendar Reminder'
              AND data = ?
            LIMIT 1
          `,
          args: ["Gemma", reminderData],
        });

        if (existing.rows.length === 0) {
          await turso.execute({
            sql: `INSERT INTO notifications (userName, title, message, data) VALUES (?, ?, ?, ?)`,
            args: ["Gemma", "Calendar Reminder", message, reminderData],
          });

          await sendPushToUser("Gemma", { title: "Calendar Reminder", message, data: { eventId: ev.id } });
        }
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

ensureAppOpenEventsTable().catch((error) => {
  console.error("Failed to ensure app open events table:", error);
});

ensureChangeLogTable().catch((error) => {
  console.error("Failed to ensure change log table:", error);
});

ensureClickLogTable().catch((error) => {
  console.error("Failed to ensure click log table:", error);
});

ensureHeroPointsTables().catch((error) => {
  console.error("Failed to ensure Hero Points tables:", error);
});

ensureNotesTables().catch((error) => {
  console.error("Failed to ensure notes tables:", error);
});

ensureAppConfigTables().catch((error) => {
  console.error("Failed to ensure app config tables:", error);
});

ensureSmartDeviceHaColumn().catch((error) => {
  console.error("Failed to ensure smart device Home Assistant column:", error);
});

ensureFieldFarmColumn()
  .then(ensureFieldTypeColumn)
  .catch((error) => {
    console.error("Failed to ensure field columns:", error);
  });

ensureSheepEarTagColumns().catch((error) => {
  console.error("Failed to ensure sheep ear tag columns:", error);
});

ensureEidCymruMovementSubmissionsTable().catch((error) => {
  console.error("Failed to ensure EID Cymru movement submissions table:", error);
});

ensureFarmHoldingsTable().catch((error) => {
  console.error("Failed to ensure farm holdings table:", error);
});

ensureSalesTable().catch((error) => {
  console.error("Failed to ensure sales table:", error);
});

ensureLivestockPurchasesTable().catch((error) => {
  console.error("Failed to ensure livestock purchases table:", error);
});

const SALE_TYPES = ["livestock", "meat", "logs", "other"];

function normaliseDateOnly(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function currentTaxYearRange(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const startYear = month > 4 || (month === 4 && day >= 6) ? year : year - 1;
  return taxYearRange(startYear);
}

function taxYearRange(startYear) {
  return {
    startYear,
    startDate: `${startYear}-04-06`,
    endDate: `${startYear + 1}-04-05`,
    label: `Tax year ${startYear}/${String(startYear + 1).slice(-2)}`,
  };
}

app.get("/sales", async (req, res) => {
  try {
    const result = await turso.execute(`
      SELECT sales.*, sheep.name AS sheepName
      FROM sales
      LEFT JOIN sheep ON sheep.id = sales.sheepId
      ORDER BY sales.saleDate DESC, sales.id DESC
    `);

    const requestedStartYear = Number.parseInt(req.query.taxYear, 10);
    const taxYear = Number.isInteger(requestedStartYear) && requestedStartYear >= 2000 && requestedStartYear <= 2100
      ? taxYearRange(requestedStartYear)
      : currentTaxYearRange();
    const totalsByType = {};
    let total = 0;
    for (const sale of result.rows) {
      const saleDate = normaliseDateOnly(sale.saleDate);
      if (!saleDate || saleDate < taxYear.startDate || saleDate > taxYear.endDate) {
        continue;
      }
      const amount = Number(sale.total) || 0;
      totalsByType[sale.saleType] = (totalsByType[sale.saleType] || 0) + amount;
      total += amount;
    }

    res.json({
      sales: result.rows,
      totalsByType,
      total,
      period: {
        kind: "uk-tax-year",
        startDate: taxYear.startDate,
        endDate: taxYear.endDate,
        label: taxYear.label,
      },
    });
  } catch (error) {
    console.error("Load sales error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/sales", async (req, res) => {
  try {
    const {
      saleType,
      saleDate,
      description,
      quantity,
      unitPrice,
      customer,
      customerCph,
      sheepId,
      notes,
    } = req.body || {};

    const type = SALE_TYPES.includes(saleType) ? saleType : "other";
    if (!saleDate) {
      return res.status(400).json({ error: "A sale date is required" });
    }

    // A livestock sale is always one animal.
    const qty = type === "livestock" ? 1 : Number(quantity);
    const price = Number(unitPrice);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than zero" });
    }
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: "Price must be zero or greater" });
    }

    const linkedSheepId = sheepId ? Number(sheepId) : null;
    let linkedSheep = null;
    let sourceFarm = null;
    if (linkedSheepId) {
      const sheep = await turso.execute({
        sql: "SELECT id, eid, currentField FROM sheep WHERE id = ?",
        args: [linkedSheepId],
      });
      if (sheep.rows.length === 0) {
        return res.status(404).json({ error: "Sheep not found" });
      }
      linkedSheep = sheep.rows[0];
      const field = await turso.execute({
        sql: "SELECT farm FROM fields WHERE name = ?",
        args: [linkedSheep.currentField],
      });
      sourceFarm = field.rows[0]?.farm || "Gellidywyll";
    }

    const result = await turso.execute({
      sql: `
        INSERT INTO sales
          (saleType, saleDate, description, quantity, unitPrice, total,
           customer, sheepId, notes, recordedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        type,
        saleDate,
        description ?? null,
        qty,
        price,
        qty * price,
        customer ?? null,
        linkedSheepId,
        notes ?? null,
        req.user ?? null,
      ],
    });

    // Selling the animal itself takes it out of the flock; a meat box does not.
    if (linkedSheepId && type === "livestock") {
      await turso.execute({
        sql: "UPDATE sheep SET status = 'Sold' WHERE id = ?",
        args: [linkedSheepId],
      });
    }

    if (linkedSheepId) {
      await addHistory(
        linkedSheepId,
        "💷 Sale",
        `${description || type} - £${(qty * price).toFixed(2)}`,
        saleDate
      );
    }

    let eidCymru = null;
    if (linkedSheepId && type === "livestock") {
      eidCymru = await createEidCymruReviewSubmission({
        sourceFarm,
        destinationFarm: "External holding",
        destinationCph: String(customerCph || "").trim(),
        sourceLocation: linkedSheep.currentField || sourceFarm,
        destinationLocation: customer || "External holding",
        movementDate: saleDate,
        animalEids: [linkedSheep.eid],
        movedBy: req.user || "Livestock sale",
      });
    }

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
      eidCymru: eidCymru && { status: eidCymru.status, error: eidCymru.lastError },
    });
  } catch (error) {
    console.error("Create sale error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/livestock-purchases", async (req, res) => {
  try {
    const {
      name,
      eid,
      sex,
      dob,
      currentField,
      purchaseDate,
      seller,
      sellerCph,
      price,
      notes,
    } = req.body || {};
    const normalizedEid = String(eid || "").trim();
    const normalizedSellerCph = String(sellerCph || "").trim();
    const amount = Number(price);
    if (!normalizedEid || !currentField || !purchaseDate) {
      return res.status(400).json({ error: "EID, destination field, and purchase date are required" });
    }
    if (!normalizedSellerCph) {
      return res.status(400).json({ error: "The seller's CPH number is required" });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: "Price must be zero or greater" });
    }
    const field = await turso.execute({
      sql: "SELECT farm FROM fields WHERE name = ?",
      args: [currentField],
    });
    if (!field.rows[0]) {
      return res.status(400).json({ error: "Destination field does not exist" });
    }
    const existingSheep = await turso.execute({
      sql: "SELECT id FROM sheep WHERE eid = ?",
      args: [normalizedEid],
    });
    if (existingSheep.rows.length > 0) {
      return res.status(409).json({ error: "A sheep with this EID is already in the register" });
    }

    const sheepResult = await turso.execute({
      sql: `
        INSERT INTO sheep (name, eid, sex, dob, groupName, mother, currentField, status, notes)
        VALUES (?, ?, ?, ?, NULL, NULL, ?, 'Active', ?)
      `,
      args: [name || null, normalizedEid, sex || null, dob || null, currentField, notes || null],
    });
    const sheepId = Number(sheepResult.lastInsertRowid);
    const purchaseResult = await turso.execute({
      sql: `
        INSERT INTO livestockPurchases
          (sheepId, purchaseDate, seller, sellerCph, price, notes, recordedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [sheepId, purchaseDate, seller || null, normalizedSellerCph, amount, notes || null, req.user || null],
    });
    await addHistory(
      sheepId,
      "🛒 Purchase",
      `Purchased from ${seller || "external holding"} - £${amount.toFixed(2)}`,
      purchaseDate
    );
    const eidCymru = await createEidCymruReviewSubmission({
      sourceFarm: "External holding",
      destinationFarm: field.rows[0].farm || "Gellidywyll",
      sourceCph: normalizedSellerCph,
      sourceLocation: seller || "External holding",
      destinationLocation: currentField,
      movementDate: purchaseDate,
      animalEids: [normalizedEid],
      movedBy: req.user || "Livestock purchase",
    });
    res.json({
      success: true,
      id: Number(purchaseResult.lastInsertRowid),
      sheepId,
      eidCymru: { status: eidCymru.status, error: eidCymru.lastError },
    });
  } catch (error) {
    console.error("Create livestock purchase error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/sales/:id", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: "DELETE FROM sales WHERE id = ?",
      args: [req.params.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete sale error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Notes are shared between users, so no per-user filtering here.
app.get("/notes", async (req, res) => {
  try {
    const notes = await turso.execute(
      "SELECT * FROM notes ORDER BY updatedDate DESC, id DESC"
    );
    const items = await turso.execute(
      "SELECT * FROM noteItems ORDER BY position, id"
    );

    const itemsByNote = new Map();
    for (const item of items.rows) {
      const list = itemsByNote.get(item.noteId) || [];
      list.push(item);
      itemsByNote.set(item.noteId, list);
    }

    res.json(
      notes.rows.map((note) => ({
        ...note,
        items: itemsByNote.get(note.id) || [],
      }))
    );
  } catch (error) {
    console.error("Load notes error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/notes", async (req, res) => {
  try {
    const { title, body, kind } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "A title is required" });
    }

    const result = await turso.execute({
      sql: `
        INSERT INTO notes (title, body, kind, createdBy)
        VALUES (?, ?, ?, ?)
      `,
      args: [
        String(title).trim(),
        body ?? null,
        kind === "list" ? "list" : "note",
        req.user ?? null,
      ],
    });

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/notes/:id", async (req, res) => {
  try {
    const { title, body } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "A title is required" });
    }

    const result = await turso.execute({
      sql: `
        UPDATE notes
        SET title = ?,
            body = ?,
            updatedDate = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [String(title).trim(), body ?? null, req.params.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/notes/:id", async (req, res) => {
  try {
    await turso.execute({
      sql: "DELETE FROM noteItems WHERE noteId = ?",
      args: [req.params.id],
    });

    const result = await turso.execute({
      sql: "DELETE FROM notes WHERE id = ?",
      args: [req.params.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/notes/:id/items", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Item text is required" });
    }

    const note = await turso.execute({
      sql: "SELECT id FROM notes WHERE id = ?",
      args: [req.params.id],
    });
    if (note.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    const position = await turso.execute({
      sql: "SELECT COALESCE(MAX(position), 0) + 1 AS next FROM noteItems WHERE noteId = ?",
      args: [req.params.id],
    });

    const result = await turso.execute({
      sql: `
        INSERT INTO noteItems (noteId, text, position)
        VALUES (?, ?, ?)
      `,
      args: [
        req.params.id,
        String(text).trim(),
        Number(position.rows[0].next) || 1,
      ],
    });

    await turso.execute({
      sql: "UPDATE notes SET updatedDate = CURRENT_TIMESTAMP WHERE id = ?",
      args: [req.params.id],
    });

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error("Create note item error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/note-items/:itemId", async (req, res) => {
  try {
    const { text, done } = req.body || {};

    const existing = await turso.execute({
      sql: "SELECT * FROM noteItems WHERE id = ?",
      args: [req.params.itemId],
    });
    const item = existing.rows[0];
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    await turso.execute({
      sql: "UPDATE noteItems SET text = ?, done = ? WHERE id = ?",
      args: [
        text === undefined ? item.text : String(text).trim(),
        done === undefined ? item.done : (done ? 1 : 0),
        req.params.itemId,
      ],
    });

    await turso.execute({
      sql: "UPDATE notes SET updatedDate = CURRENT_TIMESTAMP WHERE id = ?",
      args: [item.noteId],
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Update note item error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/note-items/:itemId", async (req, res) => {
  try {
    const result = await turso.execute({
      sql: "DELETE FROM noteItems WHERE id = ?",
      args: [req.params.itemId],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete note item error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/feed-records", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM feedRecords ORDER BY feedDate DESC, id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/feed-records", async (req, res) => {
  try {
    const { groupNames, feedType, feedDate, totalCost, notes, recordedBy } = req.body || {};
    const selectedGroups = Array.isArray(groupNames) ? groupNames.filter(Boolean) : [];
    if (!feedType || !feedDate || selectedGroups.length === 0) {
      return res.status(400).json({ error: "At least one flock, feed, and date are required" });
    }
    const placeholders = selectedGroups.map(() => "?").join(", ");
    const flock = await turso.execute({
      sql: `SELECT groupName, COUNT(*) AS count FROM sheep WHERE groupName IN (${placeholders}) GROUP BY groupName`,
      args: selectedGroups,
    });
    const sheepCount = flock.rows.reduce((total, row) => total + Number(row.count || 0), 0);
    if (sheepCount === 0) return res.status(400).json({ error: "No sheep found in the selected flocks" });
    const cost = Number(totalCost);
    if (!Number.isFinite(cost) || cost < 0) {
      return res.status(400).json({ error: "Total feed cost must be zero or greater" });
    }
    const result = await turso.execute({
      sql: `
        INSERT INTO feedRecords
          (groupName, feedType, feedDate, totalCost, sheepCount, costPerSheep, notes, recordedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [selectedGroups.join(", "), feedType, feedDate, cost, sheepCount, cost / sheepCount, notes || "", recordedBy || ""],
    });
    for (const row of flock.rows) {
      await turso.execute({
        sql: "INSERT INTO feedRecordGroups (feedRecordId, groupName, sheepCount) VALUES (?, ?, ?)",
        args: [Number(result.lastInsertRowid), row.groupName, Number(row.count)],
      });
    }
    res.json({ success: true, id: Number(result.lastInsertRowid), sheepCount, costPerSheep: cost / sheepCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/ai/config", async (req, res) => {
  try {
    const configResult = await turso.execute("SELECT * FROM appConfig ORDER BY category, key");
    const devicesResult = await turso.execute("SELECT * FROM smartDevices ORDER BY id DESC");
    res.json({
      config: configResult.rows,
      devices: devicesResult.rows,
    });
  } catch (error) {
    console.error("Get AI config error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/home-assistant/status", async (req, res) => {
  res.json({ configured: homeAssistantConfigured() });
});

app.get("/home-assistant/entities", async (req, res) => {
  try {
    if (req.user !== "David") {
      return res.status(403).json({ error: "Only David can browse Home Assistant entities." });
    }
    if (!homeAssistantConfigured()) {
      return res.status(400).json({ error: "Home Assistant is not configured on this server yet." });
    }
    const response = await homeAssistantRequest("/api/states");
    const domains = ["light", "switch", "camera"];
    const entities = response.data
      .filter((entity) => domains.includes(entity.entity_id.split(".")[0]))
      .map((entity) => ({
        entityId: entity.entity_id,
        domain: entity.entity_id.split(".")[0],
        name: entity.attributes?.friendly_name || entity.entity_id,
        state: entity.state,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ entities });
  } catch (error) {
    console.error("Get Home Assistant entities error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/ai/devices", async (req, res) => {
  try {
    if (req.user !== "David") {
      return res.status(403).json({ error: "Access denied. Only David can modify smart devices." });
    }
    const { name, type, icon, endpointUrl, location, haEntityId } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Device name is required" });
    }
    const result = await turso.execute({
      sql: `
        INSERT INTO smartDevices (name, type, icon, endpointUrl, location, createdBy, haEntityId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        String(name).trim(),
        type || "toggle",
        icon || "💡",
        endpointUrl || null,
        location || null,
        req.user || "David",
        haEntityId || null,
      ],
    });
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error("Create smart device error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/ai/devices/:id", async (req, res) => {
  try {
    if (req.user !== "David") {
      return res.status(403).json({ error: "Access denied. Only David can modify smart devices." });
    }
    const existing = await turso.execute({
      sql: "SELECT * FROM smartDevices WHERE id = ?",
      args: [req.params.id],
    });
    const device = existing.rows[0];
    if (!device) return res.status(404).json({ error: "Device not found" });

    const { name, icon, endpointUrl, location, haEntityId } = req.body || {};
    await turso.execute({
      sql: `
        UPDATE smartDevices
        SET name = ?, icon = ?, endpointUrl = ?, location = ?, haEntityId = ?
        WHERE id = ?
      `,
      args: [
        name?.trim() || device.name,
        icon ?? device.icon,
        endpointUrl ?? device.endpointUrl,
        location ?? device.location,
        haEntityId ?? device.haEntityId,
        req.params.id,
      ],
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Update smart device error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/ai/devices/:id/toggle", async (req, res) => {
  try {
    const deviceResult = await turso.execute({
      sql: "SELECT * FROM smartDevices WHERE id = ?",
      args: [req.params.id],
    });
    const device = deviceResult.rows[0];
    if (!device) return res.status(404).json({ error: "Device not found" });

    let newState = device.state === "on" ? "off" : "on";

    if (device.haEntityId) {
      if (!homeAssistantConfigured()) {
        return res.status(400).json({ error: "Home Assistant is not configured on this server yet." });
      }
      await homeAssistantRequest("/api/services/homeassistant/toggle", {
        method: "post",
        data: { entity_id: device.haEntityId },
      });
      const stateRes = await homeAssistantRequest(`/api/states/${device.haEntityId}`);
      newState = stateRes.data.state === "on" ? "on" : "off";
    } else if (device.endpointUrl) {
      try {
        await axios.post(device.endpointUrl, { state: newState, deviceId: device.id }, { timeout: 4000 });
      } catch (err) {
        console.warn(`Device webhook trigger warning for ${device.name}:`, err.message);
      }
    }

    await turso.execute({
      sql: "UPDATE smartDevices SET state = ?, updatedDate = CURRENT_TIMESTAMP WHERE id = ?",
      args: [newState, req.params.id],
    });

    res.json({ success: true, state: newState });
  } catch (error) {
    console.error("Toggle smart device error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/ai/devices/:id/camera-snapshot", async (req, res) => {
  try {
    const deviceResult = await turso.execute({
      sql: "SELECT * FROM smartDevices WHERE id = ?",
      args: [req.params.id],
    });
    const device = deviceResult.rows[0];
    if (!device || !device.haEntityId || !device.haEntityId.startsWith("camera.")) {
      return res.status(404).json({ error: "No Home Assistant camera linked to this device" });
    }
    if (!homeAssistantConfigured()) {
      return res.status(400).json({ error: "Home Assistant is not configured on this server yet." });
    }
    const response = await homeAssistantRequest(`/api/camera_proxy/${device.haEntityId}`, {
      responseType: "arraybuffer",
    });
    res.set("Content-Type", response.headers["content-type"] || "image/jpeg");
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error("Camera snapshot error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/ai/devices/:id", async (req, res) => {
  try {
    if (req.user !== "David") {
      return res.status(403).json({ error: "Access denied. Only David can delete smart devices." });
    }
    await turso.execute({
      sql: "DELETE FROM smartDevices WHERE id = ?",
      args: [req.params.id],
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete smart device error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/dev-notes", async (req, res) => {
  try {
    const result = await turso.execute(
      "SELECT * FROM devNotes ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get dev notes error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/dev-notes", async (req, res) => {
  try {
    const { kind, title, details, screen } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    const result = await turso.execute({
      sql: `
        INSERT INTO devNotes (kind, title, details, screen, reportedBy)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        kind || "bug",
        String(title).trim(),
        details || null,
        screen || null,
        req.user || "David",
      ],
    });
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error("Create dev note error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/dev-notes/:id", async (req, res) => {
  try {
    await turso.execute({
      sql: "DELETE FROM devNotes WHERE id = ?",
      args: [req.params.id],
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete dev note error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/ai/customizer", async (req, res) => {
  try {
    if (req.user !== "David") {
      return res.status(403).json({ error: "Access denied. AI Customizer is restricted to David." });
    }
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: "Prompt text is required" });
    }

    const userPrompt = String(prompt).trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    let aiResponseText = "";
    let parsedActions = [];

    const devNotesResult = await turso.execute("SELECT * FROM devNotes ORDER BY id DESC");
    const currentDevNotes = devNotesResult.rows || [];

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const systemInstruction = `You are an AI App Customizer & Assistant for Wern Villa Farm Manager PWA.
You help David configure and expand his farm manager app (smart lights, switches, water pumps, field sensors, custom drop-downs, app settings, task templates, and reviewing field bug reports).
Current Open Field Bug Reports / Ideas in Database:
${JSON.stringify(currentDevNotes, null, 2)}

Return ONLY a valid JSON object matching this schema:
{
  "reply": "Friendly response to David explaining what was found, added, resolved or changed.",
  "actions": [
    {
      "type": "add_smart_device",
      "name": "Device name",
      "icon": "💡 or 🔌 or 🚪 or 💧 or 🌾 or 📹",
      "deviceType": "toggle or button or sensor",
      "location": "Location string",
      "endpointUrl": "Optional webhook url"
    },
    {
      "type": "set_config",
      "key": "unique_config_key",
      "value": "string value",
      "category": "theme or task or custom_fields or features"
    },
    {
      "type": "resolve_dev_note",
      "id": 1
    }
  ]
}`;
        const geminiRes = await axios.post(
          geminiUrl,
          {
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemInstruction}\n\nUser Prompt: ${userPrompt}` }
                ]
              }
            ]
          },
          { headers: { "Content-Type": "application/json" }, timeout: 15000 }
        );

        const rawText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiResponseText = parsed.reply || "Done!";
          parsedActions = Array.isArray(parsed.actions) ? parsed.actions : [];
        } else {
          aiResponseText = rawText || "Processed your request.";
        }
      } catch (geminiError) {
        console.error("Gemini API call error:", geminiError?.response?.data || geminiError.message);
      }
    }

    if (parsedActions.length === 0) {
      const lower = userPrompt.toLowerCase();
      if (lower.includes("bug") || lower.includes("report") || lower.includes("issue") || lower.includes("fix") || lower.includes("check")) {
        if (currentDevNotes.length === 0) {
          aiResponseText = aiResponseText || "No open field bugs or feature requests found in the database!";
        } else {
          const notesSummary = currentDevNotes
            .map((n) => `• [${n.kind.toUpperCase()}] #${n.id}: "${n.title}" (${n.details || "no details"}) on ${n.screen} screen`)
            .join("\n");
          if (!aiResponseText) {
            aiResponseText = `Found ${currentDevNotes.length} reported note(s):\n${notesSummary}`;
          }
        }
      } else if (lower.includes("light") || lower.includes("switch") || lower.includes("lamp") || lower.includes("pump") || lower.includes("gate") || lower.includes("silo") || lower.includes("camera") || lower.includes("device") || lower.includes("button")) {
        let icon = "💡";
        if (lower.includes("pump") || lower.includes("water") || lower.includes("trough")) icon = "💧";
        if (lower.includes("gate") || lower.includes("door")) icon = "🚪";
        if (lower.includes("silo") || lower.includes("feed")) icon = "🌾";
        if (lower.includes("camera")) icon = "📹";

        let deviceName = userPrompt;
        if (deviceName.length > 30) {
          deviceName = userPrompt.replace(/^(add|create|make|set up|turn on)\s+(a|an|the)?\s*/i, "").slice(0, 30);
        }

        parsedActions.push({
          type: "add_smart_device",
          name: deviceName,
          icon,
          deviceType: "toggle",
          location: "Farm",
          endpointUrl: "",
        });

        if (!aiResponseText) {
          aiResponseText = `Added smart device "${deviceName}" to your farm controls!`;
        }
      } else {
        const configKey = "custom_setting_" + Date.now();
        parsedActions.push({
          type: "set_config",
          key: configKey,
          value: userPrompt,
          category: "user_customizations",
        });
        if (!aiResponseText) {
          aiResponseText = `Saved custom app setting: "${userPrompt}"`;
        }
      }
    }

    for (const action of parsedActions) {
      if (action.type === "add_smart_device") {
        await turso.execute({
          sql: `
            INSERT INTO smartDevices (name, type, icon, endpointUrl, location, createdBy)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          args: [action.name, action.deviceType || "toggle", action.icon || "💡", action.endpointUrl || null, action.location || null, "David"],
        });
      } else if (action.type === "set_config") {
        await turso.execute({
          sql: `
            INSERT INTO appConfig (key, value, category, updatedBy)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedDate = CURRENT_TIMESTAMP
          `,
          args: [action.key, String(action.value), action.category || "general", "David"],
        });
      } else if (action.type === "resolve_dev_note" && action.id) {
        await turso.execute({
          sql: "DELETE FROM devNotes WHERE id = ?",
          args: [action.id],
        });
      }
    }

    const configResult = await turso.execute("SELECT * FROM appConfig ORDER BY category, key");
    const devicesResult = await turso.execute("SELECT * FROM smartDevices ORDER BY id DESC");
    const updatedDevNotes = await turso.execute("SELECT * FROM devNotes ORDER BY id DESC");

    res.json({
      success: true,
      reply: aiResponseText,
      actionsExecuted: parsedActions.length,
      config: configResult.rows,
      devices: devicesResult.rows,
      devNotes: updatedDevNotes.rows,
    });
  } catch (error) {
    console.error("AI customizer error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/change-log", async (req, res) => {
  try {
    if (req.user !== "David") return res.status(403).json({ error: "Only David can view the change log" });
    const result = await turso.execute(`
      SELECT id, userName, method, path, statusCode, details, changedAt
      FROM changeLog
      ORDER BY id DESC
      LIMIT 500
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("Change log fetch error:", error);
    return res.status(500).json({ error: "Could not load change log" });
  }
});