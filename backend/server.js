require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const sanitize = require('./middleware/sanitize');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors(corsOptions));
// Limit body payload to 2mb to prevent DoS via large Base64 images
app.use(express.json({ limit: '2mb' }));
app.use(sanitize);

// Rate limiting configuration
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Demasiados intentos desde esta IP, por favor intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Connect to MongoDB
connectDB();

// API routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const quoteRoutes = require('./routes/quote');
const crmRoutes = require('./routes/crm');
const catalogRoutes = require('./routes/catalog');

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quote', quoteRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/catalog', catalogRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API listening on port ${PORT}`));
