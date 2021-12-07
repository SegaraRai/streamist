import aspida from '@aspida/axios';
import axios from 'axios';
import api from '$/api/$api';

const axiosInstance = axios.create();

const apiInstance = api(aspida(axiosInstance));

export default apiInstance;
