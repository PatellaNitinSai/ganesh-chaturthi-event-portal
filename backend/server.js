require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Initializing db.js also creates tables + seeds default admin on first run
require('./db');

const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const expenseRoutes = require('./routes/expenses');
const vendorRoutes = require('./routes/vendors');
const inventoryRoutes = require('./routes/inventory');
const teamRoutes = require('./routes/team');
const announcementRoutes = require('./routes/announcements');
const eventPhaseRoutes = require('./routes/eventPhases');
const settingsRoutes = require('./routes/settings');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ganesh-portal-backend',
    message: 'Ganesh Chaturthi Portal API is running'
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ganesh-portal-backend' }));
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/event-phases', eventPhaseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Generic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ganesh Chaturthi Portal API running on port ${PORT}`);
});
