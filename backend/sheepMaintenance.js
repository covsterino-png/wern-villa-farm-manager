require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { createClient } = require("@libsql/client");

const TARGET_BREEDING_EWES = 106;
const TARGET_2026_LAMBS = 43;
const TARGET_TOTAL = TARGET_BREEDING_EWES + TARGET_2026_LAMBS;
const PRESERVE_EXISTING_OTHER_SHEEP = true;
const BREEDING_EWES_GROUP = "Breeding Ewes";
const LAMBS_2026_GROUP = "2026 lambs";
const APPLY = process.argv.includes("--apply");
const ASSIGN_GROUPS = process.argv.includes("--assign-groups");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function clean(value) {
  return String(value || "").trim();
}

function is2026Lamb(sheep) {
  const dob = clean(sheep.dob);
  const status = clean(sheep.status);
  const groupName = clean(sheep.groupName);
  return dob.startsWith("2026") || /lamb/i.test(status) || /lamb/i.test(groupName);
}

function isBreedingEwe(sheep) {
  const sex = clean(sheep.sex);
  const status = clean(sheep.status);
  return status === "Breeding" || (sex === "Ewe" && !is2026Lamb(sheep));
}

function nextTempName(prefix, usedNames) {
  let index = 1;
  while (usedNames.has(`${prefix} temp ${index}`.toLowerCase())) {
    index += 1;
  }
  const name = `${prefix} temp ${index}`;
  usedNames.add(name.toLowerCase());
  return name;
}

async function groupField(groupName) {
  const result = await db.execute({
    sql: "SELECT currentField FROM flockRegister WHERE name = ?",
    args: [groupName],
  });
  if (!result.rows[0]) {
    throw new Error(`Missing flock group: ${groupName}`);
  }
  return clean(result.rows[0].currentField) || null;
}

async function assignTempGroups() {
  const breedingField = await groupField(BREEDING_EWES_GROUP);
  const lambField = await groupField(LAMBS_2026_GROUP);
  const sheepTempUpdate = await db.execute({
    sql: `
      UPDATE sheep
      SET groupName = ?, currentField = ?
      WHERE name GLOB 'sheep temp [0-9]*'
        AND (groupName IS NULL OR groupName = '')
    `,
    args: [BREEDING_EWES_GROUP, breedingField],
  });
  const lambTempUpdate = await db.execute({
    sql: `
      UPDATE sheep
      SET groupName = ?, currentField = ?
      WHERE name GLOB 'lamb temp [0-9]*'
        AND (groupName IS NULL OR groupName = '')
    `,
    args: [LAMBS_2026_GROUP, lambField],
  });

  console.log(JSON.stringify({
    sheepTempGroupsAssigned: sheepTempUpdate.rowsAffected,
    lambTempGroupsAssigned: lambTempUpdate.rowsAffected,
  }, null, 2));
}

async function fetchSheep() {
  const result = await db.execute(
    "SELECT id, name, eid, sex, dob, groupName, mother, currentField, status, notes FROM sheep ORDER BY id"
  );
  return result.rows;
}

async function main() {
  const columns = await db.execute("PRAGMA table_info(sheep)");
  console.log("sheep columns:", columns.rows.map((row) => row.name).join(", "));

  if (ASSIGN_GROUPS) {
    await assignTempGroups();
    return;
  }

  const before = await fetchSheep();
  const deleteCandidates = before.filter((sheep) => clean(sheep.eid) && !clean(sheep.name));
  const afterDelete = before.filter((sheep) => !deleteCandidates.some((candidate) => candidate.id === sheep.id));

  const existing2026Lambs = afterDelete.filter(is2026Lamb).length;
  const existingBreedingEwes = afterDelete.filter(isBreedingEwe).length;
  const existingOtherSheep = afterDelete.filter((sheep) => !is2026Lamb(sheep) && !isBreedingEwe(sheep));
  const lambsToCreate = Math.max(0, TARGET_2026_LAMBS - existing2026Lambs);
  const openSlotsAfterLambs = Math.max(0, TARGET_TOTAL - afterDelete.length - lambsToCreate);
  const breedingEweDeficit = Math.max(0, TARGET_BREEDING_EWES - existingBreedingEwes);
  const breedingEwesToCreate = PRESERVE_EXISTING_OTHER_SHEEP
    ? Math.min(breedingEweDeficit, openSlotsAfterLambs)
    : breedingEweDeficit;
  const projectedTotal = afterDelete.length + lambsToCreate + breedingEwesToCreate;

  console.log(JSON.stringify({
    mode: APPLY ? "apply" : "dry-run",
    beforeTotal: before.length,
    deleteBlankNameWithEid: deleteCandidates.length,
    afterDeleteTotal: afterDelete.length,
    preservedOtherSheep: existingOtherSheep.map((sheep) => ({ id: sheep.id, name: sheep.name, sex: sheep.sex, status: sheep.status })),
    existing2026Lambs,
    existingBreedingEwes,
    lambsToCreate,
    breedingEwesToCreate,
    remainingBreedingEweDeficit: Math.max(0, breedingEweDeficit - breedingEwesToCreate),
    projectedTotal,
  }, null, 2));

  if (deleteCandidates.length) {
    console.log("delete candidate ids:", deleteCandidates.map((sheep) => `${sheep.id}:${sheep.eid}`).join(", "));
  }

  if (projectedTotal !== TARGET_TOTAL) {
    throw new Error(`Projected total ${projectedTotal} does not match target ${TARGET_TOTAL}. Review classifications before applying.`);
  }

  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to change data.");
    return;
  }

  for (const sheep of deleteCandidates) {
    await db.execute({
      sql: "DELETE FROM sheep WHERE id = ?",
      args: [sheep.id],
    });
  }

  const usedNames = new Set(afterDelete.map((sheep) => clean(sheep.name).toLowerCase()).filter(Boolean));

  for (let count = 0; count < breedingEwesToCreate; count += 1) {
    const name = nextTempName("sheep", usedNames);
    await db.execute({
      sql: `
        INSERT INTO sheep (name, eid, sex, dob, groupName, mother, currentField, status, notes)
        VALUES (?, NULL, 'Ewe', NULL, ?, NULL, ?, 'Breeding', NULL)
      `,
      args: [name, BREEDING_EWES_GROUP, await groupField(BREEDING_EWES_GROUP)],
    });
  }

  for (let count = 0; count < lambsToCreate; count += 1) {
    const name = nextTempName("lamb", usedNames);
    await db.execute({
      sql: `
        INSERT INTO sheep (name, eid, sex, dob, groupName, mother, currentField, status, notes)
        VALUES (?, NULL, NULL, '2026-01-01', ?, NULL, ?, 'Store Lamb', NULL)
      `,
      args: [name, LAMBS_2026_GROUP, await groupField(LAMBS_2026_GROUP)],
    });
  }

  const after = await fetchSheep();
  console.log(JSON.stringify({
    afterTotal: after.length,
    after2026Lambs: after.filter(is2026Lamb).length,
    afterBreedingEwes: after.filter(isBreedingEwe).length,
    remainingBlankNameWithEid: after.filter((sheep) => clean(sheep.eid) && !clean(sheep.name)).length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});