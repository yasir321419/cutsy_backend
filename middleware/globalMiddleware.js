const { handlerError } = require("../handler/resHandler");

const globalErrorMiddleware = (err, req, res, next) => {
  const statusCode = err.status ?? 500;
  const message = err.message ?? "Something went wrong";
  handlerError(res, statusCode, null, message);
};

module.exports = globalErrorMiddleware;
