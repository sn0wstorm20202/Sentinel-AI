# Deployment Report - Sentinel AI

**Date:** 2026-07-02

## Deployment Architecture
Sentinel AI employs a robust containerized architecture orchestrated by Docker Compose, designed for single-node enterprise deployment or direct migration to Kubernetes.

### Components
1. **Nginx Reverse Proxy:** Acts as the primary ingress. It terminates connections, handles Gzip compression, enforces security headers, and routes traffic (`/api`, `/events`, `/docs` -> Backend, `/` -> Frontend).
2. **Frontend Service:** Next.js running in standalone mode on a lightweight Node Alpine image. It connects to the backend exclusively through the Nginx proxy (avoiding CORS complexities in production).
3. **Backend Service:** FastAPI running on Gunicorn with Uvicorn workers. It loads machine learning models and knowledge graphs into memory upon startup.

## Deployment Validation
- **Cold Boot:** Running `docker compose up -d` correctly provisions the network, builds the multi-stage images, and starts the services.
- **Dependency Ordering:** The `depends_on` block with `condition: service_healthy` ensures that the Frontend and Nginx do not accept traffic until the Backend's `/health` check succeeds.
- **Data Persistence:** Volumes are mapped for Nginx configuration, with future readiness for external database bindings.

## CI/CD Integration
Automated deployment validations are configured via GitHub Actions, which build the containers on every main branch update to prevent deployment regressions.
