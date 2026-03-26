require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const tabRoutes = require('./routes/tabRoutes');
const rowRoutes = require('./routes/rowRoutes');
const bomRoutes = require('./routes/bomRoutes');
const bomShareRoutes = require('./routes/bomShareRoutes');
const savedBomRoutes = require('./routes/savedBomRoutes');
const defaultNotesRoutes = require('./routes/defaultNotesRoutes');
const templateRoutes = require('./routes/templateRoutes');
const walkwayRoutes = require('./routes/walkwayRoutes');
const configRoutes = require('./routes/configRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
].map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use(morgan('dev'));

// Serve static files (uploaded images and master assets)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/static', express.static(path.join(__dirname, '../static')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tabs', tabRoutes);
app.use('/api/rows', rowRoutes);
// IMPORTANT: Share routes must come BEFORE general BOM routes to avoid conflicts
app.use('/api/bom', bomShareRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/saved-boms', savedBomRoutes);
app.use('/api/default-notes', defaultNotesRoutes);
app.use('/api/bom-templates', templateRoutes);
app.use('/api/projects/:projectId/walkway-rows', walkwayRoutes);
app.use('/api/config', configRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
