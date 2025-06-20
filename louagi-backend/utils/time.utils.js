/**
 * Time calculation utilities for trip scheduling
 */

/**
 * Calculate trip departure and arrival times based on queue position and schedule
 * @param {Object} schedule - Schedule object with startTime, endTime
 * @param {number} queuePosition - Driver's position in queue (1, 2, 3...)
 * @param {Object} destination - Destination object with estimatedDuration
 * @param {Date} currentTime - Current time (optional, defaults to now)
 * @returns {Object} Calculated times and metadata
 */
const calculateTripTimes = (schedule, queuePosition, destination, currentTime = new Date()) => {
  const now = currentTime;
  
  // Parse schedule times (format: "HH:MM")
  const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
  
  // Create schedule boundaries for today
  const scheduleStart = new Date();
  scheduleStart.setHours(startHour, startMinute, 0, 0);
  
  const scheduleEnd = new Date();
  scheduleEnd.setHours(endHour, endMinute, 0, 0);
  
  // Determine base departure time
  let baseDepartureTime;
  let scheduleStatus;
  
  if (now < scheduleStart) {
    // Schedule hasn't started yet - use schedule start time
    baseDepartureTime = new Date(scheduleStart);
    scheduleStatus = 'future';
  } else if (now > scheduleEnd) {
    // Schedule ended - use next day's schedule start
    baseDepartureTime = new Date(scheduleStart);
    baseDepartureTime.setDate(baseDepartureTime.getDate() + 1);
    scheduleStatus = 'next_day';
  } else {
    // Schedule is active - use current time + small buffer
    baseDepartureTime = new Date(now.getTime() + (5 * 60 * 1000)); // 5 minute buffer
    scheduleStatus = 'active';
  }
  
  // Calculate departure based on queue position
  const MINUTES_PER_POSITION = 15; // Each driver waits 15 minutes (configurable)
  const queueDelayMs = (queuePosition - 1) * MINUTES_PER_POSITION * 60 * 1000;
  const departureTime = new Date(baseDepartureTime.getTime() + queueDelayMs);
  
  // Calculate arrival time based on route duration
  const estimatedArrivalTime = new Date(
    departureTime.getTime() + (destination.estimatedDuration * 60 * 1000)
  );
  
  // Calculate delays and metadata
  const queueDelayMinutes = (queuePosition - 1) * MINUTES_PER_POSITION;
  const totalDelayFromNow = Math.max(0, Math.round((departureTime - now) / (1000 * 60)));
  
  return {
    departureTime,
    estimatedArrivalTime,
    queueDelayMinutes,
    totalDelayFromNow,
    scheduleStatus,
    isScheduleActive: scheduleStatus === 'active',
    baseDepartureTime,
    minutesPerPosition: MINUTES_PER_POSITION
  };
};

/**
 * Format time for display
 * @param {Date} time - Time to format
 * @returns {Object} Formatted time strings
 */
const formatTripTime = (time) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const isToday = time.toDateString() === today.toDateString();
  const isTomorrow = time.toDateString() === tomorrow.toDateString();
  
  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  let dayString;
  if (isToday) {
    dayString = 'Today';
  } else if (isTomorrow) {
    dayString = 'Tomorrow';
  } else {
    dayString = time.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  return {
    time: timeString,
    day: dayString,
    full: `${dayString} at ${timeString}`,
    iso: time.toISOString()
  };
};

/**
 * Calculate trip duration in readable format
 * @param {Date} departureTime 
 * @param {Date} arrivalTime 
 * @returns {Object} Duration breakdown
 */
const calculateDuration = (departureTime, arrivalTime) => {
  const durationMs = arrivalTime - departureTime;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let readable;
  if (hours > 0) {
    readable = `${hours}h ${minutes}m`;
  } else {
    readable = `${minutes}m`;
  }
  
  return {
    hours,
    minutes,
    totalMinutes: Math.round(durationMs / (1000 * 60)),
    readable
  };
};

module.exports = {
  calculateTripTimes,
  formatTripTime,
  calculateDuration
};