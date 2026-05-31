export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message, details = null) {
  return new HttpError(400, message, details);
}

export function unauthorized(message) {
  return new HttpError(401, message);
}

export function forbidden(message) {
  return new HttpError(403, message);
}

export function notFound(message) {
  return new HttpError(404, message);
}
