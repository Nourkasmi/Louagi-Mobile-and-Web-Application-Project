const { Trip, DriverQueue, Schedule, Destination } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const AVERAGE_TRIP_DURATION_MIN = 60; // minutes

/**
 * Get the driver's last completed trip.
 */
async function getLastCompletedTrip(driverId) {
  return await Trip.findOne({
    where: {
      driverId,
      status: 'completed'
    },
    order: [['actualArrivalTime', 'DESC']],
  });
}

/**
 * Check if there's enough time left in any active schedule today.
 */
async function hasTimeLeftToday(stationId) {
  const now = new Date();
  const today = now.getDay();

  const schedules = await Schedule.findAll({
    where: {
      stationId,
      dayOfWeek: today,
      isActive: true
    }
  });

  const toMinutes = timeStr => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return schedules.some(sch => {
    const endMin = toMinutes(sch.endTime);
    return (endMin - nowMinutes) >= AVERAGE_TRIP_DURATION_MIN;
  });
}

/**
 * Check if a driver is eligible to re-enter the queue.
 */
async function isDriverEligible(driverId, stationId) {
  const lastTrip = await getLastCompletedTrip(driverId);
  if (lastTrip && lastTrip.status !== 'completed') {
    return { eligible: false, lastTrip, timeLeft: null };
  }

  const timeLeft = await hasTimeLeftToday(stationId);
  return { eligible: timeLeft, lastTrip, timeLeft };
}

/**
 * Estimate departure time based on queue position.
 */
function estimateDepartureTime(stationId, destinationId, position) {
  const now = new Date();
  const offsetMs = (position - 1) * AVERAGE_TRIP_DURATION_MIN * 60 * 1000;
  return new Date(now.getTime() + offsetMs);
}

/**
 * Get next available position in the queue for a given route.
 */
async function getNextQueuePosition(stationId, scheduleId, destinationId) {
  const count = await DriverQueue.count({
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: 'waiting'
    }
  });
  return count + 1;
}

/**
 * Assign a trip to the first eligible driver in the queue for a given route.
 */
async function tryGenerateTripFromQueue(stationId, scheduleId, destinationId) {
  const waitingDrivers = await DriverQueue.findAll({
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: 'waiting'
    },
    order: [['position', 'ASC']]
  });

  if (!waitingDrivers.length) return null;

  const destination = await Destination.findOne({
    where: {
      id: destinationId,
      startId: stationId,
      isActive: true
    }
  });

  if (!destination) {
    console.warn('No active destination found for this route.');
    return null;
  }

  const now = new Date();

  for (const entry of waitingDrivers) {
    const existingTrip = await Trip.findOne({
      where: {
        driverId: entry.driverId,
        status: { [Op.in]: ['scheduled', 'in_progress'] }
      }
    });

    if (existingTrip) continue;

    const departureTime = new Date(now.getTime() + 5 * 60000);
    const estimatedArrivalTime = new Date(departureTime.getTime() + destination.estimatedDuration * 60 * 1000);
    const basePrice = parseFloat(destination.basePrice);
    const currentPrice = parseFloat((basePrice * 1.2).toFixed(2));

    const trip = await Trip.create({
      id: uuidv4(),
      driverId: entry.driverId,
      stationId,
      scheduleId,
      routeId: destination.id,
      queueId: entry.id,
      departureTime,
      estimatedArrivalTime,
      basePrice,
      currentPrice,
      status: 'scheduled'
    });

    await entry.update({ status: 'assigned' });

    return trip;
  }

  return null; // No eligible driver found
}

module.exports = {
  getLastCompletedTrip,
  isDriverEligible,
  estimateDepartureTime,
  getNextQueuePosition,
  tryGenerateTripFromQueue
};
