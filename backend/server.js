const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const appAuthRoutes = require('./routes/appAuth');
const demoRoutes = require('./routes/demo');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import database seeder
const { seedSuperAdmin } = require('./utils/seeder');

// Import cronjob utility for server keep-alive
const serverKeepAlive = require('./utils/cronjob');

const app = express();

// Memory optimization settings
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Reduced from 50mb

// Add request size logging middleware
app.use((req, res, next) => {
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/app', appAuthRoutes);
app.use('/api/demo', demoRoutes);

// Legacy health check route (kept for backward compatibility)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Admin Panel API is running' });
});

// Root route for quick access
app.get('/', (req, res) => {
  res.json({
    message: '🚗 Vehicle Management System API',
    status: 'Server is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      demo: '/api/demo/demo',
      health: '/api/demo/health',
      ping: '/api/demo/ping',
      status: '/api/demo/status',
      info: '/api/demo/info'
    },
    cronjob: serverKeepAlive.getStatus()
  });
});

// Error handling middleware
app.use(errorHandler);

// Global error logging for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// MongoDB connection function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed super admin on first run
    await seedSuperAdmin();
    
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Please check:');
    console.error('1. Your internet connection');
    console.error('2. MongoDB Atlas cluster status');
    console.error('3. Your MONGODB_URI environment variable');
    console.error('4. Network firewall settings');
    
    // Retry connection after 5 seconds
    console.log('Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🌐 Server URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  console.log(`📊 Cronjob Status: ${serverKeepAlive.getStatus().cronJobsActive ? 'Active' : 'Inactive'}`);
  
  // Log available endpoints
  console.log('\n📋 Available API Endpoints:');
  console.log('   GET  /                    - Server info and endpoints');
  console.log('   GET  /api/demo/demo       - Demo route');
  console.log('   GET  /api/demo/health     - Health check');
  console.log('   GET  /api/demo/ping       - Ping for cronjob');
  console.log('   GET  /api/demo/status     - Detailed status');
  console.log('   GET  /api/demo/info       - API information');
  console.log('   GET  /api/health          - Legacy health check');
  
  if (process.env.RENDER) {
    console.log('\n🎯 Render Deployment Detected!');
    console.log('   ✅ Cronjobs will keep server warm');
    console.log('   ✅ Cold start prevention enabled');
    console.log('   ✅ Auto-ping every 5 minutes');
  }
}); 