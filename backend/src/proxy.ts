import "./config/dotenv"; // Load environment variables from the root
import fs from "node:fs";
import path from "node:path";
import httpProxy from "@fastify/http-proxy";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";

const app = Fastify({
	logger: {
		level: process.env.NODE_ENV === "production" ? "info" : "debug",
		transport:
			process.env.NODE_ENV === "production"
				? undefined
				: {
						target: "pino-pretty",
						options: {
							colorize: true,
							translateTime: "HH:MM:ss",
							ignore: "pid,hostname",
						},
					},
	},
});

const PORT = parseInt(process.env.PROXY_PORT || "8001", 10);
const API_TARGET = process.env.API_TARGET || "http://127.0.0.1:8002";

// Route API requests directly to the Fastify backend API process
app.register(httpProxy, {
	upstream: API_TARGET,
	prefix: "/api",
	rewritePrefix: "/api",
});

// Serve frontend static files in production, or proxy to React dev server in development
if (process.env.NODE_ENV === "production") {
	const frontendBuildPath = path.join(__dirname, "../../frontend/build");
	if (fs.existsSync(frontendBuildPath)) {
		app.register(fastifyStatic, {
			root: frontendBuildPath,
		});

		// Catch-all route to serve index.html for client-side routing
		app.setNotFoundHandler((request, reply) => {
			if (request.raw.url?.startsWith("/api")) {
				reply.code(404).send({ error: { message: "API route not found" } });
				return;
			}
			reply.sendFile("index.html");
		});
	} else {
		app.log.warn(
			`Frontend build directory not found at ${frontendBuildPath}. Skipping static file server.`,
		);
	}
} else {
	// In development, proxy everything else to the Vite dev server (defaults to port 5173)
	const FRONTEND_DEV_TARGET =
		process.env.FRONTEND_DEV_TARGET || "http://127.0.0.1:5173";
	app.register(httpProxy, {
		upstream: FRONTEND_DEV_TARGET,
		prefix: "/",
	});
	app.log.info(
		`Proxy Gateway configured in DEVELOPMENT mode. Proxying frontend requests to ${FRONTEND_DEV_TARGET}`,
	);
}

const start = async () => {
	try {
		await app.listen({ port: PORT, host: "0.0.0.0" });
		app.log.info(`Proxy Gateway listening on port ${PORT}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
