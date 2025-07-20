const cron = require('node-cron');
const { Op } = require('sequelize');
const { Trip, DriverQueue, Schedule, Driver, Destination, Booking, sequelize } = require('../models');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 *  Helper: Move all end-of-day leftovers to front of tomorrow's queue, per (station, destination).
 */
const moveAllEndOfDayLeftoversToFront = async (queueEntries) => {
  if (!queueEntries.length) return;

  // Group entries by (stationId, destinationId)
  const grouped = {};
  for (const entry of queueEntries) {
    const key = `${entry.stationId}_${entry.destinationId}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  }

  for (const key of Object.keys(grouped)) {
    const entries = grouped[key];
    // Sort today's leftovers by their current position
    entries.sort((a, b) => a.position - b.position);
    const { stationId, destinationId } = entries[0];

    // Find tomorrow's schedule
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay();

    const tomorrowSchedule = await Schedule.findOne({
      where: { stationId, dayOfWeek: tomorrowDayOfWeek, isActive: true }
    });
    if (!tomorrowSchedule) {
      // No schedule tomorrow: just remove queue entries
      for (const entry of entries) await entry.destroy();
      continue;
    }

    // Shift all existing tomorrow queue entries down
    const existingTomorrow = await DriverQueue.findAll({
      where: {
        stationId,
        destinationId,
        scheduleId: tomorrowSchedule.id
      },
      order: [['position', 'ASC']]
    });
    if (existingTomorrow.length) {
      for (const q of existingTomorrow) {
        await q.update({ position: q.position + entries.length });
      }
    }

    // Insert today's leftovers at the front for tomorrow (keep today's order)
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      await entry.update({
        scheduleId: tomorrowSchedule.id,
        position: i + 1,
        joinedAt: new Date(),
        metadata: {
          movedFromDate: new Date().toISOString().split('T')[0],
          moveReason: 'carry_over_end_of_day',
          originalPosition: entry.position
        }
      });
    }
  }
};

/**
 *  End of schedule cleanup (runs at 10:00 PM and 1:00 AM daily)
 * Move leftovers to tomorrow’s queue (at front, in order)
 */
cron.schedule('0 22 * * *', async () => {
  try {
    logger.info('🕙 Running end-of-schedule cleanup (10 PM)...');
    const result = await handleEndOfScheduleDay();
    logger.info(`✅ End-of-schedule cleanup (10 PM) completed: ${JSON.stringify(result)}`);
  } catch (error) {
    logger.error('❌ Error in end-of-schedule cleanup (10 PM):', error);
  }
});

cron.schedule('0 1 * * *', async () => {
  try {
    logger.info('🕐 Running end-of-schedule cleanup (1 AM)...');
    const result = await handleEndOfScheduleDay();
    logger.info(`✅ End-of-schedule cleanup (1 AM) completed: ${JSON.stringify(result)}`);
  } catch (error) {
    logger.error('❌ Error in end-of-schedule cleanup (1 AM):', error);
  }
});

/**
 * ✅ Queue position validation (runs every 30 minutes)
 */
cron.schedule('*/30 * * * *', async () => {
  try {
    logger.info('🔧 Running queue position validation...');
    const queueCombinations = await DriverQueue.findAll({
      attributes: ['stationId', 'scheduleId', 'destinationId'],
      where: { status: 'waiting' },
      group: ['stationId', 'scheduleId', 'destinationId'],
      raw: true
    });
    let fixedQueues = 0;
    for (const combo of queueCombinations) {
      const { stationId, scheduleId, destinationId } = combo;
      const drivers = await DriverQueue.findAll({
        where: { stationId, scheduleId, destinationId, status: 'waiting' },
        order: [['position', 'ASC']]
      });
      let needsReindex = false;
      for (let i = 0; i < drivers.length; i++) {
        if (drivers[i].position !== i + 1) {
          needsReindex = true;
          break;
        }
      }
      if (needsReindex) {
        logger.warn(`Fixing queue positions for station ${stationId}, destination ${destinationId}`);
        for (let i = 0; i < drivers.length; i++) {
          await drivers[i].update({ position: i + 1 });
        }
        fixedQueues++;
      }
    }
    if (fixedQueues > 0) {
      logger.info(`✅ Fixed positions for ${fixedQueues} queues`);
    }
  } catch (error) {
    logger.error('❌ Error in queue position validation:', error);
  }
});

/**
 *  Health check for system components (runs every 5 minutes)
 */
cron.schedule('*/5 * * * *', async () => {
  try {
    await sequelize.authenticate();
    const [
      activeTrips,
      waitingDrivers,
      todayBookings,
      activeSchedules
    ] = await Promise.all([
      Trip.count({ where: { status: { [Op.in]: ['scheduled', 'in_progress'] } } }),
      DriverQueue.count({ where: { status: 'waiting' } }),
      Booking.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Schedule.count({ where: { isActive: true } })
    ]);
    const now = new Date();
    if (now.getMinutes() === 0) {
      logger.info('📊 System Health Check:', {
        activeTrips,
        waitingDrivers,
        todayBookings,
        activeSchedules,
        timestamp: now.toISOString()
      });
    }
    if (activeSchedules === 0) {
      logger.warn('⚠️ No active schedules found!');
    }
    if (waitingDrivers > 50) {
      logger.warn(`⚠️ High number of waiting drivers: ${waitingDrivers}`);
    }
  } catch (error) {
    logger.error('❌ Health check failed:', error);
  }
});

/**
 *  Weekly statistics report (runs every Sunday at 23:00)
 */
cron.schedule('0 23 * * 0', async () => {
  try {
    logger.info('📈 Generating weekly statistics report...');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [
      weeklyTrips,
      weeklyBookings,
      completedTrips,
      cancelledTrips,
      totalRevenue
    ] = await Promise.all([
      Trip.count({
        where: {
          createdAt: { [Op.gte]: weekAgo }
        }
      }),
      Booking.count({
        where: {
          createdAt: { [Op.gte]: weekAgo }
        }
      }),
      Trip.count({
        where: {
          status: 'completed',
          actualArrivalTime: { [Op.gte]: weekAgo }
        }
      }),
      Trip.count({
        where: {
          status: 'cancelled',
          updatedAt: { [Op.gte]: weekAgo }
        }
      }),
      Booking.sum('amount', {
        where: {
          status: 'completed',
          createdAt: { [Op.gte]: weekAgo }
        }
      })
    ]);
    const completionRate = weeklyTrips > 0 ? ((completedTrips / weeklyTrips) * 100).toFixed(1) : 0;
    const cancellationRate = weeklyTrips > 0 ? ((cancelledTrips / weeklyTrips) * 100).toFixed(1) : 0;
    logger.info('📊 Weekly Statistics Report:', {
      period: `${weekAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
      weeklyTrips,
      weeklyBookings,
      completedTrips,
      cancelledTrips,
      totalRevenue: totalRevenue || 0,
      completionRate: `${completionRate}%`,
      cancellationRate: `${cancellationRate}%`,
      averageBookingsPerTrip: weeklyTrips > 0 ? (weeklyBookings / weeklyTrips).toFixed(1) : 0
    });
  } catch (error) {
    logger.error('❌ Error generating weekly statistics:', error);
  }
});

