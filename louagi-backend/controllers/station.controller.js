const { Station } = require('../models');
const { Op } = require('sequelize');
const { validateStation } = require('../middlewares/validate.middleware');

const stationController = {
  // Create a new station
  createStation: async (req, res) => {
    try {
      const { error } = validateStation(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const station = await Station.create(req.body);

      return res.status(201).json({ success: true, station });
    } catch (error) {
      console.error('Create station error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create station' });
    }
  },

  // Get all stations with filtering, search, and pagination
  getAllStations: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { city, search } = req.query;

      const whereClause = {};

      if (city) {
        whereClause.city = { [Op.iLike]: `%${city}%` };
      }
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          { city: { [Op.iLike]: `%${search}%` } }
        ];
      }


      const { count, rows } = await Station.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        stations: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    } catch (error) {
      console.error('Get stations error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve stations' });
    }
  },

  // Get station by ID
  getStationById: async (req, res) => {
    try {
      const station = await Station.findByPk(req.params.id);
      if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
      return res.status(200).json({ success: true, station });
    } catch (error) {
      console.error('Get station by ID error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve station' });
    }
  },

  // Update station
  updateStation: async (req, res) => {
    try {
      const { error } = validateStation(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { id } = req.params;
      const station = await Station.findByPk(id);
      if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

      await station.update(req.body);
      return res.status(200).json({ success: true, station });
    } catch (error) {
      console.error('Update station error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update station' });
    }
  },

  // Delete station
  deleteStation: async (req, res) => {
    try {
      const station = await Station.findByPk(req.params.id);
      if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

      await station.destroy();
      return res.status(200).json({ success: true, message: 'Station deleted successfully' });
    } catch (error) {
      console.error('Delete station error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete station' });
    }
  }
};

module.exports = stationController;
