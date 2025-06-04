const cron = require('node-cron');
const { Op } = require('sequelize');
const { Trip, DriverQueue, Schedule } = require('../models');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * ✅ EXISTING: Nightly requeue job (runs at 1:00 AM)
 * Reassign drivers whose trips were never completed to today's queue using the same station/destination.
 */
cron.schedule('1 0 * * *', async () => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayDayOfWeek = now.getDay();

    logger.info('🚦 Running nightly requeue cron job...');

    // 1. Find all trips from yesterday that are not completed
    const unfinishedTrips = await Trip.findAll({
      where: {
        status: {
          [Op.notIn]: ['completed', 'cancelled'],
        },
        departureTime: {
          [Op.gte]: yesterday,
          [Op.lt]: now,
        },
      },
      include: ['driver', 'schedule', 'route'],
    });

    logger.info(`Found ${unfinishedTrips.length} unfinished trips.`);

    for (const trip of unfinishedTrips) {
      const { driverId, routeId, schedule, queueId } = trip;
      const { stationId } = schedule;

      // 2. Find today's matching schedule
      const todaySchedule = await Schedule.findOne({
        where: {
          stationId,
          dayOfWeek: todayDayOfWeek,
          isActive: true,
        },
      });

      if (!todaySchedule) {
        logger.warn(`No active schedule found for station ${stationId} today.`);
        continue;
      }

      // 3. Check if driver is already in today's queue
      const existingQueue = await DriverQueue.findOne({
        where: {
          driverId,
          stationId,
          destinationId: routeId,
          scheduleId: todaySchedule.id,
        },
      });

      if (existingQueue) {
        logger.info(`Driver ${driverId} is already in today's queue.`);
        continue;
      }

      // 4. Find current max position in queue
      const maxPosition = await DriverQueue.max('position', {
        where: {
          stationId,
          destinationId: routeId,
          scheduleId: todaySchedule.id,
        },
      });

      const position = (isNaN(maxPosition) ? 0 : maxPosition) + 1;

      // 5. Add driver to today's queue
      await DriverQueue.create({
        id: uuidv4(),
        driverId,
        stationId,
        destinationId: routeId,
        scheduleId: todaySchedule.id,
        position,
        status: 'waiting',
      });

      logger.info(`Requeued driver ${driverId} for station ${stationId} and destination ${routeId} at position ${position}`);
    }

    logger.info('✅ Nightly requeue cron job completed successfully.');
  } catch (error) {
    logger.error('❌ Error in nightly requeue cron job:', error);
  }
});

/**
 * ✅ NEW: Schedule end cleanup (runs at 6:00 PM daily)
 * Move waiting drivers to tomorrow's schedules when current schedule ends
 */
cron.schedule('0 18 * * *', async () => {
  try {
    logger.info('🕕 Running schedule end cleanup...');
    
    // Move waiting drivers to tomorrow's schedules
    await moveWaitingDriversToNextDay();
    
    logger.info('✅ Schedule end cleanup completed.');
  } catch (error) {
    logger.error('❌ Error in schedule end cleanup:', error);
  }
});

/**
 * ✅ NEW: Peak hour trip generation (runs every 10 minutes during peak hours)
 * Automatically create trips during rush hours to handle high demand
 */
cron.schedule('*/10 7-9,17-19 * * *', async () => {
  try {
    logger.info('🚀 Running peak hour trip generation...');
    
    const { processAllQueuesForAutoTrips } = require('../utils/queue.utils');
    const results = await processAllQueuesForAutoTrips();
    
    if (results.length > 0) {
      logger.info(`✅ Created ${results.length} trips during peak hour`);
    } else {
      logger.info('⏳ No trips created - conditions not met');
    }
  } catch (error) {
    logger.error('❌ Error in peak hour trip generation:', error);
  }
});

/**
 * ✅ NEW: Stale trip cleanup (runs every hour)
 * Clean up trips that are stuck in scheduled status past their departure time
 */
cron.schedule('0 * * * *', async () => {
  try {
    logger.info('🧹 Running stale trip cleanup...');
    
    const now = new Date();
    const staleTrips = await Trip.findAll({
      where: {
        status: 'scheduled',
        departureTime: {
          [Op.lt]: new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago
        }
      },
      include: ['queueEntry']
    });

    for (const trip of staleTrips) {
      logger.warn(`Cleaning up stale trip: ${trip.id}`);
      
      // Update trip to cancelled
      await trip.update({ 
        status: 'cancelled',
        notes: (trip.notes || '') + ' - Auto-cancelled (stale)'
      });

      // Remove from queue if exists
      if (trip.queueEntry) {
        await trip.queueEntry.destroy();
        logger.info(`Removed stale queue entry for trip ${trip.id}`);
      }
    }

    if (staleTrips.length > 0) {
      logger.info(`✅ Cleaned up ${staleTrips.length} stale trips`);
    }
  } catch (error) {
    logger.error('❌ Error in stale trip cleanup:', error);
  }
});

