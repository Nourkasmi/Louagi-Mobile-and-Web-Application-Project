const { Schedule, DriverQueue, Trip, Driver, Destination } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const generateTripsFromSchedules = async () => {
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.toTimeString().slice(0, 5); // Format "HH:MM"

  const logs = [];

  // 1. Fetch today's active schedules
  const schedules = await Schedule.findAll({
    where: {
      dayOfWeek: today,
      isActive: true
    }
  });

  for (const schedule of schedules) {
    const stationId = schedule.stationId;

    // 2. Check if current time is within schedule time slot
    const start = schedule.startTime.slice(0, 5);
    const end = schedule.endTime.slice(0, 5);
    if (currentTime < start || currentTime > end) {
      logs.push(`⏱️ Outside schedule window for station ${stationId}`);
      continue;
    }

    // 3. Get all destinations from this station
    const destinations = await Destination.findAll({
      where: {
        startId: stationId,
        isActive: true
      }
    });

    if (!destinations.length) {
      logs.push(`⚠️ No destinations found for station ${stationId}`);
      continue;
    }

    for (const destination of destinations) {
      const destinationId = destination.id;

      // 4. Check if a trip already exists this hour for this station/schedule/destination
      const existingTrip = await Trip.findOne({
        where: {
          scheduleId: schedule.id,
          routeId: destinationId,
          departureTime: {
            [Op.between]: [
              new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0),
              new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59)
            ]
          }
        }
      });

      if (existingTrip) {
        logs.push(`❌ Trip already exists for station ${stationId} and destination ${destinationId}`);
        continue;
      }

      // 5. Get first available driver in (station, destination, schedule) queue
      const driverQueueEntry = await DriverQueue.findOne({
        where: {
          scheduleId: schedule.id,
          stationId,
          destinationId,
          status: 'waiting'
        },
        order: [['position', 'ASC']]
      });

      if (!driverQueueEntry) {
        logs.push(`🚫 No drivers waiting for station ${stationId} ➜ destination ${destinationId}`);
        continue;
      }

      const driver = await Driver.findByPk(driverQueueEntry.driverId);
      if (!driver) {
        logs.push(`⚠️ Driver not found: ${driverQueueEntry.driverId}`);
        continue;
      }

      // 6. Create trip
      const departureTime = new Date();
      const estimatedDuration = destination.estimatedDuration || 60;
      const estimatedArrivalTime = new Date(departureTime.getTime() + estimatedDuration * 60000);
      const price = parseFloat(destination.basePrice) || 10.00;

      const trip = await Trip.create({
        id: uuidv4(),
        routeId: destinationId,
        scheduleId: schedule.id,
        driverId: driver.id,
        queueId: driverQueueEntry.id,
        departureTime,
        estimatedArrivalTime,
        basePrice: price,
        currentPrice: parseFloat((price * 1.2).toFixed(2)),
        capacity: driver.vehicle_capacity || 4,
        availableSeats: driver.vehicle_capacity || 4,
        status: 'scheduled',
        notes: 'Auto-generated'
      });

      // 7. Mark driver as called/assigned
      await driverQueueEntry.update({ status: 'assigned' });

      logs.push(`✅ Trip generated: driver ${driver.id} | ${stationId} ➜ ${destinationId}`);
    }
  }

  return logs;
};

module.exports = generateTripsFromSchedules;
