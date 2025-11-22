require('./config/env');
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { connect } = require('./config/mongo');
const { redisConfig } = require('./config/redis');
const { createSocket } = require('./sockets/socket');
const { startSubscriber } = require('./sockets/subscriber');
const logsRouter = require('./routes/logs.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

(async () => {
  try {
    await connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Mongo connection error:', err);
    process.exit(1);
  }

  app.use('/api/import-logs', logsRouter);

  const server = http.createServer(app);
  const io = createSocket(server);
  await startSubscriber(io);

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => console.log(`Server + Socket.IO listening on ${PORT}`));
})();
