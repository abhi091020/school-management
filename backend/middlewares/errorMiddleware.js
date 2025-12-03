// backend/middlewares/errorMiddleware.js

import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  // Mongoose cast error
  if (err.name === "CastError") {
    statusCode = 400;
    err.message = "Invalid resource ID";
  }

  // Validation error
  if (err.name === "ValidationError") {
    statusCode = 422;
  }

  // Duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {}).join(", ");
    err.message = `Duplicate value for field: ${field}`;
  }

  // JWT errors
  if (["JsonWebTokenError", "TokenExpiredError"].includes(err.name)) {
    statusCode = 401;
  }

  // Log full details always
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  return res.status(statusCode).json({
    success: false,
    message: isProd ? "Something went wrong. Please try again." : err.message,
    errors: err.errors || undefined,
    ...(isProd ? {} : { stack: err.stack }),
  });
};

export default errorHandler;
