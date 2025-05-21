const Joi = require('joi');

/**
 * Validation schemas for request data
 */
const validationSchemas = {
  /**
   * User registration schema
   */
  registration: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
    role: Joi.string().valid('passenger', 'driver', 'admin').default('passenger'),

    // Driver-specific fields (required if role is driver)
    license_no: Joi.when('role', {
      is: 'driver',
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null, '')
    }),
    experience: Joi.when('role', {
      is: 'driver',
      then: Joi.number().integer().min(0).required(),
      otherwise: Joi.number().allow(null)
    }),
    license_expiry: Joi.when('role', {
      is: 'driver',
      then: Joi.date().required(),
      otherwise: Joi.date().allow(null)
    }),

    // Passenger-specific fields (optional)
    preferences: Joi.object().allow(null),
    payment_info: Joi.object().allow(null)
  }),

  /**
   * User login schema
   */
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  /**
   * User update schema
   */
  userUpdate: Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/),
    password: Joi.string().min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    // Driver-specific fields
    license_no: Joi.string(),
    experience: Joi.number().integer().min(0),
    license_expiry: Joi.date(),

    // Passenger-specific fields
    preferences: Joi.object().allow(null),
    payment_info: Joi.object().allow(null)
  })
};

/**
 * Validation middleware functions
 */
const validateMiddleware = {
  /**
   * Validate registration data
   * @param {Object} data - Registration data to validate
   * @returns {Object} Validation result
   */
  validateRegistration: (data) => {
    return validationSchemas.registration.validate(data, { abortEarly: false });
  },

  /**
   * Validate login data
   * @param {Object} data - Login data to validate
   * @returns {Object} Validation result
   */
  validateLogin: (data) => {
    return validationSchemas.login.validate(data, { abortEarly: false });
  },

  /**
   * Validate user update data
   * @param {Object} data - User update data to validate
   * @returns {Object} Validation result
   */
  validateUserUpdate: (data) => {
    return validationSchemas.userUpdate.validate(data, { abortEarly: false });
  }
};

module.exports = validateMiddleware;
