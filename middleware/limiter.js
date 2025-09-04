const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  limit: 10,
  windowMs: 10000,
});

module.exports = limiter;
