import { API_ORIGIN, API_USER_ID, API_USER_PASS } from './env';

export const getUserInfo = (_id: string) => {
  return {
    name: 'sample user',
    icon: `${API_ORIGIN}/static/icons/dummy.svg`,
  };
};

export const validateUser = (id: string, pass: string) =>
  id === API_USER_ID && pass === API_USER_PASS;

export const getUserInfoById = (id: string) => ({ id, ...getUserInfo(id) });
