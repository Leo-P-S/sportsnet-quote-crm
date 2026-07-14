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
app.use(express.json());
app.use(sanitize);

// Connect to MongoDB
connectDB();

// API routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const quoteRoutes = require('./routes/quote');
const crmRoutes = require('./routes/crm');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quote', quoteRoutes);
app.use('/api/crm', crmRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API listening on port ${PORT}`));
