# x402_facilitator — agent rules

EIP-3009 USDC payment facilitator (Scaleway Functions, path-based routing: `/verify`,
`/settle`, `/supported`). See [`README.md`](./README.md) for the payment schemes, recipient
gating, the fee pull, verification checks, error codes and local test endpoints.

## Serverless conventions

Public env values go in `env:` in `serverless.yml`; secrets are configured in the Scaleway
Console only. All responses include CORS headers.

## x402 role

This package sits between the scw*js **buyers** and the sellers — aside from the fee pull
right after settlement it never moves funds. Use the **`x402`** skill before anything that
names a role; the shared payment traps (EIP-712 domain names, the OpenAPI strictness rule)
are in the root [`AGENTS.md`](../AGENTS.md) → \_x402 payments*.

## Recipient whitelist (OR logic)

Recipient gating is **OR logic** across several sources, not a single list. The composition
and the reasons are in [`README.md`](./README.md) → _Whitelist Architecture_ — read it before
touching recipient gating, and keep the batch-settlement test-wallet bypass honored on
testnets only.
