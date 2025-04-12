// src/config.ts
// src/config.ts
const API_BASE_URL = process.env.VITE_API_URL || 
  (import.meta.env.MODE === 'development'
    ? 'http://localhost:8000'
    : 'https://estetica-backend-production.up.railway.app');

export const API_AUTH_URL = `${API_BASE_URL}/api/auth/`;
export const API_USERS_URL = `${API_BASE_URL}/api/users/`;
// ... otras URLs que necesites