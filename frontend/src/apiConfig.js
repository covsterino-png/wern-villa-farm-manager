export const PRODUCTION_API = "https://wern-villa-api.onrender.com";

// Local development talks to a local backend (backend/dev database) unless
// VITE_API_URL says otherwise. Production builds default to the live API.
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : PRODUCTION_API);
