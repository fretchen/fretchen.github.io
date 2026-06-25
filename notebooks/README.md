# Merkle Tree Notebooks

This directory contains Jupyter notebooks for exploring Merkle trees and their application to LLM API batching.

## Setup

1. Install dependencies:

   ```bash
   uv sync
   ```

2. Start Jupyter:
   ```bash
   uv run jupyter notebook
   ```

## Notebooks

- `merkle_tree.ipynb` - Basic exploration of Merkle tree concepts and implementation
- `ionos_llm.ipynb` - Tutorial for text generation using foundation models via the IONOS AI Model Hub API. Demonstrates how to retrieve available models, send prompts to generate text responses, and interpret results. Includes examples for building conversational agents, virtual assistants, and content creation applications using various LLMs including Llama 3.1, Mistral, and other models.

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
