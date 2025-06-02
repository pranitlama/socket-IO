import { createClient } from "redis";

export const client = createClient();

client.on("error", (err) => console.log("redis client Error", err)).connect();
