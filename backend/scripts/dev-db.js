const path = require('path');
const fs = require('fs');
const EmbeddedPostgres = require('embedded-postgres').default;
const { Client } = require('pg');

const dataDir = path.join(__dirname, '..', '.devdata');
const PORT = Number(process.env.PG_PORT || 55433);

async function ensureRoleAndDatabase() {
  const admin = new Client({
    host: 'localhost',
    port: PORT,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });
  await admin.connect();
  try {
    const role = await admin.query("select 1 from pg_roles where rolname = 'walletforge'");
    if (role.rowCount === 0) {
      await admin.query("create role walletforge login password 'walletforge'");
    }
    const database = await admin.query("select 1 from pg_database where datname = 'walletforge'");
    if (database.rowCount === 0) {
      await admin.query('create database walletforge owner walletforge');
    }
  } finally {
    await admin.end();
  }
}

async function main() {
  const alreadyInitialised = fs.existsSync(path.join(dataDir, 'PG_VERSION'));
  const postgres = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: true,
  });

  if (!alreadyInitialised) {
    console.log('initialising local postgres data directory...');
    await postgres.initialise();
  }
  await postgres.start();
  await ensureRoleAndDatabase();

  console.log(`\nlocal postgres ready on port ${PORT}`);
  console.log(`  app role  : postgres://walletforge:walletforge@localhost:${PORT}/walletforge   (RLS enforced)`);
  console.log(`  superuser : postgres://postgres:postgres@localhost:${PORT}/walletforge         (RLS bypassed; use to inspect every tenant)`);
  console.log('\nleave this running and press Ctrl+C to stop the database.\n');

  const shutdown = async () => {
    console.log('\nstopping local postgres...');
    try {
      await postgres.stop();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
