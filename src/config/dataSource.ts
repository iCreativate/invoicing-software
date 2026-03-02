import { DataSource } from 'typeorm';
import dbConfig from './database';

export const AppDataSource = new DataSource(dbConfig);