// 
//  END OF SCHEDULE DAY LOGIC
// 

/**
 *  UPDATED: Handle what happens when schedule day ends
 */
const handleEndOfScheduleDay = async () => {
  const now = new Date();
  const today = now.getDay();
  // Gather all leftovers from all schedules for the day
  const endingSchedules = await Schedule.findAll({
    where: { dayOfWeek: today, isActive: true }
  });
  let allLeftovers = [];
  for (const schedule of endingSchedules) {
    const waitingDrivers = await DriverQueue.findAll({
      where: {
        stationId: schedule.stationId,
        scheduleId: schedule.id,
        status: { [Op.in]: ['waiting', 'assigned'] }
      },
      order: [['position', 'ASC']]
    });
    allLeftovers.push(...waitingDrivers);
    await schedule.update({ rolloverProcessed: true });
  }
  // Move all leftovers at once, keeping each (station, destination) queue order
  await moveAllEndOfDayLeftoversToFront(allLeftovers);
  return { processedDrivers: allLeftovers.length };
};

/**
 *  KEEP ALL REMAINING FUNCTIONS AS BEFORE (for endpoints, manual triggers, helpers, etc.)
 */

const moveDriverToTomorrow = async (queueEntry, trip, reason) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDayOfWeek = tomorrow.getDay();

  const tomorrowSchedule = await Schedule.findOne({
    where: {
      stationId: queueEntry.stationId,
      dayOfWeek: tomorrowDayOfWeek,
      isActive: true
    }
  });

  if (!tomorrowSchedule) {
    await cancelEmptyTrip(trip, queueEntry);
    return;
  }

  await sequelize.transaction(async (t) => {
    const nextPosition = await getNextAvailablePosition(
      queueEntry.stationId,
      tomorrowSchedule.id,
      queueEntry.destinationId
    );
    await queueEntry.update({
      scheduleId: tomorrowSchedule.id,
      position: nextPosition,
      joinedAt: new Date(),
      metadata: {
        movedFromDate: new Date().toISOString().split('T')[0],
        moveReason: reason,
        originalPosition: queueEntry.position
      }
    }, { transaction: t });

    if (trip) {
      // Move departure/arrival time to tomorrow, keeping the same hour/minute
      let origDeparture = new Date(trip.departureTime);
      let newDeparture = new Date(origDeparture);
      newDeparture.setDate(newDeparture.getDate() + 1);

      let origArrival = new Date(trip.estimatedArrivalTime);
      let newArrival = new Date(origArrival);
      newArrival.setDate(newArrival.getDate() + 1);

      await trip.update({
        scheduleId: tomorrowSchedule.id,
        departureTime: newDeparture,
        estimatedArrivalTime: newArrival,
        notes: (trip.notes || '') + ` - Moved to tomorrow (${reason})`
      }, { transaction: t });
    }
  });
};
const moveQueueEntryToTomorrow = async (queueEntry) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDayOfWeek = tomorrow.getDay();

  const tomorrowSchedule = await Schedule.findOne({
    where: {
      stationId: queueEntry.stationId,
      dayOfWeek: tomorrowDayOfWeek,
      isActive: true
    }
  });

  if (!tomorrowSchedule) {
    await queueEntry.destroy();
    return;
  }

  const nextPosition = await getNextAvailablePosition(
    queueEntry.stationId,
    tomorrowSchedule.id,
    queueEntry.destinationId
  );

  await queueEntry.update({
    scheduleId: tomorrowSchedule.id,
    position: nextPosition,
    joinedAt: new Date(),
    metadata: {
      movedFromDate: new Date().toISOString().split('T')[0],
      moveReason: 'queue_only',
      originalPosition: queueEntry.position
    }
  });
};

