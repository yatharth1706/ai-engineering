// Requests go through the Vite dev proxy (/api/* -> http://localhost:8000/api/*)
const API_BASE = '/api'

export type Model = {
  id: string
  name: string
}

export type GenerateRequest = {
  question: string
  model: string
  temperature: number
}

export type GenerateResponse = {
  text: string
  model: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
      else if (Array.isArray(body.detail)) message = body.detail.map((d: { msg: string }) => d.msg).join(', ')
    } catch {
      // response body was not JSON; keep the generic message
    }
    throw new Error(message)
  }

  return res.json()
}

export function getAvailableModels() {
  return request<Model[]>('/models')
}

export function generate(payload: GenerateRequest) {
  return request<GenerateResponse>('/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
