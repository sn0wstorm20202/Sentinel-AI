# Environment Variables Dictionary

This document details all configuration parameters supported by the Sentinel AI ecosystem.

## Frontend (Next.js) Variables
| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `NEXT_PUBLIC_API_URL` | The public-facing URL where the Sentinel API is accessible. | `http://localhost:8080` | Yes |
| `NODE_ENV` | Overridden automatically by Docker to `production`. | `production` | Auto |

## Backend (FastAPI) Variables
| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `PORT` | Internal port the Uvicorn/Gunicorn server binds to. | `8000` | Yes |
| `WORKERS` | Number of Gunicorn worker processes. Scale linearly with CPU cores. | `4` | Yes |
| `JWT_SECRET` | 256-bit secret used to sign stateless JWT auth tokens. | None | Yes (Prod) |
| `ALLOWED_ORIGINS` | Comma-separated list of CORS origins allowed to access the API. | `*` | Yes (Prod) |

## Example Secure `.env` File
```ini
NEXT_PUBLIC_API_URL=https://sentinel.internal.corp.com
PORT=8000
WORKERS=8
JWT_SECRET=f3a29b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0
ALLOWED_ORIGINS=https://sentinel.internal.corp.com
```
