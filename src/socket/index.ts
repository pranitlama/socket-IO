import { Server, Socket } from "socket.io";
import { handleRoom } from "./handler/room.handler";
import { handleQueue } from "./handler/queue.handler";
import { client } from "./handler/redis.handler";

export type Troom = {
  creator: string;
  musicQueue: string[];
  current: number;
  isPlayerIdle: boolean;
};

export const handleSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("user is connected", socket.id);

    handleRoom(io, socket);
    handleQueue(io, socket);

    socket.on("disconnect", async () => {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;
      const roomString = await client.get(roomId);
      if (!roomString) return;
      const roomData: Troom = JSON.parse(roomString);
      if (roomData.creator !== userId) return;
      const socketInRooms = await io.in(roomId).fetchSockets();
      const otherUser = socketInRooms.filter((item) => item.id !== userId);
      if (otherUser.length === 0) {
        console.log('inside this okk')
        await client.del(roomId);
      } else {
        const newCreator = otherUser[0].id;
        roomData.creator = otherUser[0].data.userId;
        await client.set(roomId, JSON.stringify(roomData));
        socket.to(newCreator).emit("new-creator");
        console.log("asd", newCreator);
      }
      console.log(
        "user is disconnected",
        socket.id,
        socket.data.username,
        socket.data.userId,
        socket.data.roomId
      );
    });
  });
};
