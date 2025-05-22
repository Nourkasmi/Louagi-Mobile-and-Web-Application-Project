// utils/trip.utils.js

/**
 * Utility to calculate estimated arrival time
 * @param {Date} departureTime - departure time
 * @param {number} estimatedDuration - in minutes
 * @returns {Date}
 */
const calculateArrivalTime = (departureTime, estimatedDuration) => {
  const arrival = new Date(departureTime);
  arrival.setMinutes(arrival.getMinutes() + estimatedDuration);
  return arrival;
};

/**
 * Utility to check available seats
 * @param {number} availableSeats - current available seats
 * @param {number} requestedSeats - requested by passenger
 * @returns {boolean}
 */
const isTripAvailable = (availableSeats, requestedSeats = 1) => {
  return availableSeats >= requestedSeats;
};

/**
 * Utility to calculate price per seat
 * @param {number} basePrice - total trip price
 * @param {number} capacity - number of seats
 * @returns {number}
 */
const calculatePricePerSeat = (basePrice, capacity) => {
  return parseFloat((basePrice / capacity).toFixed(2));
};

module.exports = {
  calculateArrivalTime,
  isTripAvailable,
  calculatePricePerSeat
};
