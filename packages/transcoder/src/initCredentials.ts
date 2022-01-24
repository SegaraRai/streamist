import { setOSCredentials } from '$shared-server/osOperations';

setOSCredentials({
  WASABI_ACCESS_KEY_ID: process.env.SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID,
  WASABI_SECRET_ACCESS_KEY:
    process.env.SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY,
});
