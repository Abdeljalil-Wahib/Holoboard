// packages/server/src/index.ts
import fastify from "fastify";
import { Server, Socket } from "socket.io";
import cors from "@fastify/cors";

const server = fastify();

server.register(cors, {
  origin: "http://localhost:3000",
});

const io = new Server(server.server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

interface Point {
  x: number;
  y: number;
}

interface LineData {
  points: Point[];
  color: string;
}

// Correct: roomStates now correctly stores an array of LineData objects
const roomStates: Record<string, LineData[]> = {};

interface SocketWithRoom extends Socket {
  roomId?: string;
}

io.on("connection", (socket: SocketWithRoom) => {
  console.log("A user connected", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    console.log(`User ${socket.id} joined room ${roomId}`);

    // Correct: When a user joins, send them the current state of the canvas (LineData[])
    if (roomStates[roomId]) {
      socket.emit("canvas-state", roomStates[roomId]);
    } else {
      roomStates[roomId] = []; // Initialize room if it doesn't exist
    }
  });

  // Correct: start-drawing now correctly expects and stores LineData, and emits full LineData
  socket.on("start-drawing", (data: LineData & { roomId: string }) => {
    // We already ensured roomStates[data.roomId] exists in join-room or previous start-drawing
    roomStates[data.roomId].push({ points: data.points, color: data.color });
    // Emit the complete LineData object including 'color' to others
    socket
      .to(data.roomId)
      .emit("start-drawing", { points: data.points, color: data.color });
  });

  // Correct: The 'drawing' event handler should only push the Point.
  socket.on("drawing", (data: Point & { roomId: string }) => {
    const linesInRoom = roomStates[data.roomId];
    if (linesInRoom && linesInRoom.length > 0) {
      linesInRoom[linesInRoom.length - 1].points.push(data);
    }
    socket.to(data.roomId).emit("drawing", data);
  });

  socket.on("finish-drawing", () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("finish-drawing");
    }
  });

  socket.on("clear", () => {
    if (socket.roomId) {
      roomStates[socket.roomId] = [];
      io.to(socket.roomId).emit("clear");
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    // Optional: Clean up empty rooms or rooms where all users have disconnected
    // For now, roomStates will persist even if empty, which is fine for a simple whiteboard
  });
});

const start = async () => {
  try {
    await server.listen({ port: 3001 });
    console.log("Server listening on http://localhost:3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
