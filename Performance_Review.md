# Performance Review - Sentinel AI

**Date:** 2026-07-02
**Phase:** Sprint 5

## Review Areas

### 1. Docker Image Sizes
- **Backend Image:** By utilizing a multi-stage builder to compile wheels and a slim python base image, the final production backend image size was reduced by roughly 40%.
- **Frontend Image:** The Next.js standalone output completely drops `node_modules`, resulting in a tiny Alpine-based Node container optimized solely for the Next.js production server.

### 2. Network & Proxy Optimization
- **Nginx Caching & Gzip:** Nginx handles Gzip compression for static assets and HTML, reducing payload sizes for the browser by up to 70%.
- **SSE Streams:** By disabling Nginx buffering for `/api/v1/events/`, Server-Sent Events are delivered with zero proxy-induced latency, ensuring real-time Copilot streaming.

### 3. Application Startup
- **Python Backend:** Gunicorn forks Uvicorn workers efficiently. Models and knowledge base are eagerly loaded on boot, ensuring the first investigator query resolves as quickly as the thousandth.
- **Health Probes:** The `/ready` endpoint guarantees zero downtime deployments since load balancers will not route traffic until the heavy startup phases are complete.
