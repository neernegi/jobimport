const JobModel = require("../../models/jobModel");
const ImportLog = require("../../models/importLogModel");

async function processBatch(jobData, redisPub, IMPORT_CHANNEL) {
  const { feedUrl, jobs } = jobData;
  const summary = {
    feedUrl,
    timestamp: new Date(),
    totalFetched: Array.isArray(jobs) ? jobs.length : 0,
    totalImported: 0,
    newJobs: 0,
    updatedJobs: 0,
    failedJobs: [],
  };

  await redisPub.publish(
    IMPORT_CHANNEL,
    JSON.stringify({
      event: "import:started",
      data: { feedUrl, totalFetched: summary.totalFetched },
    })
  );

  for (const item of jobs || []) {
    const externalId =
      item.guid || item.id || item.link || item.url || item.title;
    try {
      const existing = await JobModel.findOne({ externalId }).lean();

      if (existing) summary.updatedJobs++;
      else summary.newJobs++;

      await JobModel.findOneAndUpdate(
        { externalId },
        {
          externalId,
          title: item.title || "",
          company: item.company || "",
          location: item.location || "",
          description: item.description || "",
          url: item.link || item.url || "",
          categories: item.categories || [],
          raw: item,
          source: feedUrl,
          lastSeenAt: new Date(),
        },
        { upsert: true, setDefaultsOnInsert: true }
      );

      summary.totalImported++;

      await redisPub.publish(
        IMPORT_CHANNEL,
        JSON.stringify({
          event: "import:progress",
          data: { feedUrl, externalId, status: "imported" },
        })
      );
    } catch (err) {
      summary.failedJobs.push({ externalId, reason: err.message });
      await redisPub.publish(
        IMPORT_CHANNEL,
        JSON.stringify({
          event: "import:progress",
          data: { feedUrl, externalId, status: "failed", reason: err.message },
        })
      );
    }
  }

  await new ImportLog(summary).save();

  await redisPub.publish(
    IMPORT_CHANNEL,
    JSON.stringify({
      event: "import:finished",
      data: { feedUrl, summary },
    })
  );

  return summary;
}

module.exports = { processBatch };
