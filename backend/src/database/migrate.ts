import fs from 'fs';
import path from 'path';
import pool from './connection';

interface Migration {
  id: number;
  name: string;
  filename: string;
  sql: string;
}

class MigrationRunner {
  private migrationsDir: string;

  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  // Ensure migrations table exists
  private async ensureMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableSQL);
  }

  // Get executed migrations from database
  private async getExecutedMigrations(): Promise<string[]> {
    const result = await pool.query('SELECT name FROM migrations ORDER BY id');
    return result.rows.map((row: any) => row.name);
  }

  // Get migration files from filesystem
  private getMigrationFiles(): Migration[] {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(filename => {
      const match = filename.match(/^(\d+)_(.+)\.sql$/);
      if (!match) {
        throw new Error(`Invalid migration filename: ${filename}`);
      }

      const [, idStr, name] = match;
      if (!idStr || !name) {
        throw new Error(`Invalid migration filename format: ${filename}`);
      }
      
      const id = parseInt(idStr, 10);
      const sql = fs.readFileSync(path.join(this.migrationsDir, filename), 'utf8');

      return { id, name, filename, sql };
    });
  }

  // Run pending migrations
  public async runMigrations(): Promise<void> {
    console.log('🔄 Running database migrations...');

    await this.ensureMigrationsTable();

    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = this.getMigrationFiles();

    const pendingMigrations = migrationFiles.filter(
      migration => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    for (const migration of pendingMigrations) {
      console.log(`🔄 Running migration: ${migration.filename}`);
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Execute migration SQL
        await client.query(migration.sql);
        
        // Record migration as executed
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Migration completed: ${migration.filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration failed: ${migration.filename}`, error);
        throw error;
      } finally {
        client.release();
      }
    }

    console.log(`✅ All migrations completed (${pendingMigrations.length} executed)`);
  }

  // Create new migration file
  public createMigration(name: string): string {
    const timestamp = Date.now();
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filepath = path.join(this.migrationsDir, filename);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL here
-- Example:
-- CREATE TABLE example (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
`;

    fs.writeFileSync(filepath, template);
    console.log(`📝 Created migration: ${filename}`);
    
    return filepath;
  }

  // Rollback last migration (for development only)
  public async rollbackLastMigration(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Rollback not allowed in production');
    }

    const result = await pool.query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = result.rows[0].name;
    
    await pool.query('DELETE FROM migrations WHERE name = $1', [lastMigration]);
    
    console.log(`🔄 Rolled back migration: ${lastMigration}`);
    console.log('⚠️  Note: You must manually revert the database changes');
  }
}

export const migrationRunner = new MigrationRunner();

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];

  (async () => {
    try {
      switch (command) {
        case 'run':
          await migrationRunner.runMigrations();
          break;
        case 'create':
          if (!arg) {
            console.error('Usage: npm run migrate create <migration_name>');
            process.exit(1);
          }
          migrationRunner.createMigration(arg);
          break;
        case 'rollback':
          await migrationRunner.rollbackLastMigration();
          break;
        default:
          console.log('Usage:');
          console.log('  npm run migrate run     - Run pending migrations');
          console.log('  npm run migrate create <name> - Create new migration');
          console.log('  npm run migrate rollback - Rollback last migration (dev only)');
      }
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
}
