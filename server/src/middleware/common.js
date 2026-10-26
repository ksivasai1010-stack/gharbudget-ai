import mongoSanitize from 'mongo-sanitize';

export function sanitize(req, res, next) {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
}

export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);

  if (err.name === 'ValidationError') {
    const fields = Object.entries(err.errors).map(([field, e]) => ({ field, message: e.message }));
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields } });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID format' } });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'A record with that value already exists' } });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
}
