export interface HTTPErrorData {
  readonly message: string;
}

export class HTTPError extends Error {
  readonly status: number;
  readonly data: HTTPErrorData;

  constructor(status: number, message: string) {
    super(`${status} ${message}`);

    this.status = status;
    this.data = {
      message,
    };
  }
}
