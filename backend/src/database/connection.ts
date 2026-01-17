import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig extends PoolConfig {
  connectionString?: string;
}

class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    const config: DatabaseConfig = {
      connectionString: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'uniboard',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Log successful connection
    this.pool.on('connect', () => {
      console.log('📊 Connected to PostgreSQL database');
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  public async getClient() {
    return this.pool.connect();
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('📊 Database connection closed');
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Transaction helper
  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const database = Database.getInstance();