import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { join } from "node:path";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    methods: ["GET"],
  },
});

let musicQueue: string[] = [];
let current = 0;
let playerIdle = false;
app.use(express.static(join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("user is connected", socket.id);

  socket.emit("sync-data", { musicQueue, current });

  socket.on("add-data", (ytId) => {
    if (!musicQueue.includes(ytId)) {
      musicQueue.push(ytId);

      if (playerIdle) {
        current++;
        playerIdle = false;
      }
      io.emit("sync-data", { musicQueue, current });
    }
  });

  socket.on("next", () => {
    if (current < musicQueue.length - 1) {
      current++;
      io.emit("sync-data", { musicQueue, current });
    }
  });

  socket.on("ended", () => {
    if (current === musicQueue.length - 1) playerIdle = true;
  });

  socket.on("prev", () => {
    if (current > 0) {
      current--;
      io.emit("sync-data", { musicQueue, current });
    }
  });

  socket.on("play-from-index", (index) => {
    if (index >= 0 && index < musicQueue.length) {
      current = index;
      io.emit("sync-data", { musicQueue, current });
    }
  });
  socket.on("disconnect", () => {
    console.log("user is disconnected");
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
