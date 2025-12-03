// backend/middlewares/notFoundMiddleware.js

/**
 * 404 Not Found Middleware
 * Handles all unmatched routes
 */
const notFound = (req, res, next) => {
  res.status(404);

  next({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// FIX: Use ES Module default export
export default notFound;
