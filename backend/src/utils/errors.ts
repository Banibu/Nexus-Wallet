export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (code: string, msg: string, details?: unknown) =>
  new AppError(400, code, msg, details);
export const Unauthorized = (msg = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', msg);
export const Forbidden = (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg);
export const NotFound = (msg = 'Not Found') => new AppError(404, 'NOT_FOUND', msg);
export const Conflict = (code: string, msg: string) => new AppError(409, code, msg);
export const Unprocessable = (code: string, msg: string, details?: unknown) =>
  new AppError(422, code, msg, details);
