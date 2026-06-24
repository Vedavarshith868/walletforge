const { runMigrations } = require('../scripts/migrate');

module.exports = async () => {
  require('dotenv').config();
  await runMigrations();
};
