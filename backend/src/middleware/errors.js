class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: { code: 'not_found', message: 'Resource not found' } });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
  }

  switch (error.code) {
    case '23505':
      return res.status(409).json({ error: { code: 'conflict', message: 'Resource already exists' } });
    case '23503':
      return res
        .status(422)
        .json({ error: { code: 'invalid_reference', message: 'Referenced resource does not exist' } });
    case '23514':
      return res
        .status(422)
        .json({ error: { code: 'constraint_violation', message: 'Request violates a data constraint' } });
    case '40001':
      return res
        .status(503)
        .json({ error: { code: 'serialization_failure', message: 'Concurrent update detected, please retry' } });
    default:
      console.error(error);
      return res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
  }
}

module.exports = { ApiError, notFound, errorHandler };
