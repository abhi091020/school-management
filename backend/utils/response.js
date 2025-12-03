// backend/utils/response.js

/**
 * THROW ERROR (Service Layer)
 * ---------------------------
 * Always throw structured error so global error middleware
 * or controller-level catch can handle safely.
 */
export const throwError = (message, statusCode = 500, errors = null) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.errors = errors;
  err.success = false;
  throw err;
};

/**
 * BUILD RESPONSE (Internal Helper)
 * -------------------------------
 * Ensures all success/error responses follow the same schema.
 */
const buildResponse = ({
  success,
  message,
  status,
  data = null,
  meta = null,
  code = null,
  error = null,
}) => {
  const resObj = {
    success,
    status,
    message,
  };

  if (code) resObj.code = code;
  if (data !== null) resObj.data = data;
  if (meta) resObj.meta = meta;

  // Debug data only in development
  if (error && process.env.NODE_ENV !== "production") {
    resObj.debug = {
      error: error?.message || String(error),
      stack: error?.stack,
    };
  }

  return resObj;
};

/* ---------------------------------------------------------
   SUCCESS RESPONSE (Standard)
--------------------------------------------------------- */
export const success = (
  res,
  data = null,
  message = "Success",
  status = 200,
  meta = null,
  code = null
) => {
  return res.status(status).json(
    buildResponse({
      success: true,
      message,
      status,
      data,
      meta,
      code,
    })
  );
};

/* ---------------------------------------------------------
   ERROR RESPONSE (Standard)
--------------------------------------------------------- */
export const error = (
  res,
  message = "Error",
  status = 400,
  errObj = null,
  code = null
) => {
  return res.status(status).json(
    buildResponse({
      success: false,
      message,
      status,
      error: errObj,
      code,
    })
  );
};

/* ---------------------------------------------------------
   SHORTCUTS
--------------------------------------------------------- */
export const forbidden = (res, message = "Forbidden") =>
  error(res, message, 403);
export const unauthorized = (res, message = "Unauthorized") =>
  error(res, message, 401);
export const notFound = (res, message = "Resource not found") =>
  error(res, message, 404);

/* ---------------------------------------------------------
   NEW: sendResponse (Used in Parent/Student Controllers)
--------------------------------------------------------- */
export const sendResponse = (
  res,
  status = 200,
  message = "",
  data = null,
  meta = null,
  code = null
) => {
  const payload = buildResponse({
    success: true,
    status,
    message,
    data,
    meta,
    code,
  });

  return res.status(status).json(payload);
};
