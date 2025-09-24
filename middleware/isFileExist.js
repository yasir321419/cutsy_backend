
const { BadRequestError } = require("../handler/CustomError");


const isFileExists = (fields, message = "At least one document is required") => {
  return (req, res, next) => {
    try {
      if (!req.files || typeof req.files !== "object") {
        throw new BadRequestError(message);
      }

      const requiredFields = Array.isArray(fields) ? fields : [fields];

      // Check if ANY of the required fields exist
      const hasFile = requiredFields.some(
        (field) => Array.isArray(req.files[field]) && req.files[field].length > 0
      );

      if (!hasFile) {
        throw new BadRequestError(message);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = isFileExists;