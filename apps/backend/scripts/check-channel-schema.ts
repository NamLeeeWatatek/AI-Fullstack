import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('=== Channel Connection Schema ===\n');

  const columns = await dataSource.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'channel_connection'
    ORDER BY ordinal_position
  `);

  console.table(columns);

  await app.close();
}

bootstrap();
