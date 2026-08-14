
require('dotenv').config();
const { createClient } = require('@libsql/client');
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    const result = await db.execute('SELECT userName, passwordHash, passwordSalt FROM authUsers');
    for (const row of result.rows) {
      const hasPassword = (row.passwordHash && row.passwordHash.trim() !== '') ? 'yes' : 'no';
      console.log('User:', row.userName, 'hasPassword:', hasPassword);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}
run();
