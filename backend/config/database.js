const mysql = require('mysql2');

// Create connection pool with improved configuration for stability
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'new_blog_biic',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Connection management settings
  acquireTimeout: 60000,          // 60 seconds to get connection
  timeout: 60000,                 // 60 seconds for queries
  reconnect: true,                // Auto-reconnect
  idleTimeout: 300000,            // 5 minutes idle timeout
  maxIdle: 10,                    // Maximum idle connections
  idleTimeoutMillis: 300000,      // Idle timeout in milliseconds
  // Keep alive settings
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
});

// Get promise-based connection
const promisePool = pool.promise();

// Enhanced connection testing with retry logic
const testConnection = async (retries = 3) => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error(`❌ Database connection failed (${4 - retries} retries left):`, error.message);
    if (retries > 1) {
      console.log('🔄 Retrying database connection in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return testConnection(retries - 1);
    } else {
      console.error('💀 All database connection attempts failed. Exiting...');
      process.exit(1);
    }
  }
};

// Handle connection errors and reconnections
pool.on('connection', (connection) => {
  console.log('🔗 New database connection established as id ' + connection.threadId);
});

pool.on('error', (err) => {
  console.error('💥 Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Database connection was closed. Attempting to reconnect...');
    testConnection();
  } else {
    throw err;
  }
});

// Initialize database connection
testConnection();

// Health check function for periodic testing
const healthCheck = async () => {
  try {
    const [rows] = await promisePool.execute('SELECT 1 as health');
    return rows[0].health === 1;
  } catch (error) {
    console.error('🏥 Database health check failed:', error.message);
    return false;
  }
};

// Perform health check every 5 minutes
setInterval(async () => {
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.log('⚠️ Database health check failed, attempting reconnection...');
    testConnection();
  } else {
    console.log('💚 Database health check passed');
  }
}, 5 * 60 * 1000); // 5 minutes

module.exports = promisePool;