const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT id, nombre FROM fase_seguimiento");
    console.log("Fases de seguimiento:");
    res.rows.forEach(r => console.log(`${r.id}: ${r.nombre}`));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
