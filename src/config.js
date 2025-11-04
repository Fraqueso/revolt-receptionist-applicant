// API Configuration
// For development with local backend: http://localhost:3001
// For development with Vercel backend: https://your-app.vercel.app (set REACT_APP_API_URL)
// For production (Vercel): Uses same domain (relative path)
const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REACT_APP_ENV === 'production';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (isProduction ? '' : 'http://localhost:3001');

