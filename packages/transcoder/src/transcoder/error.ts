export class TranscodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscodeError';
  }
}
