const express = require('express');
const ImportLog = require('../models/importLogModel');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const page = Number(req.query.page || 1);
    const skip = (page - 1) * limit;
    const logs = await ImportLog.find().sort({ timestamp: -1 }).skip(skip).limit(limit).lean();
    const total = await ImportLog.countDocuments();
    res.json({ data: logs, meta: { total, page, limit } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const log = await ImportLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
