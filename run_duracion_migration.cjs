require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, 'sql', 'migrate_duracion.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration migrate_duracion.sql executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
