import 'dotenv/config';
import { DataSource } from 'typeorm';
import { entities } from './entities/index.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'monitoring_service',
  synchronize: false, // We don't want to modify the schema in the engine
  logging: true,
  entities,
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
} 