const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./db');
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ connected: true, users: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ connected: false });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));