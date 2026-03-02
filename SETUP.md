# Timely Platform - Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Database Setup

1. Create a PostgreSQL database:
```bash
createdb timely_db
```

2. Update `.env` file with your database credentials:
```bash
cp .env.example .env
# Edit .env with your database settings
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=timely_db

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

### 4. Run the Application

#### Development Mode (Both Server and Client)

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend application on http://localhost:3000

#### Run Separately

**Backend only:**
```bash
npm run dev:server
```

**Frontend only:**
```bash
npm run dev:client
```

### 5. Build for Production

```bash
npm run build
npm start
```

## Database Schema

The application uses TypeORM with automatic schema synchronization in development mode. The database will be automatically created when you start the server.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/stats` - Get invoice statistics
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/send` - Send invoice to client
- `POST /api/invoices/quote/:quoteId/convert` - Convert quote to invoice

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

## Features Implemented

✅ User Authentication & Authorization
✅ Company Management
✅ Client Management
✅ Invoice Creation & Management
✅ Invoice Statistics
✅ Modern React Frontend
✅ Responsive Dashboard UI

## Features Coming Soon

- Payroll & HR Management
- Employee Management
- Banking Integration
- Accounting Module
- AI Automation
- Payment Gateway Integration
- Mobile App

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:
1. Ensure PostgreSQL is running
2. Verify database credentials in `.env`
3. Check if the database exists: `psql -l | grep timely_db`

### Port Already in Use

If port 5000 or 3000 is already in use:
1. Change `PORT` in `.env` for backend
2. Change port in `client/package.json` scripts for frontend

## Support

For issues or questions, please check the documentation or create an issue in the repository.

