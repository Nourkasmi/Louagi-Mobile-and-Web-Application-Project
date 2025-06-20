const { Trip, DriverQueue, Schedule, Destination, Driver } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../models');

// ✅ CONFIGURATION
const QUEUE_CONFIG = {
  MIN_DRIVERS_FOR_AUTO_TRIP: 2,        // Create trip when 2+ drivers waiting
  MAX_WAIT_TIME_MINUTES: 15,           // Create trip if driver waited 15+ mins
  TRIP_INTERVAL_MINUTES: 10,           // Create trips every 10 minutes during peak
  PEAK_HOURS: [7, 8, 9, 17, 18, 19]   // Rush hours (7-9 AM, 5-7 PM)
};

/**
 * ✅ NEW: Update queue trip times when queue changes
 */
async function updateQueueTripTimes(stationId, scheduleId, destinationId, transaction) {
  console.log(`🔄 Updating queue trip times for station: ${stationId}, destination: ${destinationId}`);
  
  // Get all waiting/assigned drivers in order
  const queueEntries = await DriverQueue.findAll({
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: { [Op.in]: ['waiting', 'assigned'] }
    },
    include: [
      { model: Trip, as: 'trip' },
      { model: Schedule, as: 'schedule' },
      { model: Destination, as: 'destination' }
    ],
    order: [['position', 'ASC']],
    transaction
  });

  if (!queueEntries.length) {
    console.log('⚠️ No queue entries found to update');
    return;
  }

  const { calculateTripTimes } = require('./time.utils');

  // Reindex positions and recalculate times
  for (let i = 0; i < queueEntries.length; i++) {
    const newPosition = i + 1;
    const entry = queueEntries[i];
    
    // Update queue position if changed
    if (entry.position !== newPosition) {
      await entry.update({ position: newPosition }, { transaction });
      console.log(`📊 Updated queue position: Driver ${entry.driverId} -> position ${newPosition}`);
    }
    
    // Recalculate trip times if trip exists
    if (entry.trip && entry.schedule && entry.destination) {
      const timeCalculation = calculateTripTimes(
        entry.schedule,
        newPosition,
        entry.destination
      );
      
      await entry.trip.update({
        departureTime: timeCalculation.departureTime,
        estimatedArrivalTime: timeCalculation.estimatedArrivalTime,
        notes: `Queue position: ${newPosition}, Updated departure: ${timeCalculation.departureTime.toLocaleTimeString()}`
      }, { transaction });
      
      console.log(`⏰ Updated trip times: Trip ${entry.trip.id} -> departure ${timeCalculation.departureTime.toLocaleTimeString()}`);
    }
  }
  
  console.log(`✅ Updated ${queueEntries.length} queue entries and trip times`);
}

/**
 * ✅ ENHANCED: Get next available queue position
 */
async function getNextQueuePosition(stationId, scheduleId, destinationId) {
  const maxPosition = await DriverQueue.max('position', {
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: 'waiting'
    }
  });
  
  return (maxPosition || 0) + 1;
}

/**
 * ✅ NEW: Check if it's peak hour
 */
function isPeakHour() {
  const currentHour = new Date().getHours();
  return QUEUE_CONFIG.PEAK_HOURS.includes(currentHour);
}

/**
 * ✅ NEW: Check if driver has waited too long
 */
function hasWaitedTooLong(queueEntry) {
  const waitTime = (new Date() - new Date(queueEntry.joinedAt)) / (1000 * 60); // minutes
  return waitTime >= QUEUE_CONFIG.MAX_WAIT_TIME_MINUTES;
}

/**
 * ✅ ENHANCED: Check if driver is eligible with active trip validation
 */
