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

You can use **Supabase** (recommended for production) or **local PostgreSQL**.

#### Option A: Supabase (recommended)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database** and copy the **Connection string** (URI). Use the **Session mode** or **Transaction** pooler string (e.g. port `6543` with `?pgbouncer=true`, or port `5432` for direct).
3. In your `.env`, set:
   ```env
   DATABASE_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   Replace `[YOUR-PASSWORD]` with your database password. SSL is enabled automatically when `DATABASE_URL` is set.

#### Option B: Local PostgreSQL

1. Create a database: `createdb timely_db`
2. In `.env`, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (see `.env.example`).

### 3. Environment Variables

```bash
cp .env.example .env
# Edit .env with your database and secrets
```

Create a `.env` file in the root directory. For **Supabase**, you only need `DATABASE_URL`. For **local** Postgres, use `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. Example:

```env
PORT=5001
NODE_ENV=development

# Supabase (paste your connection string from Supabase Dashboard → Settings → Database)
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3003
```

### 4. Run the Application

#### Development Mode (Both Server and Client)

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5001
- Frontend application on http://localhost:3003

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

- **Supabase:** Ensure `DATABASE_URL` in `.env` is the full connection string from Supabase (Settings → Database). Use the password you set for the `postgres` user.
- **Local:** Ensure PostgreSQL is running and credentials in `.env` are correct. Check the database exists: `psql -l | grep timely_db`.

### Port Already in Use

If port 5001 or 3003 is already in use, change `PORT` in `.env` for the backend, or the port in `client/package.json` for the frontend.

## Support

For issues or questions, please check the documentation or create an issue in the repository.

