// backend/middlewares/asyncHandler.js

/**
 * Async Handler
 * Safely wraps async/await controllers so errors (both sync and async)
 * are consistently forwarded to the Express error middleware via next(error).
 */
const asyncHandler = (fn) => (req, res, next) => {
  try {
    // 1. Execute the controller function (fn).
    // 2. Wrap the result in Promise.resolve() to handle both sync and async return values.
    // 3. Catch any Promise rejection (asynchronous error) and forward it via next().
    Promise.resolve(fn(req, res, next)).catch(next);
  } catch (error) {
    // 4. Catch any synchronous exception thrown directly within fn
    //    (e.g., throwError or validation failure) and forward it via next().
    next(error);
  }
};

// Use ES Module default export
export default asyncHandler;
