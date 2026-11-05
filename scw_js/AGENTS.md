# scw_js — agent rules

Scaleway Functions backend: image generation, channel cron, growth API. See
[`README.md`](./README.md) for the full function list, on-chain integration (RPC, ERC-8004
registration, bazaar discovery), the S3 storage layout, local testing and deployment.

## Serverless conventions

One Scaleway Function with path-based routing. Public env values go in `env:` in
`serverless.yml`; secrets are configured in the Scaleway Console only. All responses include
CORS headers.

## x402 role

`/imagegen` and `/assistent` are **buyers** — they spend USDC on the `*-agent.fretchen.eu`
sellers (image gen on Scaleway, llm/web/MCP on bunny*js Edge Scripts). Use the **`x402`**
skill before anything that names a role; the shared payment traps (EIP-712 domain names, the
OpenAPI strictness rule) are in the root [`AGENTS.md`](../AGENTS.md) → \_x402 payments*.

## Adding a network

Follow the checklist in [`README.md`](./README.md) → _Adding New Networks_ — it carries the
verified per-network EIP-712 domain name table. Getting this wrong silently breaks payments.
