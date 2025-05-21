import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { dirname, join } from "node:path";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    methods: ["GET"],
  },
});

let musicQueue: string[] = [];

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("user is connected", socket.id);
  socket.on("disconnect", () => {
    console.log("user is disconnected");
  });

  socket.emit("after-connect", musicQueue);

  socket.on("send-data", (data) => {
    if (!musicQueue.includes(data)) {
      musicQueue.push(data);
    }
    socket.broadcast.emit("get-data", data);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
