import aspida from '@aspida/axios';
import axios from 'axios';
import createAPI from '$/api/$api';
import { tokens } from './tokens';

const axiosInstance = axios.create();

export const api = createAPI(aspida(axiosInstance));

export function activateTokenInterceptor() {
  axiosInstance.interceptors.request.use(
    async (config) => {
      const { apiToken } = await tokens.valueAsync;
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${apiToken}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
}
