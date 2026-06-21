# =============================================================================
# Stage 1 — Build dependencies
# =============================================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build-time system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python build dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir .

# Prune unneeded build artifacts
RUN find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11/site-packages -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true


# =============================================================================
# Stage 2 — Runtime image
# =============================================================================
FROM python:3.11-slim AS runtime

# Create non-root user early to avoid permission churn
RUN groupadd --system --gid 1000 pantheon && \
    useradd --system --gid pantheon --uid 1000 --no-create-home --shell /bin/false pantheon

# Runtime system dependencies (only libpq for psycopg2/asyncpg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder (no build deps leak)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Working directory
WORKDIR /app

# Application code
COPY backend/ ./backend/
COPY alembic.ini ./alembic.ini
COPY alembic/ ./alembic/

# Ensure logs directory exists with correct permissions
RUN mkdir -p /app/logs && chown -R pantheon:pantheon /app

# Switch to non-root user
USER pantheon

# Health check: verify the API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:8000/health || exit 1

# Port
EXPOSE 8000

# Default entrypoint
ENTRYPOINT ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
