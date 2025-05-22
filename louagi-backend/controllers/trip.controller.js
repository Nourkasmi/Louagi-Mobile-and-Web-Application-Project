const { Trip, Destination, Schedule, Driver, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const { validate: isUUID } = require('uuid');

const tripController = {
  // ✅ Create a new trip
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

      return res.status(201).json({ success: true, trip });
    } catch (error) {
      console.error('Create trip error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create trip' });
    }
  },

  // ✅ Get all trips with filters and pagination
  getAllTrips: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, driverId, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};

      if (status) whereClause.status = status;
      if (driverId && isUUID(driverId)) whereClause.driverId = driverId;
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

  // ✅ Update trip status
  updateTripStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const trip = await Trip.findByPk(id);
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

      await trip.update({ status });
      return res.status(200).json({ success: true, trip });
    } catch (error) {
      console.error('Update trip status error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update trip status' });
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
  }
};

module.exports = tripController;
