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

You can use **Railway**, **Supabase**, or **local PostgreSQL**.

#### Option A: Railway (backend + database in one place)

1. Create a project at [railway.app](https://railway.app) and connect your GitHub repo.
2. Add a **PostgreSQL** service (New → Database → PostgreSQL). Railway sets `DATABASE_URL` automatically.
3. Add a **Web Service** for the backend (New → GitHub Repo → this repo). In service **Settings** or **Variables**:
   - **Build Command:** `npm run build:server`
   - **Start Command:** `npm start`
   - Add variable **DATABASE_URL** → “Add from Railway” → select your PostgreSQL service.
   - Add **JWT_SECRET**, **FRONTEND_URL** (your Netlify URL), **NODE_ENV** = `production`.
4. Generate a **public URL** for the backend and set that as **NEXT_PUBLIC_API_URL** in Netlify.

#### Option B: Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database** (or **Connect** in the top bar) and copy the **Connection string** (URI).
3. In your `.env`, set `DATABASE_URL` to that URI (replace `[YOUR-PASSWORD]` with your DB password). SSL is enabled automatically when `DATABASE_URL` is set.

#### Option C: Local PostgreSQL

1. Create a database: `createdb timely_db`
2. In `.env`, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (see `.env.example`).

### 3. Environment Variables

```bash
cp .env.example .env
# Edit .env with your database and secrets
```

Create a `.env` file in the root directory. For **Railway** or **Supabase**, set `DATABASE_URL`. For **local** Postgres, use `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. Example:

```env
PORT=5001
NODE_ENV=development

# Railway or Supabase (connection string)
# DATABASE_URL=postgresql://...

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

From the repo root, `npm run build` builds only the **server** (used by Railway and other backends). To build both server and client (e.g. for local testing), use `npm run build:all`.

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

