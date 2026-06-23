import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: 2,
	enableReadyCheck: true,
	lazyConnect: false,
});

redis.on("error", (err) => {
	// do not crash; cache is optional
	// eslint-disable-next-line no-console
	console.error("[redis] error:", err.message);
});
