import os
import json
import shutil
import pandas as pd
import numpy as np
from pathlib import Path
from fastapi.testclient import TestClient
from src.api.InvestigatorAPI import app

def create_handover():
    print("Starting Stage 12 - Generating Frontend Handover Package...")
    
    base_dir = Path("frontend_handover")
    base_dir.mkdir(exist_ok=True)
    (base_dir / "sample_requests").mkdir(exist_ok=True)
    (base_dir / "sample_responses").mkdir(exist_ok=True)
    
    # 1. Copy documentation
    docs_to_copy = {
        "docs/07_API_REFERENCE.md": "API_REFERENCE.md",
        "docs/JSON_CONTRACTS.md": "JSON_CONTRACTS.md",
        "docs/08_FRONTEND_INTEGRATION.md": "FRONTEND_INTEGRATION.md",
        ".env.example": ".env.example"
    }
    
    for src, dst in docs_to_copy.items():
        src_path = Path(src)
        if src_path.exists():
            shutil.copy(src_path, base_dir / dst)
            
    # 2. Dump OpenAPI Spec
    openapi_schema = app.openapi()
    with open(base_dir / "openapi.json", "w") as f:
        json.dump(openapi_schema, f, indent=2)
        
    # 3. Generate Sample Requests & Responses
    client = TestClient(app)
    
    # Generate explain request
    df = pd.read_csv("data/selected/approved_features.csv")
    fraud_df = df[df["F3924"] == 1].drop(columns=["F3924"])
    txn_features = fraud_df.iloc[0].to_dict()
    
    clean_features = {}
    for k, v in txn_features.items():
        if pd.isna(v): clean_features[k] = 0.0
        elif isinstance(v, (np.int64, np.int32)): clean_features[k] = int(v)
        elif isinstance(v, (np.float64, np.float32)): clean_features[k] = float(v)
        else: clean_features[k] = v

    explain_req = {
        "request_id": "REQ_001",
        "case_id": "CASE_999",
        "transaction_id": "TXN_888",
        "timestamp": "2026-07-01T00:00:00Z",
        "features": clean_features
    }
    
    with open(base_dir / "sample_requests/explain_case.json", "w") as f:
        json.dump(explain_req, f, indent=2)
        
    # Get response
    res = client.post("/api/v1/cases/explain", json=explain_req)
    with open(base_dir / "sample_responses/explain_case_response.json", "w") as f:
        json.dump(res.json(), f, indent=2)
        
    # Graph metadata
    res_meta = client.get("/api/v1/graph/metadata")
    with open(base_dir / "sample_responses/graph_metadata.json", "w") as f:
        json.dump(res_meta.json(), f, indent=2)
        
    # 4. Generate Postman Collection
    postman = {
        "info": {
            "name": "Sentinel AI Investigator API",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": [
            {
                "name": "Health Check",
                "request": {
                    "method": "GET",
                    "url": {"raw": "{{base_url}}/", "host": ["{{base_url}}"], "path": [""]}
                }
            },
            {
                "name": "Explain Case",
                "request": {
                    "method": "POST",
                    "header": [{"key": "Content-Type", "value": "application/json"}],
                    "body": {
                        "mode": "raw",
                        "raw": json.dumps(explain_req, indent=2)
                    },
                    "url": {"raw": "{{base_url}}/api/v1/cases/explain", "host": ["{{base_url}}"], "path": ["api", "v1", "cases", "explain"]}
                }
            },
            {
                "name": "Graph Statistics",
                "request": {
                    "method": "GET",
                    "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                    "url": {"raw": "{{base_url}}/api/v1/graph/statistics", "host": ["{{base_url}}"], "path": ["api", "v1", "graph", "statistics"]}
                }
            }
        ],
        "variable": [
            {"key": "base_url", "value": "http://localhost:8000"},
            {"key": "token", "value": "TEST_TOKEN"}
        ]
    }
    
    with open(base_dir / "Sentinel_API_Postman_Collection.json", "w") as f:
        json.dump(postman, f, indent=2)
        
    # 5. README.md
    readme = """# Sentinel AI — Frontend Handover Package

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
"""
    with open(base_dir / "README.md", "w") as f:
        f.write(readme)
        
    print("Frontend Handover Package successfully generated at frontend_handover/")

if __name__ == "__main__":
    create_handover()
