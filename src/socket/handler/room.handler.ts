import { Server, Socket } from "socket.io";
import { Troom } from "..";
import { client } from "./redis.handler";

export const handleRoom = (io: Server, socket: Socket) => {
  socket.on(
    "join-room",
    async (data: { userId: string; roomId: string; username: string }, cb) => {
      try {
        if (!data.roomId || !data.userId || !data.roomId) return;
        socket.data.roomId = data.roomId;
        socket.data.userId = data.userId;
        socket.data.username = data.username;

        socket.join(data.roomId);
        const roomString = await client.get(data.roomId);
        console.log(roomString);
        if (!roomString) {
          await client.set(
            data.roomId,
            JSON.stringify({
              creator: data.userId,
              musicQueue: [],
              current: 0,
              isPlayerIdle: false,
            })
          );
          cb({
            status: true,
            message: "Joined Room",
            roomId: data.roomId,
            isCreator: true,
          });
          io.to(data.roomId).emit("announce", data.username);
          io.to(data.roomId).emit("sync-data", {
            creator: data.userId,
            musicQueue: [],
            current: 0,
          });
        } else {
          const roomData: Troom = JSON.parse(roomString);
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
