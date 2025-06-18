// Middleware to disable caching for all responses on localhost
module.exports = function noCache(req, res, next) {
  // Set headers to prevent caching
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};
