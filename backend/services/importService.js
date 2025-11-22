const { fetchAndParseXML } = require('./xmlFetcher');
const { normalizeFeedItems } = require('./jobNormalizer');
const { enqueueJobs } = require('../jobs/queue');

async function fetchFeedAndEnqueue(feedUrl) {
  const parsed = await fetchAndParseXML(feedUrl);
  const items = normalizeFeedItems(parsed);
  await enqueueJobs(feedUrl, items);
  return { totalFetched: items.length, items };
}

module.exports = { fetchFeedAndEnqueue };
