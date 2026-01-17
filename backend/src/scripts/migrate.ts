#!/usr/bin/env tsx

import { pool, testConnection, closeConnection } from '../database/connection';
import { DatabaseMigrator } from '../database/migrator';

async function runMigrations() {
  try {
    console.log('🚀 UniBoard Database Migration Tool');
    console.log('=====================================');
    
    // Test database connection
    await testConnection();
    
    // Create migrator instance
    const migrator = new DatabaseMigrator(pool);
    
    // Check migration status
    const status = await migrator.getStatus();
    
    console.log('\n📊 Migration Status:');
    console.log(`   Executed: ${status.executed.length} migrations`);
    console.log(`   Pending:  ${status.pending.length} migrations`);
    
    if (status.executed.length > 0) {
      console.log('\n✅ Executed migrations:');
      status.executed.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }
    
    if (status.pending.length > 0) {
      console.log('\n⏳ Pending migrations:');
      status.pending.forEach(migration => {
        console.log(`   - ${migration}`);
      });
      
      console.log('\n🔄 Running migrations...');
      await migrator.migrate();
    } else {
      console.log('\n✅ Database is up to date');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'status':
    // Show migration status only
    (async () => {
      try {
        await testConnection();
        const migrator = new DatabaseMigrator(pool);
        const status = await migrator.getStatus();
        
        console.log('Migration Status:');
        console.log(`Executed: ${status.executed.length}`);
        console.log(`Pending: ${status.pending.length}`);
        
        if (status.pending.length > 0) {
          process.exit(1); // Exit with error if migrations are pending
        }
      } catch (error) {
        console.error('Status check failed:', error);
        process.exit(1);
      } finally {
        await closeConnection();
      }
    })();
    break;
    
  default:
    // Run migrations
    runMigrations();
    break;
}