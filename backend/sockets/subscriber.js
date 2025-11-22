const Redis = require('ioredis');
const { redisConfig } = require('../config/redis');

async function startSubscriber(io) {
  const pubClient = new Redis({ ...redisConfig, maxRetriesPerRequest: null, enableReadyCheck: false });
  const subClient = new Redis({ ...redisConfig, maxRetriesPerRequest: null, enableReadyCheck: false });

  const { createAdapter } = require('@socket.io/redis-adapter');
  io.adapter(createAdapter(pubClient, subClient));

  const eventsSub = new Redis({ ...redisConfig, maxRetriesPerRequest: null, enableReadyCheck: false });
  const channel = process.env.IMPORT_EVENTS_CHANNEL || 'import-events';
  await eventsSub.subscribe(channel);
  console.log(`Subscribed to Redis channel "${channel}"`);

  eventsSub.on('message', (ch, message) => {
    if (ch !== channel) return;
    try {
      const payload = JSON.parse(message);
      const { event, data } = payload;
      io.emit(event, data);
    } catch (err) {
      console.error('Error parsing pubsub message', err);
    }
  });
}

module.exports = { startSubscriber };
