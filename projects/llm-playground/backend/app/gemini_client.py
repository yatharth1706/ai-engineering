import httpx
from pydantic import BaseModel

from app.settings import settings

class GeminiErrorException(Exception):
    pass

class GeminiResponse(BaseModel):
    text: str
    input_tokens: int | None = None
    output_tokens: int | None = None

class GeminiClient:
    def __init__(self, model: str, transport = None):
        self.api_key = settings.gemini_api_key
        self.model = model
        self.transport = transport
        self.api_url = f'https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent'

    async def generate(self, question: str, temperature: float):
        try:
            async with httpx.AsyncClient(transport=self.transport, timeout=httpx.Timeout(60.0, connect=10.0)) as client:
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

        except httpx.TimeoutException as exc:
            raise GeminiErrorException(
                "Gemini request timed out"
            ) from exc

        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code

            if status == 429:
                message = "Gemini rate limit exceeded"
            elif status >= 500:
                message = "Gemini service is unavailable"
            else:
                message = "Gemini rejected the request"

            raise GeminiErrorException(message) from exc
        except httpx.RequestError as exc:
            raise GeminiErrorException("Could not connect to Gemini") from exc
        except ValueError as exc:
            raise GeminiErrorException("Invalid JSON response") from exc

        
        if not isinstance(result, dict):
            raise GeminiErrorException("Invalid Gemini response")

        candidates = result.get("candidates")

        if not isinstance(candidates, list) or not candidates:
            raise GeminiErrorException("Gemini returned no candidates")

        candidate = candidates[0]
        if not isinstance(candidate, dict):
            raise GeminiErrorException("Invalid candidate")

        content = candidate.get("content")
        if not isinstance(content, dict):
            raise GeminiErrorException("Missing response content")

        parts = content.get("parts")
        if not isinstance(parts, list):
            raise GeminiErrorException("Missing response parts")

        text = next(
            (
                part["text"]
                for part in parts
                if isinstance(part, dict)
                and isinstance(part.get("text"), str)
            ),
            None,
        )

        if text is None:
            raise GeminiErrorException("Gemini returned no usable text")

        usage = result.get("usageMetadata")
        if not isinstance(usage, dict):
            usage = {}

        return GeminiResponse(
            text=text,
            input_tokens=usage.get("promptTokenCount"),
            output_tokens=usage.get("candidatesTokenCount"),
        )

async def list_gemini_models() -> list[dict]:
    """Return models that support generateContent, as [{id, name}]."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=10.0)) as client:
            response = await client.get(
                "https://generativelanguage.googleapis.com/v1beta/models",
                headers={"x-goog-api-key": settings.gemini_api_key},
                params={"pageSize": 1000},
            )
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPError as exc:
        raise GeminiErrorException("Could not fetch Gemini models") from exc

    models = []
    for m in result.get("models", []):
        if "generateContent" not in m.get("supportedGenerationMethods", []):
            continue
        model_id = m.get("name", "").removeprefix("models/")
        if not model_id.startswith("gemini"):
            continue
        models.append({"id": model_id, "name": m.get("displayName", model_id)})

    return models
