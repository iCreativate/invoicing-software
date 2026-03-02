import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { AppDataSource } from './config/dataSource';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import invoiceRoutes from './routes/invoice.routes';
import quoteRoutes from './routes/quote.routes';
import payrollRoutes from './routes/payroll.routes';
import employeeRoutes from './routes/employee.routes';
import clientRoutes from './routes/client.routes';
import vendorRoutes from './routes/vendor.routes';
import accountingRoutes from './routes/accounting.routes';
import bankingRoutes from './routes/banking.routes';
import aiRoutes from './routes/ai.routes';
import companyRoutes from './routes/company.routes';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
// Compression should be first to compress all responses
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3003',
  credentials: true
}));
// Optimize JSON parsing - limit payload size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check (always responds; indicates DB status)
app.get('/health', (req, res) => {
  const dbOk = AppDataSource.isInitialized;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Require DB for all /api/* routes
app.use('/api', (req, res, next) => {
  if (!AppDataSource.isInitialized) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'Database is not available. Start PostgreSQL (e.g. default: localhost:5432, db: timely_db) and restart the server.',
      },
    });
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/companies', companyRoutes);

// Error handling
app.use(errorHandler);

// Start HTTP server immediately so the app is reachable even when DB is down
app.listen(PORT, () => {
  logger.info(`🚀 Timely Platform server running on port ${PORT}`);
});

// Connect to database in the background
AppDataSource.initialize()
  .then(() => logger.info('Database connected successfully'))
  .catch((error) => {
    logger.error('Database connection failed:', error);
    logger.info('Server is running but API requests will return 503 until PostgreSQL is available (see SETUP.md).');
  });

export default app;

