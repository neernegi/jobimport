const mongoose = require('mongoose');

const ImportLogSchema = new mongoose.Schema({
  feedUrl: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  totalFetched: Number,
  totalImported: Number,
  newJobs: Number,
  updatedJobs: Number,
  failedJobs: [
    {
      externalId: String,
      reason: String
    }
  ],
  rawSummary: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('ImportLog', ImportLogSchema);
