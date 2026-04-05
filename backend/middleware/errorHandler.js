const logger = require('../utils/logger');
const config = require('../config');

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.env === 'development') {
    logger.error(err.message, {
      statusCode: err.statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code,
      stack: err.stack,
      path: req.path
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        code: err.code
      });
    } else {
      logger.error(err.message, {
        statusCode: err.statusCode,
        stack: err.stack,
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};

const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(err);
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};