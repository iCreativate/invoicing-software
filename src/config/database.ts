import { DataSourceOptions } from 'typeorm';
import { User } from '../entities/User';
import { Company } from '../entities/Company';
import { Client } from '../entities/Client';
import { Vendor } from '../entities/Vendor';
import { Invoice } from '../entities/Invoice';
import { InvoiceItem } from '../entities/InvoiceItem';
import { Quote } from '../entities/Quote';
import { Payment } from '../entities/Payment';
import { Employee } from '../entities/Employee';
import { Payroll } from '../entities/Payroll';
import { Payslip } from '../entities/Payslip';
import { LeaveRequest } from '../entities/LeaveRequest';
import { Timesheet } from '../entities/Timesheet';
import { BankAccount } from '../entities/BankAccount';
import { Transaction } from '../entities/Transaction';
import { Expense } from '../entities/Expense';
import { JournalEntry } from '../entities/JournalEntry';

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'timely_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  // Connection pooling for better performance
  extra: {
    max: 20, // Maximum number of connections in the pool
    min: 5, // Minimum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  },
  entities: [
    User,
    Company,
    Client,
    Vendor,
    Invoice,
    InvoiceItem,
    Quote,
    Payment,
    Employee,
    Payroll,
    Payslip,
    LeaveRequest,
    Timesheet,
    BankAccount,
    Transaction,
    Expense,
    JournalEntry,
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
};

export default config;

