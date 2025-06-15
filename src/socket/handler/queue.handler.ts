import { Server, Socket } from "socket.io";
import { Troom } from "..";
import { client } from "./redis.handler";

export const handleQueue = (io: Server, socket: Socket) => {
  socket.on("add-video", async (ytId: string, cb) => {
    const roomString = await client.get(socket.data.roomId);
    if (roomString) {
      const roomData: Troom = JSON.parse(roomString);
      const hasId = roomData.musicQueue.some((item) => item.videoId === ytId);
      if (hasId) return cb({ status: false, msg: "Already in the queue" });
      roomData.musicQueue.push({
        username: socket.data.username,
        videoId: ytId,
      });
      if (roomData.isPlayerIdle) {
        roomData.current = roomData.musicQueue.length - 1;
        roomData.isPlayerIdle = false;
      }
      console.log(roomData, "🎈🎈🎈🎈🎈");
      await client.set(socket.data.roomId, JSON.stringify(roomData));
      cb({ status: true });
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
    }
  });

  socket.on("next-video", async (userId, cb) => {
    const roomString = await client.get(socket.data.roomId);
    if (!roomString) return cb({ status: false });
    const roomData: Troom = JSON.parse(roomString);
    if (
      roomData &&
      roomData.creator === userId &&
      roomData.current < roomData.musicQueue.length - 1
    ) {
      roomData.current++;
      if (roomData.current >= 2) {
        roomData.musicQueue.splice(0, 2);
        roomData.current = 0;
      }

      await client.set(socket.data.roomId, JSON.stringify(roomData));
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
      cb({ status: true });
    }
  });
  socket.on("prev-video", async (userId, cb) => {
    const roomString = await client.get(socket.data.roomId);
    if (!roomString) return cb({ status: false });
    const roomData: Troom = JSON.parse(roomString);
    if (roomData && roomData.creator === userId && roomData.current > 0) {
      roomData.current--;

      await client.set(socket.data.roomId, JSON.stringify(roomData));
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
      cb({ status: true });
    }
  });

  socket.on("auto-next", async (cb) => {
    const roomString = await client.get(socket.data.roomId);
    if (!roomString) return cb({ status: false });
    const roomData: Troom = JSON.parse(roomString);
    if (roomData && roomData.current < roomData.musicQueue.length - 1) {
      roomData.current++;
      if (roomData.current >= 2) {
        roomData.musicQueue.splice(0, 2);
        roomData.current = 0;
      }

      await client.set(socket.data.roomId, JSON.stringify(roomData));
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
      cb({ status: true });
    }
  });
  socket.on("list-play", async (listId, cb) => {
    const roomString = await client.get(socket.data.roomId);
    if (!roomString) return cb({ satus: false });
    const roomData: Troom = JSON.parse(roomString);
    if (
      listId >= 0 &&
      listId <= roomData.musicQueue.length - 1 &&
      roomData.creator === socket.data.userId
    ) {
      let songsToRemove = listId - 2;
      if (songsToRemove > 0) {
        roomData.musicQueue.splice(0, songsToRemove);
        roomData.current = listId - songsToRemove;
      } else {
        roomData.current = listId;
      }

      await client.set(socket.data.roomId, JSON.stringify(roomData));
      io.to(socket.data.roomId).emit("sync-data", {
        musicQueue: roomData.musicQueue,
        current: roomData.current,
      });
      cb({ status: true });
    }
  });

  socket.on("queue-ended", async () => {
    const roomString = await client.get(socket.data.roomId);
    if (!roomString) return;
    const roomData: Troom = JSON.parse(roomString);
    if (roomData && roomData.current === roomData.musicQueue.length - 1) {
      roomData.isPlayerIdle = true;
      await client.set(socket.data.roomId, JSON.stringify(roomData));
    }
  });
};
