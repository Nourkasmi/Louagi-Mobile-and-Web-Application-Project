const { Trip, Booking, Driver, DriverQueue, Station, Schedule, Destination } = require('../models');
const { Op } = require('sequelize');

/**
 * ✅ HELPER: Format trip departure time
 */
const formatDepartureTime = (departureTime) => {
  return new Date(departureTime).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Tunis' // Tunisia timezone
  });
};

/**
 * ✅ HELPER: Calculate trip duration
 */
const calculateTripDuration = (departureTime, arrivalTime) => {
  const duration = new Date(arrivalTime) - new Date(departureTime);
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

/**
 * ✅ HELPER: Check if trip can be cancelled
 */
const canCancelTrip = (trip) => {
  const now = new Date();
  const departure = new Date(trip.departureTime);
  const hoursUntilDeparture = (departure - now) / (1000 * 60 * 60);
  
  return trip.status === 'scheduled' && hoursUntilDeparture > 1; // 1 hour minimum
};

/**
 * ✅ HELPER: Get driver earnings for completed trips
 */
const calculateDriverEarnings = async (driverId, startDate, endDate) => {
  const completedTrips = await Trip.findAll({
    where: {
      driverId,
      status: 'completed',
      actualArrivalTime: {
        [Op.between]: [startDate, endDate]
      }
    },
    include: [
      {
        model: Booking,
        as: 'bookings',
        where: { status: 'completed' },
        required: false
      }
    ]
  });

  let totalEarnings = 0;
  let totalTrips = completedTrips.length;
  let totalPassengers = 0;
  
  for (const trip of completedTrips) {
    const tripRevenue = trip.bookings?.reduce((sum, booking) => 
      sum + parseFloat(booking.amount), 0
    ) || 0;
    
    // Driver gets 80% of trip revenue (company takes 20%)
    totalEarnings += tripRevenue * 0.8;
    totalPassengers += trip.bookings?.length || 0;
  }

  return {
    totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    totalTrips,
    totalPassengers,
    averageEarningsPerTrip: totalTrips > 0 ? 
      parseFloat((totalEarnings / totalTrips).toFixed(2)) : 0,
    averagePassengersPerTrip: totalTrips > 0 ?
      parseFloat((totalPassengers / totalTrips).toFixed(1)) : 0
  };
};

/**
 * ✅ HELPER: Get station statistics
 */
const getStationStats = async (stationId, date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalTripsToday,
    activeTrips,
    waitingDrivers,
    completedTrips,
    totalRevenue
  ] = await Promise.all([
    Trip.count({
      include: [{
        model: Schedule,
        as: 'schedule',
        where: { stationId }
      }],
      where: {
        createdAt: { [Op.between]: [startOfDay, endOfDay] }
      }
    }),
    Trip.count({
      include: [{
        model: Schedule,
        as: 'schedule',
        where: { stationId }
      }],
      where: {
        status: { [Op.in]: ['scheduled', 'in_progress'] }
      }
    }),
    DriverQueue.count({
      where: { stationId, status: 'waiting' }
    }),
    Trip.count({
      include: [{
        model: Schedule,
        as: 'schedule',
        where: { stationId }
      }],
      where: {
        status: 'completed',
        actualArrivalTime: { [Op.between]: [startOfDay, endOfDay] }
      }
    }),
    Booking.sum('amount', {
      include: [{
        model: Trip,
        as: 'trip',
        include: [{
          model: Schedule,
          as: 'schedule',
          where: { stationId }
        }]
      }],
      where: {
        status: 'completed',
        createdAt: { [Op.between]: [startOfDay, endOfDay] }
      }
    })
  ]);

  return {
    stationId,
    date: date.toISOString().split('T')[0],
    totalTripsToday,
    activeTrips,
    waitingDrivers,
    completedTrips,
    totalRevenue: totalRevenue || 0,
    completionRate: totalTripsToday > 0 ? 
      ((completedTrips / totalTripsToday) * 100).toFixed(1) + '%' : '0%'
  };
};

/**
 * ✅ FORMATTER: Standard API response
 */
const formatApiResponse = (success, data = null, message = '', errors = null) => {
  const response = {
    success,
    timestamp: new Date().toISOString()
  };

  if (message) response.message = message;
  if (data) response.data = data;
  if (errors) response.errors = errors;

  return response;
};

/**
 * ✅ FORMATTER: Trip response with full details
 */
