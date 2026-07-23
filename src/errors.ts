export class KambaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KambaError';
  }
}

export class KambaValidationError extends KambaError {
  constructor(message: string) {
    super(message);
    this.name = 'KambaValidationError';
  }
}

export class KambaAPIError extends KambaError {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'KambaAPIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}