const Joi = require('joi');

/**
 * Validation schemas for request data
 */
const validationSchemas = {
  // User registration schema
  registration: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
    role: Joi.string().valid('passenger', 'driver', 'admin').default('passenger'),
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
    preferences: Joi.object().allow(null),
    payment_info: Joi.object().allow(null)
  }),

  // Login schema
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // User update schema
  userUpdate: Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/),
    password: Joi.string().min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    license_no: Joi.string(),
    experience: Joi.number().integer().min(0),
    license_expiry: Joi.date(),
    preferences: Joi.object().allow(null),
    payment_info: Joi.object().allow(null)
  }),

  // Station schema
  station: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    zipCode: Joi.string().pattern(/^[0-9]{4,6}$/).required(),
    capacity: Joi.number().integer().min(1).max(1000).optional(),
    isActive: Joi.boolean().optional(),
    contactPhone: Joi.string().pattern(/^\+?[0-9]{8,15}$/).optional(),
    contactEmail: Joi.string().email().optional(),
    amenities: Joi.object().optional(),
    address: Joi.string().min(5).max(100).required()
  }),

  // Destination schema
  destination: Joi.object({
    startId: Joi.string().uuid().required(),
    endId: Joi.string().uuid().required(),
    distance: Joi.number().positive().required(),
    basePrice: Joi.number().precision(2).positive().required(),
    estimatedDuration: Joi.number().integer().min(1).required(),
    description: Joi.string().allow('', null),
    isActive: Joi.boolean().optional()
  }),

  // ✅ Schedule schema (added)
  schedule: Joi.object({
    stationId: Joi.string().uuid().required(),
    dayOfWeek: Joi.number().integer().min(0).max(6).required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    isActive: Joi.boolean().optional(),
    maxTrips: Joi.number().integer().min(1).max(1000).optional(),
    notes: Joi.string().allow('', null)
  })
};

/**
 * Validation middleware functions
 */
const validateMiddleware = {
  validateRegistration: (data) => validationSchemas.registration.validate(data, { abortEarly: false }),
  validateLogin: (data) => validationSchemas.login.validate(data, { abortEarly: false }),
  validateUserUpdate: (data) => validationSchemas.userUpdate.validate(data, { abortEarly: false }),
  validateStation: (data) => validationSchemas.station.validate(data, { abortEarly: false }),
  validateDestination: (data) => validationSchemas.destination.validate(data, { abortEarly: false }),
  validateSchedule: (data) => validationSchemas.schedule.validate(data, { abortEarly: false }) // ✅
};

module.exports = {
  validateRegistration: validateMiddleware.validateRegistration,
  validateLogin: validateMiddleware.validateLogin,
  validateUserUpdate: validateMiddleware.validateUserUpdate,
  validateStation: validateMiddleware.validateStation,
  validateDestination: validateMiddleware.validateDestination,
  validateSchedule: validateMiddleware.validateSchedule // ✅
};
