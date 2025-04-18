const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  AUTH: {
    LOGIN: `${import.meta.env.VITE_API_USERS_URL}/login`,
    REGISTER: `${import.meta.env.VITE_API_USERS_URL}/register`,
    PROFILE: `${import.meta.env.VITE_API_USERS_URL}/profile`,
  },
  USERS: {
    BASE: import.meta.env.VITE_API_USERS_URL,
    PROFILE: `${import.meta.env.VITE_API_USERS_URL}/profile`,
  },
  STOCKS: {
    BASE: `${import.meta.env.VITE_API_BASE_URL}/api/stocks`,
    BY_ID: (id) => `${import.meta.env.VITE_API_BASE_URL}/api/stocks/${id}`,
  },
  TRANSACTIONS: {
    BASE: import.meta.env.VITE_API_TRANSACTIONS_URL,
    BY_ID: (id) => `${import.meta.env.VITE_API_TRANSACTIONS_URL}/${id}`,
  },
  DASHBOARD: `${import.meta.env.VITE_API_BASE_URL}/dashboard`,
};

export default API_CONFIG; 