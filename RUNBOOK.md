# Runbook - Sentinel AI

**Service Name:** Sentinel Investigator OS  
**Tier:** Tier 1 (Critical Enterprise System)  

## System Health
- **Dashboard Check:** `http://<host>:8080/`
- **Backend API Check:** `http://<host>:8080/api/health`

## Routine Procedures

### 1. Restarting the Application
If the application enters an unrecoverable state, execute a clean restart:
```bash
docker compose down
docker compose up -d
```
*Note: This will clear in-memory graph models. The backend will take roughly 5-10 seconds to reload the orchestrator before reporting as `/ready`.*

### 2. Checking Application Logs
To trail logs in real-time and monitor for exceptions:
```bash
docker compose logs -f backend
```
For frontend rendering errors:
```bash
docker compose logs -f frontend
```

### 3. Scaling the Backend
If API requests are queueing, increase the Gunicorn workers:
1. Edit `.env` -> `WORKERS=8`
2. Run `docker compose up -d backend` (this safely reloads the backend container).
