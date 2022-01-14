export const JWT_ALGORITHM = 'HS256';

export const JWT_REFRESH_TOKEN_EXPIRES_IN = 1 * 24 * 60 * 60 * 1000;
export const JWT_API_TOKEN_EXPIRES_IN = 60 * 1000;
export const JWT_CDN_TOKEN_EXPIRES_IN = JWT_API_TOKEN_EXPIRES_IN;

const JWT_COMMON_ISS = 'https://streamist.app';

export const JWT_REFRESH_TOKEN_AUD = 'refresh';
export const JWT_REFRESH_TOKEN_ISS = JWT_COMMON_ISS;
export const JWT_API_TOKEN_AUD = 'api';
export const JWT_API_TOKEN_ISS = JWT_COMMON_ISS;
export const JWT_CDN_TOKEN_AUD = 'cdn';
export const JWT_CDN_TOKEN_ISS = JWT_COMMON_ISS;
