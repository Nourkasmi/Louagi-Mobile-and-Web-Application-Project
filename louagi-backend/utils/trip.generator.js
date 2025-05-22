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
    // 2. Check if current time is within the time slot
    const start = schedule.startTime.slice(0, 5);
    const end = schedule.endTime.slice(0, 5);

    if (currentTime < start || currentTime > end) {
      logs.push(`⏱️ Outside schedule window for station ${schedule.stationId}`);
      continue;
    }

    // 3. Check if a trip already exists for this station/schedule/departureTime
    const existingTrip = await Trip.findOne({
      where: {
        scheduleId: schedule.id,
        departureTime: {
          [Op.between]: [
            new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0),
            new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59)
          ]
        }
      }
    });

    if (existingTrip) {
      logs.push(`❌ Trip already exists for schedule ${schedule.id}`);
      continue;
    }

    // 4. Find the first available driver in queue
    const driverQueueEntry = await DriverQueue.findOne({
      where: {
        scheduleId: schedule.id,
        stationId: schedule.stationId,
        status: 'waiting'
      },
      order: [['position', 'ASC']]
    });

    if (!driverQueueEntry) {
      logs.push(`🚫 No driver available for station ${schedule.stationId}`);
      continue;
    }

    const driver = await Driver.findByPk(driverQueueEntry.driverId);
    const destination = await Destination.findOne(); // Temporary static destination
    if (!destination) {
      logs.push('⚠️ No destination found (assigning skipped)');
      continue;
    }

    const departureTime = new Date();
    const estimatedDuration = 60; // 1 hour default
    const estimatedArrivalTime = new Date(departureTime.getTime() + estimatedDuration * 60000);
    const price = 10.00;

    // 5. Create the trip
    const trip = await Trip.create({
      id: uuidv4(),
      routeId: destination.id,
      scheduleId: schedule.id,
      driverId: driver.id,
      queueId: driverQueueEntry.id,
      departureTime,
      estimatedArrivalTime,
      basePrice: price,
      currentPrice: price,
      capacity: driver.vehicle_capacity || 4,
      availableSeats: driver.vehicle_capacity || 4,
      status: 'scheduled',
      notes: 'Auto-generated'
    });

    // 6. Update the driver queue entry status
    await driverQueueEntry.update({ status: 'called' });

    logs.push(`✅ Trip created for driver ${driver.id} from queue ${driverQueueEntry.id}`);
  }

  return logs;
};

module.exports = generateTripsFromSchedules;
