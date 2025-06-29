const { Trip, Destination, Schedule, Driver, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const { validate: isUUID } = require('uuid');
const generateTripsFromSchedules = require('../utils/trip.generator');
const { sequelize } = require('../models');

/**
 * ✅ ENHANCED: Reindex queue positions after driver removal
 */
async function reindexQueuePositions(stationId, scheduleId, destinationId, transaction) {
  if (!stationId || !scheduleId || !destinationId) {
    console.log('⚠️ Missing queue identifiers, skipping reindex');
    return;
  }

  const waitingDrivers = await DriverQueue.findAll({
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: 'waiting'
    },
    order: [['position', 'ASC']],
    transaction
  });

  for (let i = 0; i < waitingDrivers.length; i++) {
    const newPosition = i + 1;
    if (waitingDrivers[i].position !== newPosition) {
      await waitingDrivers[i].update({ 
        position: newPosition 
      }, { transaction });
    }
  }

  console.log(`✅ Reindexed ${waitingDrivers.length} queue positions`);
}

const tripController = {
  // ✅ Create a new trip (Admin only)
  createTrip: async (req, res) => {
    try {
      const {
        routeId, scheduleId, driverId,
        departureTime, estimatedArrivalTime,
        basePrice, currentPrice, capacity,
        notes, queueId
      } = req.body;

      if (!routeId || !scheduleId || !driverId || !departureTime || !estimatedArrivalTime || !basePrice || !currentPrice) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      if (routeId === '' || driverId === '' || scheduleId === '') {
        return res.status(400).json({ success: false, message: 'Invalid UUID format' });
      }

      const [destination, schedule, driver] = await Promise.all([
        Destination.findByPk(routeId),
        Schedule.findByPk(scheduleId),
        Driver.findByPk(driverId)
      ]);

      if (!destination || !schedule || !driver) {
        return res.status(404).json({ success: false, message: 'Destination, schedule or driver not found' });
      }

      const trip = await Trip.create({
        routeId,
        scheduleId,
        driverId,
        departureTime,
        estimatedArrivalTime,
        basePrice,
        currentPrice,
        capacity: capacity || driver.vehicle_capacity || 4,
        availableSeats: capacity || driver.vehicle_capacity || 4,
        status: 'scheduled',
        notes,
        queueId: queueId || null
      });

      const fullTrip = await Trip.findByPk(trip.id, {
        include: [
          { model: Destination, as: 'route' },
          { model: Schedule, as: 'schedule' },
          { model: Driver, as: 'driver' }
        ]
      });

      return res.status(201).json({ success: true, trip: fullTrip });
    } catch (error) {
      console.error('Create trip error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create trip' });
    }
  },

  // ✅ Get all trips with filters and pagination
  getAllTrips: async (req, res) => {
  try {
    const { page = 1, limit = 10, status, driverId, search, destinationId, routeId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (status) whereClause.status = status;
    if (driverId && isUUID(driverId)) whereClause.driverId = driverId;
    if (destinationId && isUUID(destinationId)) whereClause.routeId = destinationId; // 👈 THIS LINE!
    if (routeId && isUUID(routeId)) whereClause.routeId = routeId; // (optional, if someone sends routeId instead)
    if (search) {
      whereClause[Op.or] = [
        { notes: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Trip.findAndCountAll({
      where: whereClause,
      include: [
        { model: Destination, as: 'route' },
        { model: Schedule, as: 'schedule' },
        { model: Driver, as: 'driver' }
      ],
      offset,
      limit: parseInt(limit),
      order: [['departureTime', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      trips: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get trips error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch trips' });
  }
},


  // ✅ Get trip by ID
  getTripById: async (req, res) => {
    try {
      const { id } = req.params;

      const trip = await Trip.findByPk(id, {
        include: [
          { model: Destination, as: 'route' },
          { model: Schedule, as: 'schedule' },
          { model: Driver, as: 'driver' }
        ]
      });

      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      return res.status(200).json({ success: true, trip });
    } catch (error) {
      console.error('Get trip error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve trip' });
    }
  },

  /**
   * ✅ ENHANCED: Update trip status + remove from queue when starting
   */
  updateTripStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status' 
        });
      }

      // Use transaction for data consistency
      const result = await sequelize.transaction(async (t) => {
        // Find trip with queue entry
        const trip = await Trip.findByPk(id, {
          include: [{ model: DriverQueue, as: 'queueEntry' }],
          transaction: t
        });

        if (!trip) {
          throw new Error('Trip not found');
        }

        // Update trip status
        await trip.update({ status }, { transaction: t });

        // ✅ Remove driver from queue when trip starts (manual or auto)
        if (status === 'in_progress' && trip.queueEntry) {
          console.log(`🚗 Trip started - removing driver from queue`);
          
          const { stationId, scheduleId, destinationId } = trip.queueEntry;
          
          // Remove queue entry
          await trip.queueEntry.destroy({ transaction: t });
          
          // Reindex remaining queue positions  
          await reindexQueuePositions(stationId, scheduleId, destinationId, t);

          console.log(`✅ Driver removed from queue, positions reindexed`);
        }

        // ✅ Also cleanup on cancellation
        if (status === 'cancelled' && trip.queueEntry) {
          console.log(`❌ Trip cancelled - removing driver from queue`);
          
          const { stationId, scheduleId, destinationId } = trip.queueEntry;
          
          await trip.queueEntry.destroy({ transaction: t });
          await reindexQueuePositions(stationId, scheduleId, destinationId, t);
        }

        return trip;
      });

      return res.status(200).json({ 
        success: true, 
        trip: result,
        message: `Trip status updated to ${status}` 
      });

    } catch (error) {
      console.error('Update trip status error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to update trip status' 
      });
    }
  },

  // ✅ Delete trip
  deleteTrip: async (req, res) => {
    try {
      const trip = await Trip.findByPk(req.params.id);
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

      await trip.destroy();
      return res.status(200).json({ success: true, message: 'Trip deleted successfully' });
    } catch (error) {
      console.error('Delete trip error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete trip' });
    }
  },

  // ✅ Generate Trips Based on Active Schedules
  generateTripsFromSchedules: async (req, res) => {
    try {
      const logs = await generateTripsFromSchedules();
      return res.status(200).json({
        success: true,
        message: 'Trip generation process completed',
        logs
      });
    } catch (error) {
      console.error('Generate trips error:', error);
      return res.status(500).json({ success: false, message: 'Failed to generate trips' });
    }
  },

  // ✅ Get all trips assigned to the logged-in driver
