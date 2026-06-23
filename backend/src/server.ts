import { buildApp } from "./app";
import { env } from "./config/env";

async function main() {
	const app = buildApp();
	try {
		const addr = await app.listen({ host: env.HOST, port: env.PORT });
		app.log.info(`Nexus Wallet API listening on ${addr}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

main();
