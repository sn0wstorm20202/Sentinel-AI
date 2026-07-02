FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Production image
FROM python:3.12-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r sentinel && useradd -r -g sentinel sentinel

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Install dependencies from wheels
RUN pip install --no-cache /wheels/*

# Copy source code
COPY src/ /app/src/
COPY data/ /app/data/
COPY models/ /app/models/
COPY configs/ /app/configs/
COPY knowledge/ /app/knowledge/
COPY reports/ /app/reports/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV WORKERS=4

# Chown all files to non-root user
RUN chown -R sentinel:sentinel /app

# Switch to non-root user
USER sentinel

# Expose port
EXPOSE 8000

# Health check (will rely on /live endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/live || exit 1

# Graceful start via Gunicorn with Uvicorn workers
CMD ["sh", "-c", "gunicorn src.api.InvestigatorAPI:app -w ${WORKERS:-4} -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-8000} --access-logfile - --error-logfile -"]
