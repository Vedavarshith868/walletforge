const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
  const client = await pool.connect();
  let applied = 0;
  try {
    await client.query(
      `create table if not exists schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      )`
    );

    const directory = path.join(__dirname, '..', 'migrations');
    const files = fs
      .readdirSync(directory)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const done = new Set(
      (await client.query('select version from schema_migrations')).rows.map((row) => row.version)
    );

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(directory, file), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (version) values ($1)', [file]);
        await client.query('commit');
        applied += 1;
      } catch (error) {
        await client.query('rollback');
        throw new Error(`migration ${file} failed: ${error.message}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
  return applied;
}

module.exports = { runMigrations };

if (require.main === module) {
  require('dotenv').config();
  runMigrations()
    .then((applied) => {
      console.log(applied === 0 ? 'schema already up to date' : `applied ${applied} migration(s)`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
