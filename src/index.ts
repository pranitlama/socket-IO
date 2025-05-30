import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { join } from "node:path";
import { handleSocket } from "./socket";

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
app.get("/player", (req, res) => {
  res.sendFile(join(__dirname, "public", "player.html"));
});

handleSocket(io);

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