/**
 * ✅ NEW: Queue position validation (runs every 30 minutes)
 * Ensure queue positions are properly ordered and fix any gaps
 */
cron.schedule('*/30 * * * *', async () => {
  try {
    logger.info('🔧 Running queue position validation...');
    
    // Get all unique queue combinations
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

      // Check if positions are sequential (1, 2, 3, ...)
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
 * ✅ NEW: Move waiting drivers to next day
 */
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
        // ✅ Move to tomorrow's schedule
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
        // ❌ Remove from queue if no tomorrow schedule
        await driver.destroy();
        removedCount++;
        logger.info(`Removed driver ${driver.driverId} - no tomorrow schedule available`);
      }
    } catch (error) {
      logger.error(`Error processing driver ${driver.driverId}:`, error);
    }
  }

  logger.info(`✅ Schedule cleanup: ${movedCount} drivers moved, ${removedCount} drivers removed`);
};

/**
 * ✅ HELPER: Get next available position for tomorrow's queue
 */
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

/**
 * ✅ NEW: Health check for system components (runs every 5 minutes)
 * Monitor system health and log any issues
 */
cron.schedule('*/5 * * * *', async () => {
  try {
    // Check database connectivity
    const { sequelize } = require('../models');
    await sequelize.authenticate();

    // Count active components
    const [
      activeTrips,
      waitingDrivers,
      todayBookings,
      activeSchedules
    ] = await Promise.all([
      Trip.count({ where: { status: { [Op.in]: ['scheduled', 'in_progress'] } } }),
      DriverQueue.count({ where: { status: 'waiting' } }),
      require('../models').Booking.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Schedule.count({ where: { isActive: true } })
    ]);

    // Log system health (every hour only to avoid spam)
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

    // Alert if no active schedules
    if (activeSchedules === 0) {
      logger.warn('⚠️ No active schedules found!');
    }

    // Alert if too many waiting drivers (potential issue)
    if (waitingDrivers > 50) {
      logger.warn(`⚠️ High number of waiting drivers: ${waitingDrivers}`);
    }

  } catch (error) {
    logger.error('❌ Health check failed:', error);
  }
});

/**
 * ✅ NEW: Weekly statistics report (runs every Sunday at 23:00)
 * Generate and log weekly performance statistics
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
      require('../models').Booking.count({
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
      require('../models').Booking.sum('amount', {
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

/**
 * ✅ EXPORT: Manual trigger functions for testing
 */
const manualTriggers = {
  triggerNightlyRequeue: async () => {
    logger.info('🔧 Manual trigger: Nightly requeue');
    // Trigger the nightly requeue logic manually
    return await moveWaitingDriversToNextDay();
  },
  
  triggerPeakHourGeneration: async () => {
    logger.info('🔧 Manual trigger: Peak hour generation');
    const { processAllQueuesForAutoTrips } = require('../utils/queue.utils');
    return await processAllQueuesForAutoTrips();
  },
  
  triggerStaleCleanup: async () => {
    logger.info('🔧 Manual trigger: Stale cleanup');
    const now = new Date();
    const staleTrips = await Trip.findAll({
      where: {
        status: 'scheduled',
        departureTime: { [Op.lt]: new Date(now.getTime() - 30 * 60 * 1000) }
      }
    });
    
    for (const trip of staleTrips) {
      await trip.update({ 
        status: 'cancelled',
        notes: (trip.notes || '') + ' - Manual cleanup'
      });
    }
    
    return `Cleaned up ${staleTrips.length} stale trips`;
  }
};

// ✅ Log cron service initialization
logger.info('🚀 Cron service initialized with the following jobs:');
logger.info('  - Nightly requeue: 1:00 AM daily');
logger.info('  - Schedule end cleanup: 6:00 PM daily'); 
logger.info('  - Peak hour generation: Every 10 minutes during 7-9 AM, 5-7 PM');
logger.info('  - Stale trip cleanup: Every hour');
logger.info('  - Queue validation: Every 30 minutes');
logger.info('  - Health check: Every 5 minutes');
logger.info('  - Weekly statistics: Sunday 11:00 PM');

module.exports = {
  moveWaitingDriversToNextDay,
  getNextAvailablePosition,
  manualTriggers
};