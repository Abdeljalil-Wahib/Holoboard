import fastify from "fastify";
import { Server, Socket } from "socket.io";
import cors from "@fastify/cors";
import { Point, LineShape, RectShape, Shape } from "./types";

const server = fastify();

// Allow CORS from environment variable or default to localhost
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

server.register(cors, {
  origin: allowedOrigins,
});

const io = new Server(server.server, {
  cors: {
    origin: allowedOrigins,
  },
});

interface UserProfile {
  id: string;
  username: string;
  avatar: string;
}

interface Participant {
  id: string;
  profile: UserProfile;
}

const roomStates: Record<string, Shape[]> = {};
const roomParticipants: Record<string, Participant[]> = {};

interface SocketWithRoom extends Socket {
  roomId?: string;
}

io.on("connection", (socket: SocketWithRoom) => {
  socket.on(
    "join-room",
    (data: { roomId: string; userProfile: UserProfile }) => {
      const { roomId, userProfile } = data;

      if (!roomId || !userProfile || !userProfile.username) {
        console.error("Invalid join-room data received:", data);
        return;
      }

      const MAX_PARTICIPANTS = 5;
      if (
        roomParticipants[roomId] &&
        roomParticipants[roomId].length >= MAX_PARTICIPANTS
      ) {
        socket.emit("room-full");
        return;
      }

      socket.join(roomId);
      socket.roomId = roomId;

      if (!roomStates[roomId]) {
        roomStates[roomId] = [];
      }
      if (!roomParticipants[roomId]) {
        roomParticipants[roomId] = [];
      }

      const newParticipant: Participant = {
        id: socket.id,
        profile: userProfile,
      };
      roomParticipants[roomId].push(newParticipant);

      socket.emit("canvas-state", roomStates[roomId]);
      io.to(roomId).emit("room-participants", roomParticipants[roomId]);
    }
  );

  socket.on("start-drawing", (data: Shape & { roomId: string }) => {
    const { roomId, ...shape } = data;
    if (!roomStates[roomId]) roomStates[roomId] = [];
    roomStates[roomId].push(shape as Shape);
    socket.to(roomId).emit("start-drawing", shape);
  });

  socket.on("drawing", (data: Point & { roomId: string }) => {
    const { roomId, ...point } = data;
    const shapesInRoom = roomStates[roomId];
    if (shapesInRoom && shapesInRoom.length > 0) {
      const lastShape = shapesInRoom[shapesInRoom.length - 1];
      if (lastShape.type === "line") {
        (lastShape as LineShape).points.push(point as Point);
      }
    }
    socket.to(roomId).emit("drawing", point);
  });

  socket.on("finish-drawing", () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("finish-drawing");
    }
  });

  socket.on(
    "drawing-shape-update",
    (data: { shape: Shape; roomId: string }) => {
      const { roomId, shape } = data;
      const shapesInRoom = roomStates[roomId];
      if (shapesInRoom) {
        const shapeIndex = shapesInRoom.findIndex((s) => s.id === shape.id);
        if (shapeIndex !== -1) {
          shapesInRoom[shapeIndex] = shape;
        } else {
          shapesInRoom.push(shape);
        }
      }
      socket.to(roomId).emit("drawing-shape-update", shape);
    }
  );

  socket.on("shape-transformed", (data: { shape: Shape; roomId: string }) => {
    const { roomId, shape } = data;
    const shapesInRoom = roomStates[roomId];
    if (shapesInRoom) {
      const idx = shapesInRoom.findIndex((s) => s.id === shape.id);
      if (idx !== -1) {
        shapesInRoom[idx] = shape;
      } else {
        shapesInRoom.push(shape);
      }
    }
    socket.to(roomId).emit("shape-transformed", shape);
  });

  socket.on(
    "delete-shape",
    ({ id, roomId }: { id: string; roomId: string }) => {
      const shapesInroom = roomStates[roomId];
      if (shapesInroom) {
        roomStates[roomId] = shapesInroom.filter((shape) => shape.id !== id);
        socket.to(roomId).emit("shape-deleted", id);
      }
    }
  );

  socket.on(
    "canvas-state-update",
    (data: { shapes: Shape[]; roomId: string }) => {
      const { roomId, shapes } = data;
      roomStates[roomId] = shapes;
      socket.to(roomId).emit("canvas-state", shapes);
    }
  );

  socket.on("clear", (roomId: string) => {
    if (roomId) {
      roomStates[roomId] = [];
      io.to(roomId).emit("clear");
    }
  });

  socket.on(
    "cursor-move",
    (data: { roomId: string; x: number; y: number; user: UserProfile }) => {
      const { roomId, x, y, user } = data;
      socket.to(roomId).emit("cursor-move", { userId: socket.id, x, y, user });
    }
  );

  socket.on("disconnect", () => {
    const roomId = socket.roomId;

    if (roomId && roomParticipants[roomId]) {
      socket.to(roomId).emit("cursor-leave", socket.id);

      roomParticipants[roomId] = roomParticipants[roomId].filter(
        (p) => p.id !== socket.id
      );

      io.to(roomId).emit("room-participants", roomParticipants[roomId]);

      if (roomParticipants[roomId].length === 0) {
        delete roomParticipants[roomId];
      }
    }
  });
});

const start = async () => {
  try {
    const PORT = parseInt(process.env.PORT || "3001", 10);
    const HOST = process.env.HOST || "0.0.0.0";

    await server.listen({ port: PORT, host: HOST });
    console.log(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
