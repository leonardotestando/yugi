import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { createInitialState, gameReducer } from './src/game/engine';
import { GameState, Action } from './src/types';

const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer);

  const rooms = new Map<string, { state: GameState, p1?: string, p2?: string }>();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (data: { roomId: string, playerName: string }) => {
      const { roomId, playerName } = data;
      socket.join(roomId);
      let room = rooms.get(roomId);
      
      if (!room) {
        room = { state: createInitialState() };
        rooms.set(roomId, room);
      }

      let role = 'spectator';
      if (!room.p1) {
        room.p1 = socket.id;
        role = 'player1';
        room.state.player1.name = playerName || 'Jogador 1';
      } else if (!room.p2 && room.p1 !== socket.id) {
        room.p2 = socket.id;
        role = 'player2';
        room.state.player2.name = playerName || 'Jogador 2';
        room.state.status = 'playing';
      } else if (room.p1 === socket.id) {
        role = 'player1';
        room.state.player1.name = playerName || 'Jogador 1';
      } else if (room.p2 === socket.id) {
        role = 'player2';
        room.state.player2.name = playerName || 'Jogador 2';
      }

      socket.emit('role', role);
      io.to(roomId).emit('gameState', room.state);

      socket.on('action', (action: Action) => {
        if (room && room.state.status === 'playing') {
          const isP1 = role === 'player1' && room.state.turn === 'player1';
          const isP2 = role === 'player2' && room.state.turn === 'player2';
          
          if (isP1 || isP2) {
            room.state = gameReducer(room.state, action);
            io.to(roomId).emit('gameState', room.state);
          }
        }
      });

      socket.on('disconnect', () => {
        if (room) {
          if (room.p1 === socket.id) {
            room.p1 = undefined;
            room.state.status = 'waiting';
          }
          if (room.p2 === socket.id) {
            room.p2 = undefined;
            room.state.status = 'waiting';
          }
          io.to(roomId).emit('gameState', room.state);
        }
      });
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