async function isDriverEligible(driverId, stationId) {
  // 1. Check for active trips (most important check)
  const activeTrip = await Trip.findOne({
    where: {
      driverId,
      status: { [Op.in]: ['scheduled', 'in_progress'] }
    }
  });

  if (activeTrip) {
    return { 
      eligible: false, 
      reason: `Driver has active trip (${activeTrip.status})`,
      activeTrip,
      timeLeft: null 
    };
  }

  // 2. Check for existing queue entries
  const existingQueue = await DriverQueue.findOne({
    where: { 
      driverId,
      status: { [Op.in]: ['waiting', 'assigned'] }
    }
  });

  if (existingQueue) {
    return { 
      eligible: false, 
      reason: 'Driver already in queue',
      existingQueue,
      timeLeft: null 
    };
  }

  // 3. Check last completed trip and time restrictions
  const lastTrip = await getLastCompletedTrip(driverId);
  const timeLeft = await hasTimeLeftToday(stationId);

  if (!timeLeft) {
    return { 
      eligible: false, 
      reason: 'Not enough time left in schedule',
      lastTrip, 
      timeLeft: false 
    };
  }

  // Driver is eligible
  return { 
    eligible: true, 
    lastTrip, 
    timeLeft: true 
  };
}

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
  const AVERAGE_TRIP_DURATION_MIN = 60; // minutes

  return schedules.some(sch => {
    const endMin = toMinutes(sch.endTime);
    return (endMin - nowMinutes) >= AVERAGE_TRIP_DURATION_MIN;
  });
}

/**
 * ✅ ENHANCED: Automatically create trip from queue based on conditions
 */
async function autoCreateTripFromQueue(stationId, scheduleId, destinationId) {
  console.log(`🔄 Checking auto-trip creation for station: ${stationId}, destination: ${destinationId}`);

  const waitingDrivers = await DriverQueue.findAll({
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: 'waiting'
    },
    order: [['position', 'ASC']]
  });

  if (!waitingDrivers.length) {
    console.log('❌ No drivers waiting');
    return { created: false, reason: 'No drivers waiting' };
  }

  // ✅ CHECK CONDITIONS FOR AUTO-TRIP CREATION
  const shouldCreateTrip = 
    waitingDrivers.length >= QUEUE_CONFIG.MIN_DRIVERS_FOR_AUTO_TRIP ||  // Enough drivers
    isPeakHour() ||                                                     // Peak hours
    hasWaitedTooLong(waitingDrivers[0]);                               // First driver waited too long

  if (!shouldCreateTrip) {
    console.log(`⏳ Conditions not met: ${waitingDrivers.length} drivers, peak: ${isPeakHour()}, waited: ${hasWaitedTooLong(waitingDrivers[0])}`);
    return { 
      created: false, 
      reason: 'Waiting for more drivers or peak time',
      waitingCount: waitingDrivers.length,
      nextDriverWaitTime: Math.round((new Date() - new Date(waitingDrivers[0].joinedAt)) / (1000 * 60))
    };
  }

  // ✅ GET DESTINATION INFO
  const destination = await Destination.findOne({
    where: {
      id: destinationId,
      startId: stationId,
      isActive: true
    }
  });

  if (!destination) {
    console.log('❌ Invalid destination');
    return { created: false, reason: 'Invalid destination' };
  }

  // ✅ CREATE TRIP FOR FIRST ELIGIBLE DRIVER
  try {
    const result = await sequelize.transaction(async (t) => {
      // Find first eligible driver (no active trips)
      let selectedDriver = null;
      let selectedQueueEntry = null;

      for (const entry of waitingDrivers) {
        const existingTrip = await Trip.findOne({
          where: {
            driverId: entry.driverId,
            status: { [Op.in]: ['scheduled', 'in_progress'] }
          },
          transaction: t
        });

        if (!existingTrip) {
          selectedDriver = await Driver.findByPk(entry.driverId, { transaction: t });
          selectedQueueEntry = entry;
          break;
        }
      }

      if (!selectedDriver) {
        throw new Error('No eligible drivers found');
      }

      // ✅ CREATE TRIP WITH TIME CALCULATION
      const schedule = await Schedule.findByPk(scheduleId, { transaction: t });
      const { calculateTripTimes } = require('./time.utils');
      const timeCalculation = calculateTripTimes(schedule, selectedQueueEntry.position, destination);

      const basePrice = parseFloat(destination.basePrice);
      const currentPrice = parseFloat((basePrice * 1.2).toFixed(2));

      const trip = await Trip.create({
        id: uuidv4(),
        routeId: destinationId,
        scheduleId,
        driverId: selectedDriver.id,
        queueId: selectedQueueEntry.id,
        departureTime: timeCalculation.departureTime,
        estimatedArrivalTime: timeCalculation.estimatedArrivalTime,
        basePrice,
        currentPrice,
        capacity: selectedDriver.vehicle_capacity || 4,
        availableSeats: selectedDriver.vehicle_capacity || 4,
        status: 'scheduled',
        notes: 'Auto-created from queue'
      }, { transaction: t });

      // ✅ UPDATE QUEUE STATUS
      await selectedQueueEntry.update({ 
        status: 'assigned' 
      }, { transaction: t });

      // ✅ REINDEX REMAINING QUEUE POSITIONS AND UPDATE TIMES
      await updateQueueTripTimes(stationId, scheduleId, destinationId, t);

      return { trip, driver: selectedDriver };
    });

    console.log(`✅ Trip auto-created: ${result.trip.id} for driver: ${result.driver.id}`);
    
    return {
      created: true,
      trip: result.trip,
      driver: result.driver,
      reason: 'Auto-created from queue'
    };

  } catch (error) {
    console.error('❌ Failed to create trip from queue:', error);
    return { created: false, reason: error.message };
  }
}

