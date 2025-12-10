// Clear and reseed flows with proper formSchema
const { Client } = require('pg');
require('dotenv').config();

async function reseedFlows() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'ai_hub_db',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Clear existing flows
    await client.query('DELETE FROM flow');
    console.log('🗑️  Cleared existing flows\n');

    // Run seed
    console.log('🌱 Running seed...\n');
    const { execSync } = require('child_process');
    execSync('npm run seed:run:relational', { stdio: 'inherit' });

    // Verify
    const flows = await client.query(`
      SELECT 
        id, 
        name, 
        published, 
        status,
        "formSchema" IS NOT NULL as has_form_schema,
        "isPremium"
      FROM flow 
      ORDER BY "createdAt" DESC
    `);

    console.log('\n✅ Seeded Flows:');
    console.table(flows.rows);

    console.log(`\n✅ Total: ${flows.rows.length} flows`);
    console.log(`✅ Published: ${flows.rows.filter(f => f.published).length}`);
    console.log(`✅ With formSchema: ${flows.rows.filter(f => f.has_form_schema).length}`);
    console.log(`✅ Premium: ${flows.rows.filter(f => f.isPremium).length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

reseedFlows();
