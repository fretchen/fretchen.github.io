# growth-agent — agent rules

AI growth agent cron container (Python, LangGraph). See [`README.md`](./README.md) for the
architecture, the LLM provider, the project structure, and running individual tasks or the
full handler locally, and [`SECURITY.md`](./SECURITY.md) for the agent-layer security
findings.

Python package, not npm: `uv` is the package manager (`uv sync --all-extras`), tests run
with `uv run pytest`, lint/format with `uv run ruff` (line-length 100, not the repo's
Prettier 120).
