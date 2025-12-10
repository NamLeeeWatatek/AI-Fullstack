const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    const sqlFile = path.join(__dirname, 'add-form-schema-columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Running migration...');
    console.log(sql);
    
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify columns
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'flow' 
        AND column_name IN ('formSchema', 'category', 'icon')
      ORDER BY column_name;
    `);
    
    console.log('\nColumns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
