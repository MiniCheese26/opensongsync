import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';

export default function setupWebSockets(server: HttpServer) {
  const io = new Server(server);

  io.on('connection', (socket) => {
    socket.emit('fromServer', 'hello world');

    socket.on('fromClient', (msg) => {
        console.debug(msg);
      });
  });

  console.log('SocketIO ready');
}
