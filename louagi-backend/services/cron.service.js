// services/cron.service.js

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Trip, DriverQueue, Schedule } = require('../models');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Main job:
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
