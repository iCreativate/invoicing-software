/**
 * Backend API base URL.
 * Set NEXT_PUBLIC_API_URL in Netlify (and .env.local) to your deployed backend URL.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