getDriverTrips: async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    console.log('[getDriverTrips] Found driver:', driver.id, driver);

    const trips = await Trip.findAll({
      where: { driverId: driver.id },
      include: [
        {
          model: Destination,
          as: 'route',
          include: [
            { model: require('../models').Station, as: 'startStation' },
            { model: require('../models').Station, as: 'endStation' }
          ]
        },
        { model: Schedule, as: 'schedule' }
      ],
      order: [['departureTime', 'DESC']]
    });

    console.log('[getDriverTrips] trips result (count):', trips.length);

        console.dir(trips, { depth: 7 });

    return res.status(200).json({ success: true, trips });
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch trips' });
  }
},

  /**
   * ✅ ENHANCED: Mark a trip as completed by the driver
   */
  completeTrip: async (req, res) => {
    try {
      const tripId = req.params.id;
      const userId = req.user.id;

      const driver = await Driver.findOne({ where: { user_id: userId } });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found' });
      }

      // Use transaction for data consistency
      const result = await sequelize.transaction(async (t) => {
        const trip = await Trip.findOne({ 
          where: { id: tripId, driverId: driver.id },
          include: [{ model: DriverQueue, as: 'queueEntry' }],
          transaction: t
        });

        if (!trip) {
          throw new Error('Trip not found or not assigned to you');
        }

        if (trip.status === 'completed') {
          throw new Error('Trip already completed');
        }

        // Complete the trip
        trip.status = 'completed';
        trip.actualArrivalTime = new Date();
        await trip.save({ transaction: t });

        // Clean up queue entry if still exists (shouldn't happen but safety check)
        if (trip.queueEntry) {
          console.log(`🧹 Cleaning up remaining queue entry for completed trip`);
          await trip.queueEntry.destroy({ transaction: t });
        }

        return trip;
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Trip marked as completed', 
        trip: result 
      });

    } catch (error) {
      console.error('Complete trip error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to complete trip' 
      });
    }
  }
};

module.exports = tripController;