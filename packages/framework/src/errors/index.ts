/**
 * Erros tipados do framework com status HTTP mapeável e representação
 * `problem+json` (RFC 9457).
 */

/** Prefixo do tipo URI dos problemas. */
export const ERROR_TYPE_PREFIX = "https://tideframe.dev/errors/";

/** Issue de validação: campo (`path`), `message`. */
export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

/** Base de todos os erros do framework. */
export class FrameworkError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

/** Erro com status HTTP e tipo URI — todo `HttpError` é mapeável para HTTP. */
export class HttpError extends FrameworkError {
  readonly status: number;

  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.status = status;
  }
}

/** 400 Bad Request. */
export class BadRequestError extends HttpError {
  constructor(message = "Bad Request", options?: ErrorOptions) {
    super(400, message, options);
  }
}

/** 401 Unauthorized. */
export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized", options?: ErrorOptions) {
    super(401, message, options);
  }
}

/** 403 Forbidden. */
export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden", options?: ErrorOptions) {
    super(403, message, options);
  }
}

/** 404 Not Found. */
export class NotFoundError extends HttpError {
  constructor(message = "Not Found", options?: ErrorOptions) {
    super(404, message, options);
  }
}

/** 409 Conflict. */
export class ConflictError extends HttpError {
  constructor(message = "Conflict", options?: ErrorOptions) {
    super(409, message, options);
  }
}

/** 422 Unprocessable Entity. */
export class UnprocessableEntityError extends HttpError {
  constructor(message = "Unprocessable Entity", options?: ErrorOptions) {
    super(422, message, options);
  }
}

/** 422 com `issues` detalhadas — a saída de validação de `safeParse`/`parse`. */
export class ValidationError extends HttpError {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[], message = "Invalid input") {
    super(422, message, {});
    this.issues = issues;
  }
}

/** 429 Too Many Requests. */
export class TooManyRequestsError extends HttpError {
  constructor(message = "Too Many Requests", options?: ErrorOptions) {
    super(429, message, options);
  }
}

/** 408 Request Timeout. */
export class TimeoutError extends HttpError {
  constructor(message = "Request Timeout", options?: ErrorOptions) {
    super(408, message, options);
  }
}

/** 500 Internal Server Error. */
export class InternalServerError extends HttpError {
  constructor(message = "Internal Server Error", options?: ErrorOptions) {
    super(500, message, options);
  }
}

/** 501 Not Implemented. */
export class NotImplementedError extends HttpError {
  constructor(message = "Not Implemented", options?: ErrorOptions) {
    super(501, message, options);
  }
}

/** 503 Service Unavailable. */
export class ServiceUnavailableError extends HttpError {
  constructor(message = "Service Unavailable", options?: ErrorOptions) {
    super(503, message, options);
  }
}

/** 502 Bad Gateway. */
export class BadGatewayError extends HttpError {
  constructor(message = "Bad Gateway", options?: ErrorOptions) {
    super(502, message, options);
  }
}

/** 504 Gateway Timeout. */
export class GatewayTimeoutError extends HttpError {
  constructor(message = "Gateway Timeout", options?: ErrorOptions) {
    super(504, message, options);
  }
}

/** Refinamento de `unknown` para `FrameworkError`. */
export function isFrameworkError(value: unknown): value is FrameworkError {
  return value instanceof FrameworkError;
}

/** Refinamento de `unknown` para `HttpError`. */
export function isHttpError(value: unknown): value is HttpError {
  return value instanceof HttpError;
}

/** Representação `problem+json` (RFC 9457) de um erro framework. */
export interface ProblemJson {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly errors?: readonly ValidationIssue[];
  readonly code?: string;
}

/** Serializa um erro framework para problem+json. */
export function toProblemJson(error: FrameworkError, request?: { readonly url?: string }): ProblemJson {
  const instance = request?.url;
  const errors = error instanceof ValidationError && error.issues.length > 0 ? error.issues : undefined;
  return {
    type: `${ERROR_TYPE_PREFIX}${error.name}`,
    title: error.message,
    status: error instanceof HttpError ? error.status : 500,
    ...(instance !== undefined ? { instance } : {}),
    ...(errors !== undefined ? { errors } : {}),
  };
}
