import { config } from 'dotenv';

if (process.env.NODE_ENV === 'development') {
  config({
    path: '../shared-server/env/development.env',
  });
}

const {
  API_ORIGIN_FOR_TRANSCODER,
  SECRET_TRANSCODER_CALLBACK_SECRET,
  SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID,
  SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY,
} = process.env;

if (!API_ORIGIN_FOR_TRANSCODER) {
  throw new Error('API_ORIGIN_FOR_TRANSCODER is not defined');
}

if (!SECRET_TRANSCODER_CALLBACK_SECRET) {
  throw new Error('SECRET_TRANSCODER_CALLBACK_SECRET is not defined');
}

if (!SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID) {
  throw new Error('SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID is not defined');
}

if (!SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY) {
  throw new Error('SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY is not defined');
}

// sanity check
if (!API_ORIGIN_FOR_TRANSCODER.startsWith('http')) {
  throw new Error('API_ORIGIN_FOR_TRANSCODER must start with http');
}

export {
  API_ORIGIN_FOR_TRANSCODER,
  SECRET_TRANSCODER_CALLBACK_SECRET,
  SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID,
  SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY,
};