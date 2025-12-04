import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('=== Checking User and Workspace Data ===\n');

  // Get all users
  const users = await dataSource.query(`
    SELECT 
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      wm.workspace_id,
      w.name as workspace_name
    FROM "user" u
    LEFT JOIN workspace_member wm ON wm.user_id = u.id
    LEFT JOIN workspace w ON w.id = wm.workspace_id
    ORDER BY u.created_at DESC
    LIMIT 5
  `);

  console.log('Recent Users:');
  console.table(users);

  // Get all bots with workspace
  const bots = await dataSource.query(`
    SELECT 
      b.id,
      b.name,
      b.workspace_id,
      w.name as workspace_name
    FROM bot b
    LEFT JOIN workspace w ON w.id = b.workspace_id
    ORDER BY b.created_at DESC
    LIMIT 10
  `);

  console.log('\nRecent Bots:');
  console.table(bots);

  // Get conversations with bot workspace
  const conversations = await dataSource.query(`
    SELECT 
      c.id,
      c.contact_name,
      c.bot_id,
      b.name as bot_name,
      b.workspace_id,
      w.name as workspace_name,
      c.channel_id
    FROM conversation c
    LEFT JOIN bot b ON b.id = c.bot_id
    LEFT JOIN workspace w ON w.id = b.workspace_id
    WHERE c.deleted_at IS NULL
    ORDER BY c.created_at DESC
    LIMIT 10
  `);

  console.log('\nRecent Conversations:');
  console.table(conversations);

  await app.close();
}

bootstrap();
