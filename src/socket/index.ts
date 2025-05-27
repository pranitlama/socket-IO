import { Server, Socket } from "socket.io";

type Troom = {
  creator: string;
  musicQueue: string[];
};

const rooms = new Map<string, Troom>();

export const handleSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("user is connected", socket.id);
    socket.on("disconnect", () => {
      console.log("user is disconnected", socket.id);
    });
  });
};
