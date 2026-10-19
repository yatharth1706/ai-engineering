from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.gemini_client import GeminiClient, GeminiErrorException, list_gemini_models
from fastapi.middleware.cors import CORSMiddleware

class LLMInputPayload(BaseModel):
    question: str = Field(min_length=1)
    model: str = 'gemini-3.8-flash'
    temperature: float = Field(default=0.2, ge=0, le=2)

class LLMUsage(BaseModel):
    input_tokens: int
    output_tokens: int

class LLMOutput(BaseModel):
    text: str
    model: str
    usage: LLMUsage



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:5173"],
    allow_headers = ["*"],
    allow_methods = ["*"]
)

@app.get("/health")
def check_health():
    return {
        "status": "ok"
    }

@app.get("/api/models")
async def get_models():
    try:
        return await list_gemini_models()
    except GeminiErrorException as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

@app.post("/api/generate")
async def send_to_llm(payload: LLMInputPayload):
    try:
        gemini_client = GeminiClient(payload.model)

        result = await gemini_client.generate(payload.question, payload.temperature)
    except GeminiErrorException as exc:
        message = str(exc)

        if "timed out" in message:
            status_code = 504
        elif "rate limit" in message or "unavailable" in message:
            status_code = 503
        else:
            status_code = 502

        raise HTTPException(
            status_code=status_code,
            detail=message,
        ) from exc

    return LLMOutput(
        model=payload.model,
        text=result.text,
        usage=LLMUsage(
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens
        )
    )

@app.post("/api/generate/stream")
async def generate_llm_stream(payload: LLMInputPayload):
    client = GeminiClient(payload.model)
    return StreamingResponse(
        client.generate_stream(payload.question, payload.temperature),
        media_type="text/plain"
    )
