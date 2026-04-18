FROM ghcr.io/astral-sh/uv:python3.11-trixie-slim

WORKDIR /app

# Install dependencies first (cache layer)
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-install-project --no-dev

# Copy application code
COPY handler.py ./
COPY agent/ ./agent/

# Activate the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8080
CMD ["python", "handler.py"]
