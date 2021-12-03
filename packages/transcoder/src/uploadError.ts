export interface UploadErrorOptions {
  filepath: string;
  url: string;
  sourceFileId: string;
}

export class UploadError extends Error {
  options: UploadErrorOptions;

  constructor(message: string, options: UploadErrorOptions, cause?: Error) {
    super(message, { cause });

    this.name = 'UploadError';
    this.message = message;
    this.options = options;
  }
}
