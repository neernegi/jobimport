require('./config/env');
const { connect } = require('./config/mongo');
const cron = require('node-cron');
const { fetchFeedAndEnqueue } = require('./services/importService');

const feeds = [
  'https://jobicy.com/?feed=job_feed',
  'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
  'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
  'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
  'https://jobicy.com/?feed=job_feed&job_categories=data-science',
  'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
  'https://jobicy.com/?feed=job_feed&job_categories=business',
  'https://jobicy.com/?feed=job_feed&job_categories=management',
  'https://www.higheredjobs.com/rss/articleFeed.cfm'
];

async function start() {
  await connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for cron');

  const CRON_EXPRESSION = process.env.CRON_EXPRESSION || '0 * * * *';
  cron.schedule(CRON_EXPRESSION, async () => {
    console.log('CRON run at', new Date().toISOString());
    for (const feed of feeds) {
      try {
        const result = await fetchFeedAndEnqueue(feed);
        console.log(`Enqueued ${result.totalFetched} items from ${feed}`);
      } catch (err) {
        console.error('Error fetching feed', feed, err.message);
      }
    }
  }, { timezone: 'UTC' });

  for (const feed of feeds) {
    try {
      const result = await fetchFeedAndEnqueue(feed);
      console.log(`(startup) Enqueued ${result.totalFetched} items from ${feed}`);
    } catch (err) {
      console.error('startup fetch error', feed, err.message);
    }
  }
}

start().catch(e => {
  console.error('Cron startup error', e);
  process.exit(1);
});
