import { Server, Socket } from "socket.io";
import { Troom } from "..";

export const handleRoom = (
  io: Server,
  socket: Socket,
  rooms: Map<string, Troom>
) => {
  socket.on(
    "join-room",
    (data: { userId: string; roomId: string; username: string }, cb) => {
      try {
        if (!data.roomId || !data.userId || !data.roomId) return;
        socket.data.roomId = data.roomId;
        socket.data.userId = data.userId;
        socket.data.username = data.username;

        socket.join(data.roomId);

        if (!rooms.has(data.roomId)) {
          rooms.set(data.roomId, {
            creator: data.userId,
            musicQueue: [],
            current: 0,
            isPlayerIdle: false,
          });
        }
        const roomData = rooms.get(data.roomId);
        console.log(roomData, data);
        if (roomData) {
          cb({
            status: true,
            message: "Joined Room",
            roomId: data.roomId,
            isCreator: roomData.creator === data.userId,
          });
          io.to(data.roomId).emit("announce", data.username);
          io.to(data.roomId).emit("sync-data", {
            creator: roomData.creator,
            musicQueue: roomData.musicQueue,
            current: roomData.current,
          });
        }
      } catch (error) {
        cb({ status: false, message: "Failed to join the room" });
      }
    }
  );
};
