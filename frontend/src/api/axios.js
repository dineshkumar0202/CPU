import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://cpu-monitor-server.onrender.com/api'
});

export default api;
