import { Server, Socket } from "socket.io";
import { Troom } from "..";

export const handleQueue = (
  io: Server,
  socket: Socket,
  rooms: Map<string, Troom>
) => {
  socket.on("add-video", (ytId: string, cb) => {
    const roomData = rooms.get(socket.data.roomId);
    if (roomData) {
      roomData.musicQueue.push(ytId);
      if (roomData.isPlayerIdle) {
        roomData.current = roomData.musicQueue.length - 1;
        roomData.isPlayerIdle = false;
      }
      console.log(roomData, "🎈🎈🎈🎈🎈");
      cb({ status: true });
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
    }
  });

  socket.on("next-video", (userId, cb) => {
    const roomData = rooms.get(socket.data.roomId);
    if (
      roomData &&
      roomData.creator === userId &&
      roomData.current < roomData.musicQueue.length - 1
    ) {
      roomData.current++;
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
      cb({ status: true });
    }
  });
  socket.on("prev-video", (userId, cb) => {
    const roomData = rooms.get(socket.data.roomId);
    if (roomData && roomData.creator === userId && roomData.current > 0) {
      roomData.current--;
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
      cb({ status: true });
    }
  });

  socket.on("auto-next", (cb) => {
    const roomData = rooms.get(socket.data.roomId);
    if (roomData && roomData.current < roomData.musicQueue.length - 1) {
      roomData.current++;
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
      cb({ status: true });
    }
  });

  socket.on("queue-ended", () => {
    const roomData = rooms.get(socket.data.roomId);
    if (roomData && roomData.current === roomData.musicQueue.length - 1) {
      roomData.isPlayerIdle = true;
    }
  });
};
