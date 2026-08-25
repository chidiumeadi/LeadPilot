import axios from 'axios'

import { env } from '../config/env'

export const api = axios.create({
  baseURL: env.apiUrl || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})
