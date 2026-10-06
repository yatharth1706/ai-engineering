# 01 — LLM Engineering

## Goal

Understand the practical foundations of LLM-powered applications well enough to build and reason about them as a software engineer.

## 1. What Is an LLM?

At a practical level, an LLM predicts the next token given the tokens that came before it.

```text
"The capital of France is" → " Paris"
```

Generation conceptually looks like:

```text
Prompt → Tokenization → Tokens → LLM → Next-token probabilities → Selected token → ... → Response
```

## 2. Tokens

LLMs process **tokens**, not simply words. A token can be a complete word, part of a word, punctuation, whitespace, or symbols. Exact tokenization depends on the tokenizer/model.

Example (approximate):

```text
"Hello, how are you?"
→ ["Hello", ",", " how", " are", " you", "?"]
```

Tokens affect pricing, context limits, latency, and model capacity.

## 3. Context Window

The context window is the amount of information a model can consider/process for a request, subject to the model/API limits.

```text
┌──────────────────────────────┐
│ System instructions          │
│ Conversation history         │
│ User input                   │
│ Retrieved context            │
│ Tool results                 │
├──────────────────────────────┤
│ Generated output             │
└──────────────────────────────┘
```

Everything placed into context can affect token usage, cost, latency, and available room for generation.

## 4. Messages and Roles

Common roles include `system`, `user`, `assistant`, and `tool`.

```python
messages = [
    {"role": "system", "content": "You are a senior backend engineering tutor."},
    {"role": "user", "content": "Explain Redis replication."}
]
```

- **system:** instructions/behavior
- **user:** request
- **assistant:** previous model responses
- **tool:** external tool results

## 5. Temperature

Temperature controls the amount of randomness/variation used when sampling from the model's probability distribution.

```text
Lower temperature → less variation → more deterministic
Higher temperature → more variation → potentially more creative/diverse
```

Temperature does not mean intelligence or guaranteed accuracy. Output quality also depends on model capability, prompt quality, context quality, and the task.

Typical use:
- Lower randomness: classification, extraction, deterministic workflows
- Higher randomness: brainstorming, creative writing, varied ideas

## 6. Input vs Output Tokens

Example:

```text
Input:  2,000 tokens
Output:   500 tokens
Total:   2,500 tokens
```

Pricing may differ between input and output tokens.

Production implication:

```text
10,000 requests/day × 20,000 input tokens = 200M input tokens/day
```

This is why prompt size, context management, RAG, caching, and model selection matter.

## 7. Latency

A simplified AI request:

```text
Client → Network → API Gateway → Model Queue → Inference → Generation → Client
```

Two useful metrics:

- **TTFT (Time to First Token):** how quickly the first token arrives.
- **Time to Complete:** how long until the whole response is generated.

## 8. Streaming

Without streaming:

```text
Request → wait → complete response
```

With streaming:

```text
Request → "Here" → "Here is" → "Here is how" → ...
```

Streaming improves perceived latency because users see progress immediately, even if total generation time is similar.

Useful for chat interfaces, coding assistants, and long responses.

## 9. Model Selection

There is rarely one universally best model. Ask:

> What is the cheapest/fastest model that can reliably solve this task?

```text
Classification       → smaller/cheaper model
Simple extraction    → fast model
Complex reasoning    → reasoning-capable model
Huge context         → long-context model
```

Production AI engineering often involves model routing rather than always choosing the largest model.

## Core Mental Model

```text
                 APPLICATION
                      │
                      ▼
                   Prompt
                      │
                      ▼
                 Tokenization
                      │
                      ▼
                    LLM
                      │
              Token probabilities
                      │
                      ▼
               Token generation
                      │
                      ▼
                  Response
                      │
                      ▼
               Stream / return
```

The LLM is only one component. AI Engineering happens largely in the surrounding application:

```text
Your App
├── Prompts
├── Context
├── Tools
├── Retries
├── Caching
├── Observability
└── Cost control
        │
        ▼
       LLM
```

## Key Takeaways

1. LLMs generate tokens sequentially.
2. Tokens are the basic unit of model processing and usage.
3. Context is the information the model considers for a request.
4. Larger context can increase cost and latency.
5. Temperature controls variation, not intelligence.
6. Streaming improves perceived latency.
7. Model selection should depend on task and reliability requirements.
8. The LLM is only one component of a production AI system.
9. AI Engineering is about building reliable systems around probabilistic models.

## Project — AI Playground

```text
Frontend
   │ POST /chat
   ▼
FastAPI → AI Service → LLM API → Streaming Response → Frontend
```

### V1
- Python + FastAPI
- One LLM provider
- `/chat` endpoint
- Streaming responses
- Simple frontend
- Token usage/cost information where available

### Future
- Multiple models
- Structured outputs
- Model routing
- Token/cost dashboard
- Redis caching
- Rate limiting
- Observability
- Fallback models

## Next Chapter

**02 — RAG:** embeddings, chunking, vector search, pgvector, retrieval, and citations.
