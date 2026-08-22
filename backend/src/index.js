require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const inspectionRoutes = require('./routes/inspection.routes');

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  })
);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Static File Serving (uploaded images) ────────────────────────────────────
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/inspections', inspectionRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, service: 'AutoTrust API', version: '1.0.0', uptime: process.uptime() });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 AutoTrust API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
