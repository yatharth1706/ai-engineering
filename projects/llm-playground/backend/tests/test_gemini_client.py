import httpx
import pytest

from app.gemini_client import GeminiClient, GeminiErrorException

@pytest.mark.asyncio
async def test_generate_returns_text_and_usage(monkeypatch):
    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Hello from Gemini"}]
                        }
                    }
                ],
                "usageMetadata": {
                    "promptTokenCount": 10,
                    "candidatesTokenCount": 5,
                },
            },
        )

    monkeypatch.setattr(
        "app.gemini_client.settings.gemini_api_key",
        "test-api-key",
    )
    transport = httpx.MockTransport(mock_handler)
    client = GeminiClient("test-model", transport=transport)

    result = await client.generate("Say hello", 0.2)

    assert result.text == "Hello from Gemini"
    assert result.input_tokens == 10
    assert result.output_tokens == 5

@pytest.mark.asyncio
async def test_generate_returns_empty_candidates(monkeypatch):
    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "candidates": []
            },
        )

    monkeypatch.setattr(
        "app.gemini_client.settings.gemini_api_key",
        "test-api-key",
    )
    transport = httpx.MockTransport(mock_handler)
    client = GeminiClient("test-model", transport=transport)

    with pytest.raises(
        GeminiErrorException,
        match="Gemini returned no candidates"
    ):
        await client.generate("Hi Gemini", 0.2)

