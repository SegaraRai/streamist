import aspida from '@aspida/axios';
import axios from 'axios';
import createAPI from '$/api/$api';

const axiosInstance = axios.create();

export const unAuthAPI = createAPI(aspida(axiosInstance));
