/**
 * Error Handling Middleware
 * Purpose: Centralized error handling for the application
 */

/**
 * Not Found (404) Handler
 * Use this at the end of all routes to catch any undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * General Error Handler
 * This catches all errors thrown in the application
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log error details (for debugging)
  console.error('\n❌ ========================================');
  console.error('❌ ERROR OCCURRED');
  console.error('❌ ========================================');
  console.error('Time:', new Date().toISOString());
  console.error('URL:', req.method, req.originalUrl);
  console.error('User:', req.user ? `${req.user.email} (${req.user.role})` : 'Not authenticated');
  console.error('Status:', statusCode);
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);

  if (err.stack) {
    console.error('Stack Trace:', err.stack);
  }

  console.error('========================================\n');

  // Prepare error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    statusCode: statusCode
  };

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || null;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 *
 * Usage:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersFromDB();
 *   res.json(users);
 * }));
 *
 * Without this, you'd need try-catch in every async route
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation Error Handler
 * Use this for handling validation errors (e.g., from express-validator)
 */
const validationErrorHandler = (errors) => {
  const error = new Error('Validation failed');
  error.code = 'VALIDATION_ERROR';
  error.statusCode = 400;
  error.details = errors.array();
  return error;
};

/**
 * Database Error Handler
 * Translates common PostgreSQL errors into user-friendly messages
 */
const handleDatabaseError = (error) => {
  console.error('Database error:', error);

  // Unique constraint violation
  if (error.code === '23505') {
    const match = error.detail?.match(/Key \((.*?)\)=/);
    const field = match ? match[1] : 'field';

    return {
      status: 409,
      error: `A record with this ${field} already exists`,
      code: 'DUPLICATE_ENTRY',
      field: field
    };
  }

  // Foreign key violation
  if (error.code === '23503') {
    return {
      status: 400,
      error: 'Referenced record does not exist',
      code: 'FOREIGN_KEY_VIOLATION'
    };
  }

  // Check constraint violation
  if (error.code === '23514') {
    return {
      status: 400,
      error: 'Invalid data provided',
      code: 'CHECK_VIOLATION',
      detail: error.detail
    };
  }

  // Not null violation
  if (error.code === '23502') {
    const column = error.column || 'field';
    return {
      status: 400,
      error: `${column} is required`,
      code: 'REQUIRED_FIELD',
      field: column
    };
  }

  // Generic database error
  return {
    status: 500,
    error: 'Database operation failed',
    code: 'DATABASE_ERROR'
  };
};

/**
 * Create a custom error with specific properties
 *
 * Usage:
 * throw createError(404, 'User not found', 'USER_NOT_FOUND');
 */
const createError = (status, message, code = null) => {
  const error = new Error(message);
  error.statusCode = status;
  error.code = code || `ERROR_${status}`;
  return error;
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  validationErrorHandler,
  handleDatabaseError,
  createError
};
