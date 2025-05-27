const { DriverQueue, Destination, Sequelize } = require('../models');
const { isDriverEligible, estimateDepartureTime } = require('../utils/queue.utils');
const { v4: uuidv4 } = require('uuid');

// ✅ DRIVER: Declare availability
const declareAvailability = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { stationId, scheduleId, destinationId } = req.body;

    if (!stationId || !scheduleId || !destinationId) {
      return res.status(400).json({ message: 'Missing stationId, scheduleId or destinationId' });
    }

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

// ✅ ADMIN: View queue by station, schedule and destination
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


// ✅ ADMIN: Update queue position or status
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

// ✅ INTERNAL: Reindex positions in a queue
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

// ✅ ADMIN: Count how many queues a station has (by destination)
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
  getQueueByStationSchedule,
  updateQueueEntry,
  reindexQueue,
  countQueuesByStation,
  getAllQueuesByStation
};
