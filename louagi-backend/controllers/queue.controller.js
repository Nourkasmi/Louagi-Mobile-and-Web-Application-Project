const { DriverQueue, Destination, Sequelize } = require('../models');
const { isDriverEligible, estimateDepartureTime } = require('../utils/queue.utils');
const { v4: uuidv4 } = require('uuid');

//  DRIVER: Declare availability
const declareAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stationId, scheduleId, destinationId } = req.body;

    if (!stationId || !scheduleId || !destinationId) {
      return res.status(400).json({ message: 'Missing stationId, scheduleId or destinationId' });
    }

    //  Get the driver ID from the user ID (same fix for consistency)
    const { Driver } = require('../models');
    const driver = await Driver.findOne({ where: { user_id: userId } });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    const driverId = driver.id;

    const { eligible } = await isDriverEligible(driverId, stationId);
    if (!eligible) {
      return res.status(403).json({
        message: 'No more trips can be scheduled today or your last trip is not completed'
      });
    }

    const existingQueue = await DriverQueue.findAll({
      where: { scheduleId, stationId, destinationId },
      order: [['position', 'DESC']]
    });

    const nextPosition = existingQueue.length > 0 ? existingQueue[0].position + 1 : 1;

    const newQueueEntry = await DriverQueue.create({
      id: uuidv4(),
      driverId,
      stationId,
      destinationId,
      scheduleId,
      position: nextPosition,
      status: 'waiting'
    });

    const estimatedTime = estimateDepartureTime(stationId, destinationId, nextPosition);

    return res.status(201).json({
      success: true,
      message: 'Driver added to queue',
      queueEntry: {
        id: newQueueEntry.id,
        position: nextPosition,
        estimatedDepartureTime: estimatedTime
      }
    });
  } catch (error) {
    console.error('Declare availability error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DRIVER LEAVES QUEUE (cancel availability)
const leaveQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(` User ${userId} attempting to leave queue...`);

    //  Get the driver ID from the user ID
    const { Driver } = require('../models');
    const driver = await Driver.findOne({ where: { user_id: userId } });
    
    if (!driver) {
      console.log(` No driver profile found for user ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Driver profile not found.' 
      });
    }

    const driverId = driver.id;
    console.log(` Found driver ${driverId} for user ${userId}`);

    //  Find the driver's current queue entry using the correct driver ID
    const entry = await DriverQueue.findOne({ 
      where: { 
        driverId: driverId,
        status: { [Sequelize.Op.in]: ['waiting', 'assigned', 'called'] } 
      } 
    });

    if (!entry) {
      console.log(` Driver ${driverId} not found in any queue`);
      return res.status(404).json({ 
        success: false, 
        message: 'You are not in a queue.' 
      });
    }

    console.log(` Found queue entry: ${entry.id} with status: ${entry.status}`);

    const { scheduleId, stationId, destinationId } = entry;

    // 🔧 ENHANCED: If driver has an assigned trip, we need to handle it
    if (entry.status === 'assigned') {
      console.log(` Driver has assigned trip, checking for active trip...`);
      
      // Find and cancel the associated trip if it's still scheduled
      const { Trip } = require('../models');
      const associatedTrip = await Trip.findOne({
        where: { 
          queueId: entry.id,
          driverId: driverId,  // Use driver.id, not req.user.id
          status: { [Sequelize.Op.in]: ['scheduled'] }  // Only cancel if still scheduled
        }
      });

      if (associatedTrip) {
        console.log(` Found scheduled trip ${associatedTrip.id}, checking for passengers...`);
        
        // Check if trip has passengers booked
        const bookedSeats = associatedTrip.capacity - associatedTrip.availableSeats;
        
        if (bookedSeats > 0) {
          console.log(` Cannot leave queue - trip has ${bookedSeats} passengers booked`);
          return res.status(400).json({ 
            success: false, 
            message: `Cannot leave queue. Your trip has ${bookedSeats} passenger${bookedSeats > 1 ? 's' : ''} booked. Please complete or cancel the trip first.`
          });
        }

        // Trip has no passengers, safe to cancel
        console.log(` Trip has no passengers, cancelling trip ${associatedTrip.id}...`);
        await associatedTrip.update({ status: 'cancelled' });
        console.log(` Trip ${associatedTrip.id} cancelled successfully`);
      }
    }

    // Remove from queue
    console.log(` Removing driver from queue entry ${entry.id}...`);
    await entry.destroy();

    // Re-index queue positions for others in the same queue
    console.log(` Re-indexing queue positions for station ${stationId}, destination ${destinationId}...`);
    await reindexQueue(scheduleId, stationId, destinationId);

    console.log(` Driver ${driverId} successfully left the queue`);
    return res.status(200).json({ 
      success: true, 
      left: true, 
      message: 'You have left the queue successfully.' 
    });

  } catch (error) {
    console.error(' Leave queue error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to leave queue. Please try again.' 
    });
  }
};

//  ADMIN: View queue by station, schedule, destination
const getQueueByStationSchedule = async (req, res) => {
  try {
    const { stationId, scheduleId, destinationId } = req.query;
    if (!stationId || !scheduleId || !destinationId) {
      return res.status(400).json({ message: 'Missing stationId, scheduleId or destinationId' });
    }

    const queue = await DriverQueue.findAll({
      where: { stationId, scheduleId, destinationId },
      order: [['position', 'ASC']]
    });

    return res.status(200).json({ success: true, queue });
  } catch (error) {
    console.error('Get queue error:', error);
    return res.status(500).json({ message: 'Failed to fetch queue' });
  }
};

//  ADMIN: Get all queues in a station
const getAllQueuesByStation = async (req, res) => {
  try {
    const { stationId } = req.query;
    if (!stationId) {
      return res.status(400).json({ message: 'Missing stationId' });
    }

    const queues = await DriverQueue.findAll({
      where: { stationId },
      order: [['destinationId', 'ASC'], ['position', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      stationId,
      queues
    });
  } catch (error) {
    console.error('Get all queues error:', error);
    return res.status(500).json({ message: 'Failed to fetch queues' });
  }
};

//  ADMIN: Update queue position or status
const updateQueueEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, status } = req.body;

    const queueEntry = await DriverQueue.findByPk(id);
    if (!queueEntry) return res.status(404).json({ message: 'Queue entry not found' });

    if (position !== undefined) queueEntry.position = position;
    if (status !== undefined) queueEntry.status = status;

    await queueEntry.save();

    await reindexQueue(queueEntry.scheduleId, queueEntry.stationId, queueEntry.destinationId);

    return res.status(200).json({ success: true, queueEntry });
  } catch (error) {
    console.error('Update queue error:', error);
    return res.status(500).json({ message: 'Failed to update queue entry' });
  }
};

//  INTERNAL: Reindex positions in a queue
const reindexQueue = async (scheduleId, stationId, destinationId) => {
  const queue = await DriverQueue.findAll({
    where: {
      scheduleId,
      stationId,
      destinationId,
      status: 'waiting'
    },
    order: [['position', 'ASC']]
  });

  for (let i = 0; i < queue.length; i++) {
    queue[i].position = i + 1;
    await queue[i].save();
  }
};

//  ADMIN: Count queues per station
const countQueuesByStation = async (req, res) => {
  try {
    const { stationId } = req.query;
    if (!stationId) {
      return res.status(400).json({ message: 'Missing stationId' });
    }

    const results = await DriverQueue.findAll({
      attributes: [
        'destinationId',
        [Sequelize.fn('COUNT', Sequelize.col('DriverQueue.id')), 'count']
      ],
      where: { stationId },
      include: [
        {
          model: Destination,
          as: 'destination',
          attributes: ['id', 'description']
        }
      ],
      group: ['DriverQueue.destinationId', 'destination.id', 'destination.description'],
      raw: true,
      nest: true
    });

    return res.status(200).json({
      success: true,
      stationId,
      totalQueues: results.length,
      queues: results.map(r => ({
        destinationId: r.destinationId,
        description: r.destination.description,
        count: parseInt(r.count)
      }))
    });
  } catch (error) {
    console.error('Queue count error:', error);
    return res.status(500).json({ message: 'Failed to count queues' });
  }
};

module.exports = {
  declareAvailability,
  leaveQueue,
  getQueueByStationSchedule,
  updateQueueEntry,
  reindexQueue,
  countQueuesByStation,
  getAllQueuesByStation
};