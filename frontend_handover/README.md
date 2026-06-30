# Sentinel AI — Frontend Handover Package

Welcome to the Sentinel AI frontend integration! This folder contains everything you need to build the React/Vite Investigator Dashboard.

## Contents
- **`API_REFERENCE.md`**: Complete mapping of all REST API endpoints.
- **`JSON_CONTRACTS.md`**: The strict JSON schemas (Frontend Contract) for the backend payload.
- **`FRONTEND_INTEGRATION.md`**: Best practices for integrating the intelligence into React components.
- **`openapi.json`**: The complete OpenAPI spec. You can import this into Swagger or use it to generate TypeScript interfaces.
- **`Sentinel_API_Postman_Collection.json`**: Postman collection for manual testing.
- **`sample_requests/`**: Examples of payloads to send to the backend.
- **`sample_responses/`**: Examples of exactly what the backend will return.
- **`.env.example`**: Required frontend environment variables for API communication.

## Quick Start
1. Import `Sentinel_API_Postman_Collection.json` into Postman.
2. Spin up the backend: `uvicorn src.api.InvestigatorAPI:app --reload`
3. Hit `POST /api/v1/cases/explain` with the body from `sample_requests/explain_case.json`.
4. Review the returned structure in `sample_responses/explain_case_response.json` to model your React State.
