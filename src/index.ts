import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { join } from "node:path";

type Troom = {
  current: number;
  musicQueue: string[];
  creator: string;
  playerIdle: boolean;
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(express.static(join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

const rooms = new Map<string, Troom>();
let joinedRoom: string;

io.on("connection", (socket) => {
  console.log("user is connected", socket.id);

  socket.on("join-room", (data: { roomId: string; userId: string }) => {
    console.log(data.roomId, "🎈🎈🎈🎈");
    joinedRoom = data.roomId;
    if (!data.roomId) return;
    console.log(`user ${data.userId} has joined the room `);
    socket.join(data.roomId);

    socket.emit("room-created", data.roomId);

    if (!rooms.has(data.roomId)) {
      rooms.set(data.roomId, {
        current: 0,
        creator: data.userId,
        musicQueue: [],
        playerIdle: false,
      });
    }
    const roomData = rooms.get(data.roomId);
    console.log(rooms);
    if (roomData) {
      io.to(data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
        creator: roomData.creator,
      });
    }
  });

  socket.on("add-data", (ytId, roomId) => {
    const roomData = rooms.get(roomId);
    if (roomData && !roomData.musicQueue.includes(ytId)) {
      roomData.musicQueue.push(ytId);

      if (roomData.playerIdle) {
        roomData.current++;
        roomData.playerIdle = false;
      }
      io.to(roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
        creator: roomData.creator,
      });
    }
  });

  socket.on("next", (roomId, userId) => {
    const roomData = rooms.get(roomId);
    if (roomData && roomData.current < roomData.musicQueue.length - 1) {
      roomData.current++;
      io.to(roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
        creator: roomData.creator,
      });
    }
  });

  socket.on("ended", (roomId) => {
    const roomData = rooms.get(roomId);
    if (roomData && roomData.current === roomData.musicQueue.length - 1)
      roomData.playerIdle = true;
  });

  socket.on("prev", (roomId, userId) => {
    const roomData = rooms.get(roomId);
    if (roomData && roomData.current > 0) {
      roomData.current--;
      io.to(roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
        creator: roomData.creator,
      });
    }
  });

  socket.on("play-from-index", (index, roomId, userId) => {
    const roomData = rooms.get(roomId);
    if (roomData && index >= 0 && index < roomData.musicQueue.length) {
      roomData.current = index;

      io.to(roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
        creator: roomData.creator,
      });
    }
  });
  socket.on("disconnect", async () => {
    if (!joinedRoom) return;

    const socketsInRoom = await io.in(joinedRoom).fetchSockets();

    if (socketsInRoom.length === 0) {
      rooms.delete(joinedRoom);
    }

    console.log("user is disconnected", joinedRoom, rooms, socketsInRoom);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
