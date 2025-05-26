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
    methods: ["GET"],
  },
});
app.use(express.static(join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

const rooms = new Map<string, Troom>();

io.on("connection", (socket) => {
  console.log("user is connected", socket.id);

  socket.on("join-room", (data: { roomId: string; userId: string }) => {
    socket.data.joinedRoom = data.roomId;
    if (!socket.data.joinedRoom) return;
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

  socket.on("add-data", (ytId: string, roomId: string) => {
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

  socket.on("next", (roomId: string, userId: string) => {
    const roomData = rooms.get(roomId);
    if (
      roomData &&
      userId === roomData.creator &&
      roomData.current < roomData.musicQueue.length - 1
    ) {
      roomData.current++;
      if (roomData.current > 3) {
        roomData.musicQueue.shift();
        roomData.current--;
      }
      io.to(roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
        creator: roomData.creator,
      });
    }
  });

  socket.on("auto-next", (roomId: string) => {
    const roomData = rooms.get(roomId);
    if (roomData && roomData.current < roomData.musicQueue.length - 1) {
      roomData.current++;
      if (roomData.current > 3) {
        roomData.musicQueue.shift();
        roomData.current--;
      }
      io.to(roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
        creator: roomData.creator,
      });
    }
  });

  socket.on("ended", (roomId: string) => {
    const roomData = rooms.get(roomId);
    if (roomData && roomData.current === roomData.musicQueue.length - 1)
      roomData.playerIdle = true;
  });

  socket.on("prev", (roomId: string, userId: string) => {
    const roomData = rooms.get(roomId);
    if (roomData && roomData.creator === userId && roomData.current > 0) {
      roomData.current--;
      io.to(roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
        creator: roomData.creator,
      });
    }
  });

  socket.on(
    "play-from-index",
    (index: number, roomId: string, userId: string) => {
      const roomData = rooms.get(roomId);
      if (
        roomData &&
        roomData.creator === userId &&
        index >= 0 &&
        index < roomData.musicQueue.length
      ) {
        roomData.current = index;

        if (roomData.current > 3) {
          const songsToRemove = roomData.current - 3;
          roomData.musicQueue.splice(0, songsToRemove);
          roomData.current -= songsToRemove;
        }

        io.to(roomId).emit("sync-data", {
          musicQueue: roomData.musicQueue,
          current: roomData.current,
          creator: roomData.creator,
        });
      }
    }
  );
  socket.on("disconnect", async () => {
    const joinedRoom = socket.data.joinedRoom;
    if (!joinedRoom) return;

    const socketsInRoom = await io.in(joinedRoom).fetchSockets();

    if (socketsInRoom.length === 0) {
      rooms.delete(joinedRoom);
    }

    console.log("user is disconnected");
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
