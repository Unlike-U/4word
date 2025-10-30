const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

export const BACKEND_CONFIG = {
    baseURL: isDevelopment ? 'http://localhost:3001' : 'https://your-production-domain.com',
    timeout: 30000,
    withCredentials: false
};

export const BACKEND_ENDPOINTS = {
    health: '/api/health',        // lowercase
    messages: '/api/messages',    // lowercase
    chat: '/api/messages',        // lowercase
    leaderboard: '/api/leaderboard',
    submitScore: '/api/submit-score',
    puzzle: '/api/puzzle',
    verify: '/api/verify'
};
