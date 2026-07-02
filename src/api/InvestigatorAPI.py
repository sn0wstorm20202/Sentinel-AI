from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import time

from ..copilot.SentinelOrchestrator import SentinelOrchestrator
from .GraphAPI import router as graph_router
from .CasesAPI import router as cases_router
from .MLOpsAPI import router as mlops_router
from .SSEAPI import router as sse_router
import logging
import json
import uuid

# Structured Logging Setup
class JSONLogFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "component": getattr(record, "component", "backend")
        }
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id
        if hasattr(record, "trace_id"):
            log_record["trace_id"] = record.trace_id
        if hasattr(record, "latency"):
            log_record["latency"] = record.latency
        if hasattr(record, "status_code"):
            log_record["status_code"] = record.status_code
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

logger = logging.getLogger("sentinel")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(JSONLogFormatter())
logger.addHandler(handler)

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

# Structured Logging and Rate Limiting Middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    trace_id = request.headers.get("X-Trace-Id", str(uuid.uuid4()))
    start_time = time.time()
    
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        logger.error(f"Request failed: {str(e)}", extra={"request_id": request_id, "trace_id": trace_id, "exc_info": True})
        raise e
    finally:
        latency = (time.time() - start_time) * 1000  # ms
        
        # Avoid logging noisy health checks constantly
        if request.url.path not in ["/health", "/live", "/ready"]:
            logger.info(
                f"{request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "trace_id": trace_id,
                    "latency": latency,
                    "status_code": status_code,
                    "component": "api"
                }
            )
        
    if 'response' in locals():
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(latency)
        return response

# Mount Graph Intelligence routes
app.include_router(graph_router, dependencies=[Depends(verify_token)])
app.include_router(cases_router, dependencies=[Depends(verify_token)])
app.include_router(mlops_router, dependencies=[Depends(verify_token)])
app.include_router(sse_router, dependencies=[Depends(verify_token)])

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


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "sentinel-api"}

@app.get("/live")
def liveness_check():
    return {"status": "alive"}

@app.get("/ready")
def readiness_check():
    # In production, check DB/Redis connections here
    if orchestrator is not None:
        return {"status": "ready"}
    raise HTTPException(status_code=503, detail="Orchestrator not loaded")


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
