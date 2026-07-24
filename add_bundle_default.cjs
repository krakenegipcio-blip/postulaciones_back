const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    console.log('Adding es_default column to bundle_postulacion...');
    await client.query(`
      ALTER TABLE bundle_postulacion 
      ADD COLUMN IF NOT EXISTS es_default BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log('Done!');
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await client.end();
  }
}
run();
