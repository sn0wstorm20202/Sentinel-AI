# CI/CD Architecture - Sentinel AI

Sentinel AI employs GitHub Actions to enforce code quality and automate release artifacts.

## Pipeline Overview
The `.github/workflows/ci.yml` pipeline runs on `push` and `pull_request` to the `main` branch.

### Job 1: Validation
- Checks out the repository.
- Sets up Python 3.10 and Node.js 20 with cache strategies.
- Executes Python backend tests and structural validations.
- Runs `pnpm lint` and `pnpm exec tsc --noEmit` on the frontend.
- Validates the frontend build with `pnpm run build`.

### Job 2: Docker Build (Artifact Generation)
- Triggers only on successful merges/pushes to `main`.
- Builds the production Docker images (`sentinel-ai-backend`, `sentinel-ai-frontend`).
- Prepares the artifacts for registry push.

## Adding New Tests
- **Frontend:** Add Vitest/Jest scripts to `package.json` and append to the Validation job.
- **Backend:** Append `pytest` commands to the Backend Validation step in the YAML file.
