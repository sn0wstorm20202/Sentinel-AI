from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import time

from ..copilot.SentinelOrchestrator import SentinelOrchestrator
from .GraphAPI import router as graph_router

app = FastAPI(
    title="Sentinel Investigator API",
    description="Enterprise API powering the Fraud Intelligence Dashboard.",
    version="4.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Placeholder
def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and "Bearer " in auth_header:
        pass # valid
    # In production, we'd raise 401. For RC-1, we placeholder it.

# Rate Limiting Placeholder Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Mock rate limiting: tracking IP requests
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-RateLimit-Limit"] = "100"
    return response

# Mount Graph Intelligence routes
app.include_router(graph_router, dependencies=[Depends(verify_token)])

# Initialize Orchestrator globally
# Note: Paths adjusted assuming running from root directory.
orchestrator = SentinelOrchestrator(
    models_dir="models", configs_dir="configs", knowledge_dir="knowledge"
)


class TransactionRequest(BaseModel):
    request_id: str
    case_id: str
    transaction_id: str
    timestamp: str
    features: Dict[str, Any]


@app.get("/")
def health_check():
    return {"status": "Sentinel Investigator API is running."}


@app.post("/api/v1/cases/explain")
def explain_case(req: TransactionRequest):
    try:
        # Pass to the Orchestrator
        case = orchestrator.process_transaction(
            transaction_data=req.features,
            transaction_id=req.transaction_id,
            case_id=req.case_id,
        )
        # Enforce JSON Contract via the Case object serialization
        return case.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Example usage to run: uvicorn src.api.InvestigatorAPI:app --reload
