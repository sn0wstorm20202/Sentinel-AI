# Operations Guide - Sentinel AI

This document provides high-level operational procedures for maintaining Sentinel AI in production.

## 1. Logging and Observability
- **Format:** The backend emits strict JSON logs.
- **Aggregation:** Ingest stdout/stderr from Docker directly into Datadog, Splunk, or ELK.
- **Filtering:** Use the `component` field (e.g., `component: api`) and `level` (e.g., `level: ERROR`) to build monitoring dashboards.

## 2. Managing Container Lifecycle
- **Graceful Shutdown:** Gunicorn listens for `SIGTERM`. When stopping the backend (`docker compose stop backend`), Gunicorn will finish processing in-flight requests before shutting down, ensuring zero dropped investigations.
- **Updates:** To deploy a new version:
  ```bash
  git pull origin main
  docker compose up -d --build
  ```
  Docker Compose will seamlessly recreate containers while maintaining the proxy.

## 3. Storage and State
- Sentinel AI currently relies heavily on in-memory operations for Graph and Case states, keeping the architecture stateless.
- If persistent databases (Postgres/Redis) are bound in the future, ensure volume backups are configured outside the Docker context via cron or snapshotting.
