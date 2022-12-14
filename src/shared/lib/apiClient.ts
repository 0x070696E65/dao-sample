import axios from 'axios';

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const apiClient = axios.create({
  baseURL:
    nodeEnv === 'production'
      ? 'https://cd2b-93-109-62-144.eu.ngrok.io'
      : 'http://localhost:3000/',
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
  },
});