const formatTripResponse = (trip) => {
  return {
    id: trip.id,
    route: {
      from: trip.route?.startStation?.name || 'Unknown',
      to: trip.route?.endStation?.name || 'Unknown',
      description: trip.route?.description,
      distance: trip.route?.distance,
      estimatedDuration: trip.route?.estimatedDuration
    },
    schedule: {
      dayOfWeek: trip.schedule?.dayOfWeek,
      startTime: trip.schedule?.startTime,
      endTime: trip.schedule?.endTime
    },
    driver: {
      id: trip.driver?.id,
      name: trip.driver?.user?.username,
      rating: trip.driver?.rating,
      vehicleType: trip.driver?.vehicle_type,
      vehicleCapacity: trip.driver?.vehicle_capacity
    },
    timing: {
      departureTime: trip.departureTime,
      estimatedArrivalTime: trip.estimatedArrivalTime,
      actualDepartureTime: trip.actualDepartureTime,
      actualArrivalTime: trip.actualArrivalTime,
      duration: calculateTripDuration(trip.departureTime, trip.estimatedArrivalTime),
      formattedDeparture: formatDepartureTime(trip.departureTime)
    },
    booking: {
      capacity: trip.capacity,
      availableSeats: trip.availableSeats,
      bookedSeats: trip.capacity - trip.availableSeats,
      basePrice: trip.basePrice,
      currentPrice: trip.currentPrice,
      pricePerSeat: (trip.currentPrice / trip.capacity).toFixed(2)
    },
    status: trip.status,
    canBook: trip.status === 'scheduled' && trip.availableSeats > 0,
    canCancel: canCancelTrip(trip),
    notes: trip.notes,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt
  };
};

/**
 * ✅ FORMATTER: Driver queue status response
 */
const formatQueueResponse = (queueEntry) => {
  return {
    id: queueEntry.id,
    driver: {
      id: queueEntry.driver?.id,
      name: queueEntry.driver?.user?.username,
      rating: queueEntry.driver?.rating
    },
    station: {
      id: queueEntry.station?.id,
      name: queueEntry.station?.name,
      city: queueEntry.station?.city
    },
    destination: {
      id: queueEntry.destination?.id,
      description: queueEntry.destination?.description
    },
    schedule: {
      id: queueEntry.schedule?.id,
      dayOfWeek: queueEntry.schedule?.dayOfWeek,
      timeSlot: `${queueEntry.schedule?.startTime} - ${queueEntry.schedule?.endTime}`
    },
    position: queueEntry.position,
    status: queueEntry.status,
    joinedAt: queueEntry.joinedAt,
    waitingTime: Math.round((new Date() - new Date(queueEntry.joinedAt)) / (1000 * 60)) + ' minutes',
    estimatedDepartureTime: new Date(Date.now() + (queueEntry.position * 5 * 60 * 1000)).toISOString()
  };
};

/**
 * ✅ FORMATTER: Booking response with trip details
 */
const formatBookingResponse = (booking) => {
  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    passenger: {
      name: booking.passenger?.user?.username,
      email: booking.passenger?.user?.email,
      phone: booking.passenger?.user?.phone
    },
    trip: formatTripResponse(booking.trip),
    booking: {
      seats: booking.seats,
      amount: booking.amount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequests,
      bookedAt: booking.bookedAt,
      cancellationReason: booking.cancellationReason
    },
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
};

/**
 * ✅ VALIDATOR: Check if driver can declare availability
 */
const canDeclareAvailability = async (driverId) => {
  // Check for active trips
  const activeTrip = await Trip.findOne({
    where: {
      driverId,
      status: { [Op.in]: ['scheduled', 'in_progress'] }
    }
  });

  if (activeTrip) {
    return {
      canDeclare: false,
      reason: `Driver has active trip (${activeTrip.status})`,
      activeTrip
    };
  }

  // Check for existing queue entries
  const existingQueue = await DriverQueue.findOne({
    where: {
      driverId,
      status: { [Op.in]: ['waiting', 'assigned'] }
    }
  });

  if (existingQueue) {
    return {
      canDeclare: false,
      reason: 'Driver already in queue',
      queueEntry: existingQueue
    };
  }

  return {
    canDeclare: true,
    reason: 'Driver is available'
  };
};

/**
 * ✅ UTILITY: Get system health status
 */
const getSystemHealth = async () => {
  try {
    const [
      totalTrips,
      activeTrips,
      waitingDrivers,
      todayBookings,
      activeSchedules,
      totalRevenue
    ] = await Promise.all([
      Trip.count(),
      Trip.count({ where: { status: { [Op.in]: ['scheduled', 'in_progress'] } } }),
      DriverQueue.count({ where: { status: 'waiting' } }),
      Booking.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Schedule.count({ where: { isActive: true } }),
      Booking.sum('amount', {
        where: {
          status: 'completed',
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        totalTrips,
        activeTrips,
        waitingDrivers,
        todayBookings,
        activeSchedules,
        todayRevenue: totalRevenue || 0
      },
      alerts: [
        ...(activeSchedules === 0 ? ['No active schedules'] : []),
        ...(waitingDrivers > 50 ? [`High number of waiting drivers: ${waitingDrivers}`] : [])
      ]
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

module.exports = {
  // Helper functions
  formatDepartureTime,
  calculateTripDuration,
  canCancelTrip,
  calculateDriverEarnings,
  getStationStats,
  canDeclareAvailability,
  getSystemHealth,
  
  // Response formatters
  formatApiResponse,
  formatTripResponse,
  formatQueueResponse,
  formatBookingResponse
};