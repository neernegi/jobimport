const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  externalId: { type: String, index: true, required: true, unique: true },
  title: String,
  company: String,
  location: String,
  description: String,
  url: String,
  categories: [String],
  raw: mongoose.Schema.Types.Mixed,
  source: String,
  lastSeenAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
