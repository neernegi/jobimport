const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

const redisClient = new Redis(redisConfig);
redisClient.on('error', (err) => {
  console.error('ioredis client error', err);
});

module.exports = { redisConfig, redisClient };
