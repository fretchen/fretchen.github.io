# Merkle Tree Notebooks

This directory contains Jupyter notebooks for exploring Merkle trees and their application to LLM API batching.

## Setup

1. Install Poetry if you haven't already:
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Activate the virtual environment:
   ```bash
   poetry shell
   ```

4. Start Jupyter:
   ```bash
   poetry run jupyter notebook
   ```

## Notebooks

- `merkle_tree.ipynb` - Basic exploration of Merkle tree concepts and implementation

## Dependencies

- **jupyter**: For running Jupyter notebooks
- **ipykernel**: Jupyter kernel for Python
- **matplotlib**: For plotting and visualization
- **numpy**: For numerical computations
- **pandas**: For data manipulation
- **hashlib-compat**: For hashing utilities

## Development

Code formatting is handled by:
- **black**: Code formatter
- **isort**: Import sorter
- **flake8**: Linter

Run formatting:
```bash
poetry run black .
poetry run isort .
```

Run linting:
```bash
poetry run flake8 .
```
