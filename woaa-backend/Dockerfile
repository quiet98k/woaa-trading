FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy app files
COPY . .

# Install dependencies
RUN uv sync --frozen --no-cache

# Expose port
EXPOSE 80

# Run FastAPI app
CMD ["/app/.venv/bin/fastapi", "run", "app/main.py", "--port", "80", "--host", "0.0.0.0"]
