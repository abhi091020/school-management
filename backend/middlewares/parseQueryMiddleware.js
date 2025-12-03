export default function parseQueryMiddleware(req, res, next) {
  // Convert ?includeDeleted=true → boolean true
  if (req.query.includeDeleted === "true") {
    req.query.includeDeleted = true;
  }

  // (Optional) normalize pagination values
  if (req.query.page) req.query.page = Number(req.query.page);
  if (req.query.limit) req.query.limit = Number(req.query.limit);

  next();
}
