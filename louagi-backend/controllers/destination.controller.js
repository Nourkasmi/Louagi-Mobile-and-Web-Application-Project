const { Destination, Station } = require('../models');
const { Op } = require('sequelize');
const { validateDestination } = require('../middlewares/validate.middleware');

const destinationController = {
  // Create a new destination
  createDestination: async (req, res) => {
    try {
      const { error } = validateDestination(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const {
        startId, endId, distance,
        basePrice, estimatedDuration,
        description, isActive
      } = req.body;

      // Prevent same start and end station
      if (startId === endId) {
        return res.status(400).json({
          success: false,
          message: 'Start and end stations cannot be the same'
        });
      }

      // Check if both stations exist
      const [startStation, endStation] = await Promise.all([
        Station.findByPk(startId),
        Station.findByPk(endId)
      ]);

      if (!startStation || !endStation) {
        return res.status(404).json({
          success: false,
          message: 'Start or end station not found'
        });
      }

      // Create destination
      const destination = await Destination.create({
        startId,
        endId,
        distance,
        basePrice,
        estimatedDuration,
        description,
        isActive
      });

      return res.status(201).json({ success: true, destination });
    } catch (error) {
      console.error('Create destination error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create destination' });
    }
  },

  // Get all destinations with filtering, search, sorting
  getAllDestinations: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { search, sortBy, order } = req.query;

      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const destinations = await Destination.findAndCountAll({
        where: whereClause,
        include: [
          { model: Station, as: 'startStation', attributes: ['id', 'name', 'city'] },
          { model: Station, as: 'endStation', attributes: ['id', 'name', 'city'] }
        ],
        limit,
        offset,
        order: [[sortBy || 'createdAt', order === 'asc' ? 'ASC' : 'DESC']]
      });

      return res.status(200).json({
        success: true,
        destinations: destinations.rows,
        total: destinations.count,
        totalPages: Math.ceil(destinations.count / limit),
        currentPage: page
      });
    } catch (error) {
      console.error('Get destinations error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve destinations' });
    }
  },

  // Get destination by ID
  getDestinationById: async (req, res) => {
    try {
      const destination = await Destination.findByPk(req.params.id, {
        include: [
          { model: Station, as: 'startStation', attributes: ['id', 'name', 'city'] },
          { model: Station, as: 'endStation', attributes: ['id', 'name', 'city'] }
        ]
      });

      if (!destination) {
        return res.status(404).json({ success: false, message: 'Destination not found' });
      }

      return res.status(200).json({ success: true, destination });
    } catch (error) {
      console.error('Get destination by ID error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve destination' });
    }
  },

  // Update destination
  updateDestination: async (req, res) => {
    try {
      const { error } = validateDestination(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const destination = await Destination.findByPk(req.params.id);
      if (!destination) {
        return res.status(404).json({ success: false, message: 'Destination not found' });
      }

      // Prevent same start and end station
      if (req.body.startId && req.body.startId === req.body.endId) {
        return res.status(400).json({
          success: false,
          message: 'Start and end stations cannot be the same'
        });
      }

      await destination.update(req.body);
      return res.status(200).json({ success: true, destination });
    } catch (error) {
      console.error('Update destination error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update destination' });
    }
  },

  // Delete destination
  deleteDestination: async (req, res) => {
    try {
      const destination = await Destination.findByPk(req.params.id);
      if (!destination) {
        return res.status(404).json({ success: false, message: 'Destination not found' });
      }

      await destination.destroy();
      return res.status(200).json({ success: true, message: 'Destination deleted successfully' });
    } catch (error) {
      console.error('Delete destination error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete destination' });
    }
  }
};

module.exports = destinationController;
