export const MULTIPART_UPLOAD_THRESHOLD = -1; // all

// this must be larger than 5MiB
// c.f. https://wasabi-support.zendesk.com/hc/en-us/articles/360033859411-How-do-I-clean-up-my-failed-multipart-uploads-
export const MULTIPART_UPLOAD_MIN_CHUNK_SIZE = 8 * 1024 * 1024; // 8MiB
