import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'uniboard',
  user: process.env.DATABASE_USER || 'te',
  password: process.env.DATABASE_PASSWORD || 'Qwe@123rty',
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
};

// Create connection pool
export const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Close all connections
export const closeConnection = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
    throw error;
  }
};

// Export pool as default
export default pool;