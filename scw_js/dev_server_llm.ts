// Local dev server for the LLM chat x402 seller. Runs only via `npm run dev:llmx402`
// (NODE_ENV=test npx tsx dev_server_llm.ts) and is not in tsup's entry list, so it is
// never bundled or deployed. It serves handle() over fastify on port 8085, with the
// payment headers exposed for browser clients. Deployed handlers must stay free of
// fastify — enforced by test/handler_purity.test.ts.
import { handle } from "./sc_llm_x402.js";
import type { ScwEvent } from "./types.js";
import { logger } from "./logger.js";

import("dotenv").then((dotenv) => {
  dotenv.config();
  import("fastify").then((fastifyModule) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fastify = (fastifyModule.default as any)({ bodyLimit: 10 * 1024 * 1024 });

    import("@fastify/cors").then((corsModule) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fastify.register((corsModule as any).default, {
        origin: true,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: "*",
        exposedHeaders: ["Payment-Required", "PAYMENT-REQUIRED", "X-Payment", "PAYMENT-RESPONSE"],
      });

      import("@fastify/url-data").then((urlDataModule) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fastify.register((urlDataModule as any).default);

        fastify.addContentTypeParser(
          "application/json",
          { parseAs: "string" },
          fastify.defaultTextParser,
        );

        fastify.route({
          method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          url: "/*",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler: async (request: any, reply: any) => {
            try {
              const event: ScwEvent = {
                httpMethod: request.method,
                headers: request.headers,
                body: request.body,
                path: request.url,
                queryStringParameters: request.query,
              };
              const result = await handle(event, {});
              reply.status(result.statusCode ?? 200);
              for (const [key, value] of Object.entries(result.headers ?? {})) {
                reply.header(key, value);
              }
              return result.body;
            } catch (error) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              reply.status(500).send({ error: (error as any).message });
            }
          },
        });

        fastify.listen({ port: 8085, host: "0.0.0.0" }, (err: unknown, address: string) => {
          if (err) {
            // Local dev only — never deployed. Same phrase the other packages' local server
            // bootstraps use; see EXEMPT in test/alert_coverage.test.ts.
            logger.error({ err }, "Error starting local server");
            process.exit(1);
          }
          logger.info({ address }, "Local server listening");
        });
      });
    });
  });
});
