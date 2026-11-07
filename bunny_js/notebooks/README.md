# bunny_js notebooks

Front-end-free test notebooks for the Edge Scripts in this package. All use the **Deno
kernel**; each notebook resolves its npm dependencies via `npm:` specifiers and this
folder's own `deno.json`/`node_modules` (scoped here — see `deno.json`'s comment), so they
run without touching the parent `bunny_js` npm project — subfolders inherit that scope too.

- `facilitator/` — the facilitator test notebooks, one per payment scheme; the target host is
  the `FACILITATOR_URL` env var. See [`facilitator/README.md`](./facilitator/README.md).
- `llm_x402_buyer.ipynb` / `llm_mcp_buyer.ipynb` / `search_x402_buyer.ipynb` — the buyer's
  side of the deployed twins (`wrapFetchWithPayment` against the `*-agent.fretchen.eu`
  endpoints). While trialing, point a notebook's `SERVER` at the trial hostnames the same
  way — the documented pattern there is the origin of the facilitator folder's
  `FACILITATOR_URL` knob.
