import type { Server } from "node:http";
import type { Knex } from "@graphscope/db";
import type { Express } from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { loadEnv, type Env } from "@graphscope/config";
import { createKnex, createRepositories, runMigrations } from "@graphscope/db";
import cors from "cors";
import express from "express";
import depthLimit from "graphql-depth-limit";
import { createContext, type GraphContext } from "./context.js";
import { complexityLimitRule } from "./services/complexity-limit.js";
import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/schema.js";

export interface CreateAppOptions {
  port?: number;
  host?: string;
  skipListen?: boolean;
  dbOverrides?: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  };
}

export interface AppInstance {
  app: Express;
  db: Knex;
  env: Env;
  host: string;
  port: number;
  httpServer: Server | null;
  setReady: (v: boolean) => void;
  close: () => Promise<void>;
}

export async function createApp(options: CreateAppOptions = {}): Promise<AppInstance> {
  const env = loadEnv();
  const db = createKnex({
    host: options.dbOverrides?.host,
    port: options.dbOverrides?.port,
    database: options.dbOverrides?.database,
    user: options.dbOverrides?.user,
    password: options.dbOverrides?.password,
  });
  await runMigrations(db);
  const repos = createRepositories(db);

  let workerStop: (() => Promise<void>) | null = null;
  if (process.env.GRAPHSCOPE_WORKER !== "false") {
    try {
      const { startWorker } = await import("./jobs/worker.js");
      const worker = await startWorker(db);
      workerStop = worker.stop;
      console.log("graphile-worker started");
    } catch (err) {
      console.warn("graphile-worker failed to start:", err);
    }
  }

  const app = express();
  let ready = true;

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/readyz", (_req, res) => {
    if (ready) {
      res.json({ ok: true });
    } else {
      res.status(503).json({ ok: false });
    }
  });

  const apollo = new ApolloServer<GraphContext>({
    typeDefs,
    resolvers,
    validationRules: [depthLimit(12), complexityLimitRule(1000)],
  });
  await apollo.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({ origin: true, credentials: true }),
    express.json(),
    expressMiddleware(apollo, {
      context: async ({ req }): Promise<GraphContext> => {
        const authHeader = req.headers.authorization;
        const sessionToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

        let userId: string | null = null;
        let workspaceId: string | null = null;

        if (sessionToken) {
          const session = await repos.sessions.findByToken(sessionToken);
          if (session) {
            userId = session.userId;
            workspaceId = session.activeWorkspaceId;
          }
        }

        return createContext({ env, repos, db }, { sessionToken, userId, workspaceId });
      },
    }),
  );

  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? env.GRAPHSCOPE_API_PORT;

  let httpServer: Server | null = null;

  if (!options.skipListen) {
    httpServer = await new Promise<Server>((resolve) => {
      const s = app.listen(port, host, () => resolve(s));
    });
    console.log(`GraphScope API listening on http://${host}:${port}`);
  }

  return {
    app,
    db,
    env,
    host,
    port,
    httpServer,
    setReady: (v: boolean) => {
      ready = v;
    },
    close: async () => {
      if (workerStop) await workerStop();
      const { closeCache } = await import("./services/cache.js");
      await closeCache();
      if (httpServer) {
        await new Promise<void>((resolve, reject) => {
          httpServer!.close((err?: Error) => (err ? reject(err) : resolve()));
        });
      }
      await db.destroy();
    },
  };
}
