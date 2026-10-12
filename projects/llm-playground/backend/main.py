from fastapi import FastAPI
from pydantic import BaseModel, Field

from gemini_client import GeminiClient

class LLMInputPayload(BaseModel):
    question: str = Field(min_length=1)
    model: str = 'gemini-3.8-flash'
    temperature: float = 0.2

class LLMUsage(BaseModel):
    input_tokens: int
    output_tokens: int

class LLMOutput(BaseModel):
    text: str
    model: str
    usage: LLMUsage



app = FastAPI()

@app.get("/health")
def check_health():
    return {
        "status": "ok"
    }

@app.post("/api/generate")
async def send_to_llm(payload: LLMInputPayload):
    gemini_client = GeminiClient(payload.model)

    result = await gemini_client.generate(payload.question, payload.temperature)
    return LLMOutput(
        model=payload.model,
        text=result.text,
        usage=LLMUsage(
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens
        )
    )

