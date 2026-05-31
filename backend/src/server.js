import app from "./app.js";
import { env } from "./config/env.js";
import { ensureInfrastructure } from "./db/bootstrap.js";

async function startServer() {
  try {
    await ensureInfrastructure();
  } catch (error) {
    // Do not block server startup in production if DB user cannot run DDL.
    console.warn("Infrastructure bootstrap skipped:", error?.code || error?.message || error);
  }

  app.listen(env.apiPort, env.apiHost, () => {
    console.log(`API listening on http://${env.apiHost}:${env.apiPort}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
