const { Server } = require('socket.io');

function createSocket(server) {
  const io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    console.log('Admin UI connected:', socket.id);
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
  });
  return io;
}

module.exports = { createSocket };
