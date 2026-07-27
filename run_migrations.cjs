require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    const bundlesSql = fs.readFileSync(path.join(__dirname, 'sql', 'migrate_bundles.sql'), 'utf8');
    await client.query(bundlesSql);
    console.log('migrate_bundles.sql executed successfully.');

    const preguntasSql = fs.readFileSync(path.join(__dirname, 'sql', 'migrate_preguntas.sql'), 'utf8');
    await client.query(preguntasSql);
    console.log('migrate_preguntas.sql executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
