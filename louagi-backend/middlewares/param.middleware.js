const { validate: isUUID } = require('uuid');

const paramMiddleware = {
  validateUUID: (paramName) => {
    return (req, res, next) => {
      const id = req.params[paramName];
      if (!isUUID(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${paramName} format`
        });
      }
      next();
    };
  }
};

module.exports = paramMiddleware;
