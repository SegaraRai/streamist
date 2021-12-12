import aspida from '@aspida/axios';
import axios from 'axios';
import { useTokenStore } from '~/stores/token';
import api from '$/api/$api';

const axiosInstance = axios.create();

const apiInstance = api(aspida(axiosInstance));

export default apiInstance;

export function activateTokenInterceptor() {
  const tokenStore = useTokenStore();

  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = await tokenStore.tokenPromise;
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
}
