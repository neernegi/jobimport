const { Queue } = require('bullmq');
const { redisConfig } = require('../config/redis');

const QUEUE_NAME = process.env.QUEUE_NAME || 'job_import_queue';

const queue = new Queue(QUEUE_NAME, {
  connection: {
    ...redisConfig,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
});

async function enqueueJobs(feedUrl, jobItems = []) {
  const batchSize = Number(process.env.BATCH_SIZE || 50);
  for (let i = 0; i < jobItems.length; i += batchSize) {
    const batch = jobItems.slice(i, i + batchSize);
    await queue.add('import-batch', { feedUrl, jobs: batch }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }
}

module.exports = { queue, enqueueJobs };
