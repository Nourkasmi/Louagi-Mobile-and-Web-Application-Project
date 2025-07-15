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

  // ✅ ENHANCED: User update schema with driver profile support
  userUpdate: Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/),
    password: Joi.string().min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    isActive: Joi.boolean(), // ✅ NEW: Support for isActive field
    license_no: Joi.string(),
    experience: Joi.number().integer().min(0),
    license_expiry: Joi.date(),
    preferences: Joi.object().allow(null),
    payment_info: Joi.object().allow(null),
    
    // ✅ NEW: Driver profile validation
    driverProfile: Joi.object({
      license_no: Joi.string(),
      experience: Joi.number().integer().min(0),
      license_expiry: Joi.date().allow(null),
      vehicle_type: Joi.string(),
      vehicle_capacity: Joi.number().integer().min(1).max(50),
      is_verified: Joi.boolean(),
      verification_notes: Joi.string().allow('', null),
      verification_date: Joi.date().allow(null),
      rating: Joi.number().min(0).max(5),
      is_available: Joi.boolean(),
      documents: Joi.object().allow(null)
    }).allow(null)
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

  // Schedule schema
  schedule: Joi.object({
    stationId: Joi.string().uuid().required(),
    dayOfWeek: Joi.number().integer().min(0).max(7).required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    isActive: Joi.boolean().optional(),
    maxTrips: Joi.number().integer().min(1).max(1000).optional(),
    notes: Joi.string().allow('', null)
  }),

  // Booking schemas
  booking: Joi.object({
    tripId: Joi.string().uuid().required(),
    seats: Joi.number().integer().min(1).max(8).default(1),
    specialRequests: Joi.string().max(500).allow('', null),
    paymentMethod: Joi.string().valid('card', 'cash', 'wallet').optional()
  }),

  // Booking update schema
  bookingUpdate: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed', 'no_show').required(),
    cancellationReason: Joi.when('status', {
      is: 'cancelled',
      then: Joi.string().max(500).required(),
      otherwise: Joi.string().max(500).allow('', null)
    }),
    paymentStatus: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').optional(),
    paymentId: Joi.string().allow('', null).optional(),
    specialRequests: Joi.string().max(500).allow('', null).optional()
  }),

  // Payment update schema
  paymentUpdate: Joi.object({
    paymentStatus: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').required(),
    paymentId: Joi.string().required(),
    amount: Joi.number().precision(2).positive().optional()
  }),

  // Bulk booking update schema
  bulkBookingUpdate: Joi.object({
    bookingIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    status: Joi.string().valid('confirmed', 'cancelled', 'completed', 'no_show').required(),
    reason: Joi.string().max(500).allow('', null)
  }),

  // ✅ Payment schemas
  // Payment intent schema
  paymentIntent: Joi.object({
    bookingId: Joi.string().uuid().required(),
    savePaymentMethod: Joi.boolean().optional().default(false),
    returnUrl: Joi.string().uri().optional()
  }),

  // Payment confirmation schema
  paymentConfirmation: Joi.object({
    paymentMethodId: Joi.string().optional(),
    returnUrl: Joi.string().uri().optional()
  }),

  // Payment cancellation schema
  paymentCancellation: Joi.object({
    reason: Joi.string().max(500).optional()
  }),

  // Refund schema
  refund: Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    reason: Joi.string().valid(
      'duplicate', 
      'fraudulent', 
      'requested_by_customer',
      'expired_uncaptured_charge'
    ).optional().default('requested_by_customer')
  }),

  // Setup intent schema
  setupIntent: Joi.object({
    usage: Joi.string().valid('on_session', 'off_session').default('off_session'),
    returnUrl: Joi.string().uri().optional()
  })
};

/**
 * ✅ ENHANCED: Validation middleware functions with better error handling
 */
const validateMiddleware = {
  validateRegistration: (data) => {
    const result = validationSchemas.registration.validate(data, { abortEarly: false });
    if (result.error) {
      console.log('❌ Registration validation failed:', result.error.details);
    }
    return result;
  },
  
  validateLogin: (data) => {
    const result = validationSchemas.login.validate(data, { abortEarly: false });
    if (result.error) {
      console.log('❌ Login validation failed:', result.error.details);
    }
    return result;
  },
  
  validateUserUpdate: (data) => {
    const result = validationSchemas.userUpdate.validate(data, { abortEarly: false });
    if (result.error) {
      console.log('❌ User update validation failed:', result.error.details);
      console.log('📝 Data being validated:', JSON.stringify(data, null, 2));
    }
    return result;
  },
  
  validateStation: (data) => validationSchemas.station.validate(data, { abortEarly: false }),
  validateDestination: (data) => validationSchemas.destination.validate(data, { abortEarly: false }),
  validateSchedule: (data) => validationSchemas.schedule.validate(data, { abortEarly: false }),
  validateBooking: (data) => validationSchemas.booking.validate(data, { abortEarly: false }),
  validateBookingUpdate: (data) => validationSchemas.bookingUpdate.validate(data, { abortEarly: false }),
  validatePaymentUpdate: (data) => validationSchemas.paymentUpdate.validate(data, { abortEarly: false }),
  validateBulkBookingUpdate: (data) => validationSchemas.bulkBookingUpdate.validate(data, { abortEarly: false }),
  
  // Payment validation functions
  validatePaymentIntent: (data) => validationSchemas.paymentIntent.validate(data, { abortEarly: false }),
  validatePaymentConfirmation: (data) => validationSchemas.paymentConfirmation.validate(data, { abortEarly: false }),
  validatePaymentCancellation: (data) => validationSchemas.paymentCancellation.validate(data, { abortEarly: false }),
  validateRefund: (data) => validationSchemas.refund.validate(data, { abortEarly: false }),
  validateSetupIntent: (data) => validationSchemas.setupIntent.validate(data, { abortEarly: false })
};

module.exports = {
  // Existing validations
  validateRegistration: validateMiddleware.validateRegistration,
  validateLogin: validateMiddleware.validateLogin,
  validateUserUpdate: validateMiddleware.validateUserUpdate,
  validateStation: validateMiddleware.validateStation,
  validateDestination: validateMiddleware.validateDestination,
  validateSchedule: validateMiddleware.validateSchedule,
  validateBooking: validateMiddleware.validateBooking,
  validateBookingUpdate: validateMiddleware.validateBookingUpdate,
  validatePaymentUpdate: validateMiddleware.validatePaymentUpdate,
  validateBulkBookingUpdate: validateMiddleware.validateBulkBookingUpdate,
  
  // Payment validations
  validatePaymentIntent: validateMiddleware.validatePaymentIntent,
  validatePaymentConfirmation: validateMiddleware.validatePaymentConfirmation,
  validatePaymentCancellation: validateMiddleware.validatePaymentCancellation,
  validateRefund: validateMiddleware.validateRefund,
  validateSetupIntent: validateMiddleware.validateSetupIntent
};