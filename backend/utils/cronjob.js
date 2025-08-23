const cron = require('node-cron');
const https = require('https');
const http = require('http');

class ServerKeepAlive {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isRender = process.env.RENDER || false;
    
    // Initialize cron jobs
    this.initCronJobs();
  }

  // Ping the server to keep it warm
  async pingServer() {
    try {
      const url = `${this.baseUrl}/api/demo/ping`;
      const protocol = this.baseUrl.startsWith('https') ? https : http;
      
      return new Promise((resolve, reject) => {
        const req = protocol.get(url, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            const responseTime = Date.now() - req.startTime;
            console.log(`✅ Server ping successful - Response time: ${responseTime}ms`);
            resolve({ success: true, responseTime, statusCode: res.statusCode });
          });
        });
        
        req.on('error', (error) => {
          console.error(`❌ Server ping failed: ${error.message}`);
          reject(error);
        });
        
        req.on('timeout', () => {
          console.error('❌ Server ping timeout');
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.setTimeout(10000); // 10 second timeout
        req.startTime = Date.now();
      });
    } catch (error) {
      console.error('❌ Error pinging server:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Health check function
  async healthCheck() {
    try {
      const url = `${this.baseUrl}/api/demo/health`;
      const protocol = this.baseUrl.startsWith('https') ? https : http;
      
      return new Promise((resolve, reject) => {
        const req = protocol.get(url, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const healthData = JSON.parse(data);
              console.log(`🏥 Health check: ${healthData.status} - Uptime: ${Math.round(healthData.uptime)}s`);
              resolve({ success: true, data: healthData });
            } catch (parseError) {
              console.error('❌ Error parsing health check response:', parseError.message);
              reject(parseError);
            }
          });
        });
        
        req.on('error', (error) => {
          console.error(`❌ Health check failed: ${error.message}`);
          reject(error);
        });
        
        req.setTimeout(15000); // 15 second timeout
      });
    } catch (error) {
      console.error('❌ Error during health check:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Initialize cron jobs
  initCronJobs() {
    if (!this.isProduction && !this.isRender) {
      console.log('🔄 Cron jobs disabled in development mode');
      return;
    }

    console.log('🚀 Initializing server keep-alive cron jobs...');

    // Ping server every 5 minutes to keep it warm
    cron.schedule('*/5 * * * *', async () => {
      console.log('⏰ Executing scheduled server ping...');
      await this.pingServer();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Health check every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      console.log('⏰ Executing scheduled health check...');
      await this.healthCheck();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Additional ping every 15 minutes for extra reliability
    cron.schedule('*/15 * * * *', async () => {
      console.log('⏰ Executing additional server ping...');
      await this.pingServer();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Log cron job status
    console.log('✅ Cron jobs initialized successfully');
    console.log('📅 Ping server: Every 5 minutes');
    console.log('📅 Health check: Every 10 minutes');
    console.log('📅 Additional ping: Every 15 minutes');
  }

  // Manual ping function (can be called from other parts of the app)
  async manualPing() {
    console.log('🔄 Manual server ping initiated...');
    return await this.pingServer();
  }

  // Manual health check function
  async manualHealthCheck() {
    console.log('🏥 Manual health check initiated...');
    return await this.healthCheck();
  }

  // Get cron job status
  getStatus() {
    return {
      isProduction: this.isProduction,
      isRender: this.isRender,
      baseUrl: this.baseUrl,
      cronJobsActive: this.isProduction || this.isRender,
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export instance
const serverKeepAlive = new ServerKeepAlive();

module.exports = serverKeepAlive;