const cancelEmptyTrip = async (trip, queueEntry) => {
  await sequelize.transaction(async (t) => {
    if (trip) {
      await trip.update({
        status: 'cancelled',
        notes: (trip.notes || '') + ' - Cancelled at end of schedule day'
      }, { transaction: t });
    }
    await queueEntry.destroy({ transaction: t });
  });
};

const getDriverPreference = async (driverId) => {
  // For now, default to moving to tomorrow
  return 'move_to_tomorrow';
};

const notifyDriverAboutEndOfDay = async (driver, trip) => {
  logger.info(`📱 Notify driver ${driver.id}: Schedule ended, trip ${trip ? 'moved to tomorrow' : 'cancelled'}`);
};

const moveWaitingDriversToNextDay = async () => {
  const waitingDrivers = await DriverQueue.findAll({
    where: { status: 'waiting' },
    include: ['schedule']
  });

  let movedCount = 0;
  let removedCount = 0;

  for (const driver of waitingDrivers) {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayOfWeek = tomorrow.getDay();

      const nextSchedule = await Schedule.findOne({
        where: {
          stationId: driver.stationId,
          dayOfWeek: tomorrowDayOfWeek,
          isActive: true
        }
      });

      if (nextSchedule) {
        await driver.update({
          scheduleId: nextSchedule.id,
          joinedAt: new Date(),
          position: await getNextAvailablePosition(
            driver.stationId,
            nextSchedule.id,
            driver.destinationId
          )
        });

        movedCount++;
        logger.info(`Moved driver ${driver.driverId} to tomorrow's schedule`);
      } else {
        await driver.destroy();
        removedCount++;
        logger.info(`Removed driver ${driver.driverId} - no tomorrow schedule available`);
      }
    } catch (error) {
      logger.error(`Error processing driver ${driver.driverId}:`, error);
    }
  }

  logger.info(`✅ Schedule cleanup: ${movedCount} drivers moved, ${removedCount} drivers removed`);
  return { movedCount, removedCount };
};

