# Notebooks

This directory contains Jupyter notebooks for blog-post research and analysis (game
theory, quantum computing, economics/toll scenarios, and similar topics) — not tied to
any specific package in this repo. Notebooks exploring a particular package's own
backend/API behavior live with that package instead (e.g. `scw_js/notebooks/`,
`growth-agent/notebooks/`, `x402_facilitator/notebooks/`); the merkle-tree/IONOS/BFL/
genimg-client notebooks that used to live here moved to `scw_js/notebooks/` for that
reason.

## Setup

1. Install dependencies:

   ```bash
   uv sync
   ```

2. Start Jupyter:
   ```bash
   uv run jupyter notebook
   ```

## Dependencies

- **jupyter**: For running Jupyter notebooks
- **ipykernel**: Jupyter kernel for Python
- **matplotlib**: For plotting and visualization
- **numpy**: For numerical computations
- **pandas**: For data manipulation
- **hashlib-compat**: For hashing utilities

## Development

Code formatting and linting is handled by **ruff**:

```bash
uv run ruff format .
uv run ruff check .
```

### Kernel for VSCode

```bash
uv run python -m ipykernel install --user --name=merkle-tree-notebooks
```
