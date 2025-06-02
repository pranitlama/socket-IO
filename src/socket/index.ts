import { Server, Socket } from "socket.io";
import { handleRoom } from "./handler/room.handler";
import { handleQueue } from "./handler/queue.handler";

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

    socket.on("disconnect", () => {
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
