from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
import json

router = APIRouter(prefix="/api/v1/stream", tags=["Realtime"])

async def event_generator():
    yield f"data: {json.dumps({'type': 'ping', 'message': 'connected'})}\n\n"
    while True:
        await asyncio.sleep(15)
        yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"

@router.get("")
async def stream_events():
    return StreamingResponse(event_generator(), media_type="text/event-stream")
