// Centralized API configuration for the frontend
// By default, uses relative paths which work through the Vite proxy in development
// and assume the backend is hosted on the same origin in production.
// Can be overridden by setting VITE_API_BASE_URL in the .env file.

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
