# Troubleshooting Guide - Sentinel AI

## 1. Copilot Responses Are Hanging or Spinning
**Symptom:** AI Copilot stays in a "Querying Sentinel backend..." state indefinitely.
**Cause:** Nginx might be buffering the Server-Sent Events (SSE) stream, or the backend is failing silently.
**Resolution:**
1. Verify `nginx.conf` has `proxy_buffering off` for `/api/v1/events/`.
2. Check backend logs: `docker compose logs backend | grep ERROR`.

## 2. Frontend Fails to Start (502 Bad Gateway)
**Symptom:** Navigating to `http://localhost:8080` returns an Nginx 502 error.
**Cause:** The frontend container failed to boot, or it is still waiting for the backend to become healthy.
**Resolution:**
1. Check container status: `docker compose ps`. 
2. If `frontend` is stuck in `starting`, inspect the backend health: `curl http://localhost:8000/health`. The frontend depends on backend health.

## 3. High Memory Usage in Backend
**Symptom:** Backend container is OOMKilled by Docker.
**Cause:** `WORKERS` variable is set too high for the host's available RAM, causing multiple ML models to load into memory concurrently.
**Resolution:** Reduce `WORKERS` in `.env` to 2 or 1, then restart the backend container.
