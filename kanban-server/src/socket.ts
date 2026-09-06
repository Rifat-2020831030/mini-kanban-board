import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`Socket ${socket.id} joined board ${boardId}`);
    });

    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}
