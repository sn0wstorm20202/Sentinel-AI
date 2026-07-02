# Docker Containerization Report - Sentinel AI

**Date:** 2026-07-02

## 1. Backend Container (FastAPI + Python)
- **Base Image:** `python:3.10-slim`
- **Multi-stage Build:** Dependencies are compiled into wheels in a `builder` stage, ensuring build tools (`gcc`, etc.) are excluded from the final production runtime.
- **Security:** A non-root user (`sentinel`) is created and given ownership of the application directory. The container executes as this non-root user.
- **Optimization:** Caching is leveraged efficiently. Layers are ordered to prevent cache invalidation when only source code changes.

## 2. Frontend Container (Next.js)
- **Base Image:** `node:20-alpine`
- **Multi-stage Build:** Next.js compiles the React code in a `builder` stage. The final `runner` stage only pulls in the standalone output folder.
- **Standalone Mode:** Enabled via `next.config.ts`, dropping `node_modules` weight dramatically and optimizing boot time.
- **Security:** Executes as a non-root `nextjs` user.

## 3. Ignore Rules
- Comprehensive `.dockerignore` files prevent local environments (`.venv`), node modules, logs, and development artifacts from bloat-loading the Docker build context.
