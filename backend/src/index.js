require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transferRoutes = require('./routes/transfers');
const { notFound, errorHandler } = require('./middleware/errors');
const { startSweeper } = require('./lib/sweeper');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/accounts', accountRoutes);
app.use('/transfers', transferRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`walletforge backend listening on port ${port}`));
  startSweeper();
}

module.exports = app;
