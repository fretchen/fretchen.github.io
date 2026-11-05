# fretchen.github.io

Personal site and the services behind it — a monorepo of independent packages: a Vike/React
website, Solidity contracts on Optimism and Base, and a handful of serverless services
wired together by x402 USDC payments.

| Package               | What it is                                              |
| --------------------- | ------------------------------------------------------- |
| `website/`            | The site + blog (Vike SSR, React 19, Panda CSS)         |
| `eth/`                | NFT and payment contracts (Hardhat, UUPS proxies)       |
| `scw_js/`             | Scaleway Functions: image gen, channel cron, growth API |
| `bunny_js/`           | Bunny Edge Scripts: the x402 llm/search/mcp sellers     |
| `x402_facilitator/`   | EIP-3009 USDC payment facilitator                       |
| `comment_service/`    | Blog comments                                           |
| `analytics/`          | Pageview counter (S3-backed)                            |
| `growth-agent/`       | AI growth agent (Python, LangGraph)                     |
| `observability/`      | Logs and alert rules for the Scaleway functions         |
| `shared/chain-utils/` | Shared Viem utilities                                   |
| `notebooks/`          | Analysis notebooks                                      |

Each package is self-contained — see its `README.md` for setup and its `AGENTS.md` for
coding-agent rules (the root [`AGENTS.md`](AGENTS.md) explains the split).

## License

Blog posts, including the text and all images made by myself, are released freely to the
world under the [WTFPL](http://www.wtfpl.net/).
