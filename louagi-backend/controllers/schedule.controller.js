const { Schedule, Station } = require('../models');
const { Op } = require('sequelize');
const { validateSchedule } = require('../middlewares/validate.middleware');
const { hasScheduleConflict } = require('../utils/schedule.utils');

const scheduleController = {
  // Create schedule
  createSchedule: async (req, res) => {
    try {
      const { error } = validateSchedule(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const { stationId, dayOfWeek, startTime, endTime, maxTrips, isActive, notes } = req.body;

      const station = await Station.findByPk(stationId);
      if (!station) {
        return res.status(404).json({ success: false, message: 'Station not found' });
      }

      const existingSchedules = await Schedule.findAll({ where: { stationId } });
      const conflict = hasScheduleConflict(existingSchedules, { dayOfWeek, startTime, endTime });

      if (conflict) {
        return res.status(409).json({ success: false, message: 'Schedule overlaps with existing one' });
      }

      const schedule = await Schedule.create({ stationId, dayOfWeek, startTime, endTime, maxTrips, isActive, notes });
      return res.status(201).json({ success: true, schedule });
    } catch (error) {
      console.error('Create schedule error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create schedule' });
    }
  },

  // Get all schedules
  getAllSchedules: async (req, res) => {
    try {
      const schedules = await Schedule.findAll({ include: [{ model: Station, as: 'station', attributes: ['name', 'city'] }] });
      return res.status(200).json({ success: true, schedules });
    } catch (error) {
      console.error('Get all schedules error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
    }
  },

  // Get schedule by ID
  getScheduleById: async (req, res) => {
    try {
      const schedule = await Schedule.findByPk(req.params.id);
      if (!schedule) {
        return res.status(404).json({ success: false, message: 'Schedule not found' });
      }
      return res.status(200).json({ success: true, schedule });
    } catch (error) {
      console.error('Get schedule error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
    }
  },

  // Update schedule
  updateSchedule: async (req, res) => {
    try {
      const schedule = await Schedule.findByPk(req.params.id);
      if (!schedule) {
        return res.status(404).json({ success: false, message: 'Schedule not found' });
      }

      const { error } = validateSchedule(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const existingSchedules = await Schedule.findAll({
        where: {
          stationId: schedule.stationId,
          id: { [Op.ne]: schedule.id }
        }
      });

      const conflict = hasScheduleConflict(existingSchedules, {
        dayOfWeek: req.body.dayOfWeek,
        startTime: req.body.startTime,
        endTime: req.body.endTime
      });

      if (conflict) {
        return res.status(409).json({ success: false, message: 'Updated schedule conflicts with existing one' });
      }

      await schedule.update(req.body);
      return res.status(200).json({ success: true, schedule });
    } catch (error) {
      console.error('Update schedule error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update schedule' });
    }
  },

  // Delete schedule
  deleteSchedule: async (req, res) => {
    try {
      const schedule = await Schedule.findByPk(req.params.id);
      if (!schedule) {
        return res.status(404).json({ success: false, message: 'Schedule not found' });
      }
      await schedule.destroy();
      return res.status(200).json({ success: true, message: 'Schedule deleted' });
    } catch (error) {
      console.error('Delete schedule error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete schedule' });
    }
  }
};

module.exports = scheduleController;
 