export type ErrorPayload = {
  code: string;
  message: string;
};

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }

  toPayload(): ErrorPayload {
    return { code: this.code, message: this.message };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(400, code, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Нэвтрэх шаардлагатай', code = 'UNAUTHORIZED') {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Эрх хүрэхгүй байна', code = 'FORBIDDEN') {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Олдсонгүй', code = 'NOT_FOUND') {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Зөрчилтэй хүсэлт', code = 'CONFLICT') {
    super(409, code, message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'Гадаад үйлчилгээний алдаа', code = 'EXTERNAL_SERVICE_ERROR') {
    super(502, code, message);
  }
}

