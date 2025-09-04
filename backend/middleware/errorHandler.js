/**
 * Global error handling middleware
 */

// Error logging utility
const logError = (error, req) => {
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, {
    message: error.message,
    stack: error.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id
  });
};

// MongoDB/Mongoose error handler
const handleMongoError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return {
      statusCode: 400,
      message: 'Validation Error',
      errors
    };
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return {
      statusCode: 400,
      message: `Duplicate field value: ${field}`,
      field
    };
  }

  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid ID format',
      field: error.path
    };
  }

  return null;
};

// JWT error handler
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Invalid token'
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Token expired'
    };
  }

  return null;
};

// Main error handler middleware
const errorHandler = (error, req, res, next) => {
  logError(error, req);

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let details = null;

  // Handle specific error types
  const mongoError = handleMongoError(error);
  if (mongoError) {
    statusCode = mongoError.statusCode;
    message = mongoError.message;
    details = mongoError.errors || mongoError.field;
  }

  const jwtError = handleJWTError(error);
  if (jwtError) {
    statusCode = jwtError.statusCode;
    message = jwtError.message;
  }

  // Handle Multer errors (file upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
    details = 'Maximum file size is 10MB';
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected field';
    details = 'Invalid file field name';
  }

  // Rate limiting errors
  if (error.statusCode === 429) {
    statusCode = 429;
    message = 'Too Many Requests';
    details = 'Please try again later';
  }

  // Database connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
    statusCode = 503;
    message = 'Database unavailable';
    details = 'Please try again later';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    details = null;
  }

  const errorResponse = {
    success: false,
    error: message,
    statusCode
  };

  if (details) {
    errorResponse.details = details;
  }

  // Include request ID for tracking (if available)
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler middleware
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404,
    path: req.originalUrl,
    method: req.method
  });
};

// Async error wrapper utility
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};