const getNextAvailablePosition = async (stationId, scheduleId, destinationId) => {
  const maxPosition = await DriverQueue.max('position', {
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: 'waiting'
    }
  });
  return (maxPosition || 0) + 1;
};

const getEndOfDayOptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const queueEntry = await DriverQueue.findOne({
      where: {
        driverId: driver.id,
        status: { [Op.in]: ['waiting', 'assigned'] }
      },
      include: [
        { model: Schedule, as: 'schedule' },
        { model: Destination, as: 'destination' }
      ]
    });

    if (!queueEntry) {
      return res.status(200).json({
        success: true,
        hasQueueEntry: false,
        message: 'No active queue entry'
      });
    }

    const now = new Date();
    const [endHour, endMinute] = queueEntry.schedule.endTime.split(':').map(Number);
    const scheduleEndTime = new Date();
    scheduleEndTime.setHours(endHour, endMinute, 0, 0);

    const minutesUntilEnd = (scheduleEndTime - now) / (1000 * 60);

    if (minutesUntilEnd > 30) {
      return res.status(200).json({
        success: true,
        scheduleEnding: false,
        minutesUntilEnd: Math.round(minutesUntilEnd),
        message: `Schedule ends in ${Math.round(minutesUntilEnd)} minutes`
      });
    }

    const trip = await Trip.findOne({
      where: {
        driverId: driver.id,
        status: 'scheduled',
        queueId: queueEntry.id
      },
      include: [
        {
          model: Booking,
          as: 'bookings',
          where: { status: { [Op.notIn]: ['cancelled'] } },
          required: false
        }
      ]
    });

    const hasBookings = trip && trip.bookings && trip.bookings.length > 0;

    return res.status(200).json({
      success: true,
      scheduleEnding: true,
      minutesUntilEnd: Math.round(minutesUntilEnd),
      hasTrip: !!trip,
      hasBookings,
      bookingsCount: trip?.bookings?.length || 0,
      options: hasBookings ? 
        ['move_to_tomorrow'] :
        ['move_to_tomorrow', 'cancel_and_leave'],
      recommendation: hasBookings ? 'move_to_tomorrow' : 'cancel_and_leave',
      message: hasBookings ? 
        'You have passengers booked. Trip will move to tomorrow.' :
        'No passengers yet. You can choose to move to tomorrow or cancel.'
    });

  } catch (error) {
    logger.error('Get end of day options error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get end of day options'
    });
  }
};

/**
 * Manual trigger functions for testing
 */
const manualTriggers = {
  triggerEndOfScheduleCleanup: async () => {
    logger.info('🔧 Manual trigger: End of schedule cleanup');
    return await handleEndOfScheduleDay();
  }
};

logger.info('🚀 Cron service initialized with the following jobs:');
logger.info('  - End-of-schedule cleanup: 10:00 PM and 1:00 AM daily');
logger.info('  - Queue validation: Every 30 minutes');
logger.info('  - Health check: Every 5 minutes');
logger.info('  - Weekly statistics: Sunday 11:00 PM');

module.exports = {
  handleEndOfScheduleDay,
  moveDriverToTomorrow,
  moveQueueEntryToTomorrow,
  cancelEmptyTrip,
  moveWaitingDriversToNextDay,
  getNextAvailablePosition,
  getEndOfDayOptions,
  manualTriggers
};
