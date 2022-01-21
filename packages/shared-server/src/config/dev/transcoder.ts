// staging, production で露出しても問題はない
export const DEV_TRANSCODER_PORT = 8946;
export const DEV_TRANSCODER_API_PATH = '/api/dev/transcode';
export const DEV_TRANSCODER_API_ENDPOINT = `http://localhost:${DEV_TRANSCODER_PORT}${DEV_TRANSCODER_API_PATH}`;
