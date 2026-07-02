# Health Monitoring Report - Sentinel AI

**Date:** 2026-07-02

## Health Endpoints Implemented
To support container orchestration (Docker, Kubernetes) and load balancer routing, three standard health endpoints were integrated into the FastAPI backend (`InvestigatorAPI.py`):

1. **`/health` (Basic Health Check):**
   - Returns a simple `{"status": "ok"}`.
   - Purpose: Validates that the HTTP server is accepting connections and has not deadlocked.

2. **`/live` (Liveness Probe):**
   - Returns `{"status": "alive"}`.
   - Purpose: Used by Docker Compose `HEALTHCHECK` and Kubernetes liveness probes to determine if the container needs to be forcefully restarted.

3. **`/ready` (Readiness Probe):**
   - Verifies that the internal `SentinelOrchestrator` has fully loaded the ML models and Knowledge Graph.
   - Returns HTTP 503 if models are still loading into memory.
   - Purpose: Prevents load balancers and the Nginx proxy from sending investigator traffic to a backend instance that is booting up.

## Observability
- All health check requests are actively filtered from standard access logs via the custom `logging_middleware` to prevent log pollution while maintaining high-frequency health monitoring.
