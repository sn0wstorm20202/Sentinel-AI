# Infrastructure Report - Sentinel AI

**Date:** 2026-07-02

## Infrastructure as Code (IaC)
The core infrastructure for Sentinel AI is defined entirely in code, prioritizing reproducibility and environment parity.

### 1. Docker Compose
The `docker-compose.yml` serves as the primary infrastructure definition, encapsulating:
- **Networks:** A dedicated bridged network (`sentinel-network`) isolates backend communications.
- **Services:** Frontend, Backend, and Nginx.
- **Environment bindings:** Environment variables are strictly injected via `.env` files, keeping secrets out of the codebase.

### 2. Networking & Proxy
- **Nginx (`nginx.conf`):** Configured as the edge router.
  - Passes standard API requests to FastAPI with client IP preservation (`X-Forwarded-For`).
  - Configures Server-Sent Events (SSE) by disabling proxy buffering and chunked transfer encoding on `/api/v1/events/`.
  - Upgrades WebSockets where necessary.

### 3. Scaling Readiness
- **Backend:** Gunicorn is configured to utilize multiple Uvicorn worker processes based on the `WORKERS` environment variable, enabling vertical scaling based on CPU cores.
- **Frontend:** Next.js standalone mode optimizes the Node.js event loop and minimizes the runtime footprint, allowing horizontal scaling behind a load balancer if needed.
