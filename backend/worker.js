require('./config/env');
const { connect } = require('./config/mongo');
const { redisConfig, redisClient } = require('./config/redis');
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { processBatch } = require('./jobs/processors/jobProcessor');

const QUEUE_NAME = process.env.QUEUE_NAME || 'job_import_queue';
const IMPORT_CHANNEL = process.env.IMPORT_EVENTS_CHANNEL || 'import-events';

async function startWorker() {
  await connect(process.env.MONGO_URI);
  console.log('Worker connected to MongoDB');

  // redis publisher
  const redisPub = new Redis({ ...redisConfig, maxRetriesPerRequest: null, enableReadyCheck: false });
  redisPub.on('error', (e) => console.error('RedisPub error:', e));

  const concurrency = Number(process.env.WORKER_CONCURRENCY || 5);

  const worker = new Worker(
    QUEUE_NAME,
    async job => {
      const summary = await processBatch(job.data, redisPub, IMPORT_CHANNEL);
      return summary;
    },
    {
      concurrency,
      connection: {
        ...redisConfig,
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      }
    }
  );

  worker.on('completed', (job) => console.log(`Worker: Job ${job.id} COMPLETED`));
  worker.on('failed', (job, err) => console.error(`Worker: Job ${job?.id} FAILED`, err));

  const shutdown = async () => {
    console.log('Worker shutting down...');
    await worker.close();
    try { redisPub.disconnect(); } catch (e) {}
    try { redisClient.disconnect(); } catch (e) {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startWorker().catch(err => {
  console.error('Worker startup error', err);
  process.exit(1);
});