/**
 * ✅ HELPER: Reindex queue positions after driver removal (UPDATED to use updateQueueTripTimes)
 */
async function reindexQueuePositions(stationId, scheduleId, destinationId, transaction) {
  // Use the more comprehensive updateQueueTripTimes function
  await updateQueueTripTimes(stationId, scheduleId, destinationId, transaction);
}

/**
 * ✅ NEW: Process all queues for auto-trip creation
 */
async function processAllQueuesForAutoTrips() {
  console.log('🚀 Processing all queues for auto-trip creation...');
  
  const activeQueues = await DriverQueue.findAll({
    attributes: ['stationId', 'scheduleId', 'destinationId'],
    where: { status: 'waiting' },
    group: ['stationId', 'scheduleId', 'destinationId'],
    raw: true
  });

  const results = [];
  
  for (const queue of activeQueues) {
    const result = await autoCreateTripFromQueue(
      queue.stationId, 
      queue.scheduleId, 
      queue.destinationId
    );
    
    if (result.created) {
      results.push(result);
    }
  }

  console.log(`✅ Auto-created ${results.length} trips from queues`);
  return results;
}

/**
 * ✅ ORIGINAL: Try to create trip (used when driver declares availability)
 */
async function tryGenerateTripFromQueue(stationId, scheduleId, destinationId) {
  return await autoCreateTripFromQueue(stationId, scheduleId, destinationId);
}

/**
 * ✅ NEW: Get queue status for a route
 */
async function getQueueStatus(stationId, scheduleId, destinationId) {
  const waitingDrivers = await DriverQueue.findAll({
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: 'waiting'
    },
    include: [{ model: Driver, as: 'driver' }],
    order: [['position', 'ASC']]
  });

  const longestWait = waitingDrivers.length > 0 ? 
    Math.round((new Date() - new Date(waitingDrivers[0].joinedAt)) / (1000 * 60)) : 0;

  return {
    totalWaiting: waitingDrivers.length,
    longestWaitMinutes: longestWait,
    shouldCreateTrip: waitingDrivers.length >= QUEUE_CONFIG.MIN_DRIVERS_FOR_AUTO_TRIP || 
                     isPeakHour() || 
                     longestWait >= QUEUE_CONFIG.MAX_WAIT_TIME_MINUTES,
    isPeakHour: isPeakHour(),
    nextTripETA: waitingDrivers.length > 0 ? '5 minutes' : 'Waiting for drivers'
  };
}

/**
 * Estimate departure time based on queue position.
 */
function estimateDepartureTime(stationId, destinationId, position) {
  const now = new Date();
  const AVERAGE_TRIP_DURATION_MIN = 60;
  const offsetMs = (position - 1) * AVERAGE_TRIP_DURATION_MIN * 60 * 1000;
  return new Date(now.getTime() + offsetMs);
}

/**
 * Check if current time is within the schedule's active hours.
 */
function isWithinScheduleTime(schedule) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}

module.exports = {
  // ✅ NEW: Time-based queue management
  updateQueueTripTimes,
  
  // Existing functions
  getNextQueuePosition,
  autoCreateTripFromQueue,
  processAllQueuesForAutoTrips,
  tryGenerateTripFromQueue,
  reindexQueuePositions,
  getQueueStatus,
  isPeakHour,
  hasWaitedTooLong,
  isDriverEligible,
  getLastCompletedTrip,
  hasTimeLeftToday,
  estimateDepartureTime,
  isWithinScheduleTime,
  QUEUE_CONFIG
};