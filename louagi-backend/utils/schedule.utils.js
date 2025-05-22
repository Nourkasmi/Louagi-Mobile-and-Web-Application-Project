const moment = require('moment');

/**
 * Check if two time ranges overlap (HH:mm format)
 * @param {string} start1 - Start time of range 1
 * @param {string} end1 - End time of range 1
 * @param {string} start2 - Start time of range 2
 * @param {string} end2 - End time of range 2
 * @returns {boolean}
 */
const isTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = moment(start1, 'HH:mm');
  const e1 = moment(end1, 'HH:mm');
  const s2 = moment(start2, 'HH:mm');
  const e2 = moment(end2, 'HH:mm');

  return s1.isBefore(e2) && s2.isBefore(e1);
};

/**
 * Detect schedule conflicts within same station and dayOfWeek
 * @param {Array} existingSchedules - List of existing schedules
 * @param {Object} newSchedule - { startTime, endTime, dayOfWeek }
 * @returns {boolean} - true if conflict exists
 */
const hasScheduleConflict = (existingSchedules, newSchedule) => {
  return existingSchedules.some((s) => {
    return (
      s.dayOfWeek === newSchedule.dayOfWeek &&
      isTimeOverlap(s.startTime, s.endTime, newSchedule.startTime, newSchedule.endTime)
    );
  });
};

module.exports = {
  isTimeOverlap,
  hasScheduleConflict
};
