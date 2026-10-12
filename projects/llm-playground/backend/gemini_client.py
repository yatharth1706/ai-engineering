import httpx
from pydantic import BaseModel

from settings import settings

class GeminiResponse(BaseModel):
    text: str
    input_tokens: int | None = None
    output_tokens: int | None = None

class GeminiClient:
    def __init__(self, model):
        self.api_key = settings.gemini_api_key
        self.model = model
        self.api_url = f'https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent'

    async def generate(self, question: str, temperature: float):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                headers={
                    'x-goog-api-key': self.api_key,
                    'Content-Type': 'application/json',
                },
                json={
                    "contents": [{
                        "parts": [
                            {
                                "text": question
                            }
                        ]
                    }],
                    "generationConfig": {
                        "temperature": temperature
                    }
                }
            )

            response.raise_for_status()
            result = response.json()

            candidates = result.get("candidates", [])

            candidate = candidates[0] if len(candidates) > 0 else None
            usage = result.get("usageMetadata", None)

            if not candidate:
                return None

            return GeminiResponse(
                text = candidate["content"]["parts"][0]["text"],
                input_tokens=usage.get('promptTokenCount', None) if usage else None,
                output_tokens=usage.get("candidatesTokenCount", None) if usage else None
            )
