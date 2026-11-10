# bunny_js — agent rules

Bunny Edge Scripts: the x402 llm/search/mcp **sellers** plus the ported **facilitator**
(the payment core's verbatim twin from `x402_facilitator/` — cutover done, the retired
Scaleway function deleted; the move's plan is preserved in git history).
See [`README.md`](./README.md) for the architecture, commands, environment/secrets, known
limits and deploy paths, and [`SECURITY.md`](./SECURITY.md) for the security posture.

## Runtime

The scripts deploy to Bunny's Edge Scripts **Deno 1.x** runtime, not Node — local dev serves
the twins via Deno, and import resolution there differs from the bundler's. Any Node
convention from the sibling npm packages applies here only if [`README.md`](./README.md) →
_Known limits / decisions_ says so.

## x402 role

These endpoints are the sellers that the scw*js buyers (`/imagegen`, `/assistent`) pay. Use
the **`x402`** skill before anything that names a role; the shared payment traps (EIP-712
domain names, the OpenAPI strictness rule) are in the root [`AGENTS.md`](../AGENTS.md) →
\_x402 payments*.
