import { Server, Socket } from "socket.io";
import { Troom } from "..";

export const handleQueue = (
  io: Server,
  socket: Socket,
  rooms: Map<string, Troom>
) => {
  socket.on("add-video", (ytId: string) => {
    const roomData = rooms.get(socket.data.roomId);
    if (roomData) {
      roomData.musicQueue.push(ytId);
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
    }
  });
};
