const express = require('express');
const router = express.Router();

// Demo public route - no authentication required
router.get('/demo', (req, res) => {
  res.json({
    message: '🚗 Vehicle Management System Demo',
    status: 'Server is running and warm!',
    timestamp: new Date().toISOString(),
    features: [
      'Vehicle Management',
      'User Authentication',
      'Admin Panel',
      'File Uploads',
      'Real-time Updates'
    ],
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Public health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Vehicle Management API is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version
  });
});

// Public server info route
router.get('/info', (req, res) => {
  res.json({
    name: 'Vehicle Management System',
    description: 'A comprehensive vehicle management and admin panel system',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vehicles: '/api/vehicles',
      app: '/api/app',
      demo: '/api/demo',
      health: '/api/health'
    },
    documentation: 'API documentation available at /api/docs',
    support: 'For support, contact the development team'
  });
});

// Public ping route for cronjob
router.get('/ping', (req, res) => {
  res.json({
    pong: true,
    timestamp: new Date().toISOString(),
    message: 'Server is alive and responding quickly!'
  });
});

// Public status route with detailed information
router.get('/status', (req, res) => {
  const status = {
    server: 'running',
    database: 'connected',
    timestamp: new Date().toISOString(),
    performance: {
      responseTime: 'fast',
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  res.json(status);
});

module.exports = router;
