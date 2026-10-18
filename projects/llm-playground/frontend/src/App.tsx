import { useEffect, useState } from 'react'
import { generate, getAvailableModels, type GenerateResponse, type Model } from './api'
import ResponsePanel from './components/ResponsePanel'

const DEFAULT_MODEL = 'gemini-3.8-flash'
const DEFAULT_TEMPERATURE = 0.2

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function App() {
  const [question, setQuestion] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE)

  const [models, setModels] = useState<Model[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const [response, setResponse] = useState<GenerateResponse | null>(null)
  const [responseModel, setResponseModel] = useState(DEFAULT_MODEL)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAvailableModels()
      .then((list) => {
        setModels(list)
        if (list.length && !list.some((m) => m.id === DEFAULT_MODEL)) setModel(list[0].id)
      })
      .catch((err: Error) => setModelsError(err.message))
      .finally(() => setModelsLoading(false))
  }, [])

  const temperatureValid = temperature >= 0 && temperature <= 2
  const canSend = question.trim().length >= 3 && temperatureValid && !generating

  async function handleSubmit(e?: { preventDefault(): void }) {
    e?.preventDefault()
    if (!canSend) return

    setGenerating(true)
    setError(null)
    try {
      const result = await generate({ question: question.trim(), model, temperature })
      setResponse(result)
      setResponseModel(model)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  function handleReset() {
    setQuestion('')
    setResponse(null)
    setError(null)
  }

  const inputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-900">LLM Playground</h1>
        <p className="mt-1 text-sm text-slate-500">Ask a question and pick a model to generate a response.</p>

        <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="question" className="sr-only">
            Question
          </label>
          <textarea
            id="question"
            rows={8}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e)
            }}
            placeholder="Type your question here…"
            disabled={generating}
            className={`${inputClass} w-full resize-y`}
          />

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex min-w-48 flex-1 flex-col gap-1">
              <label htmlFor="model" className="text-xs font-medium text-slate-600">
                Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={modelsLoading || generating}
                className={inputClass}
              >
                {modelsLoading && <option>Loading models…</option>}
                {!modelsLoading && models.length === 0 && <option value={DEFAULT_MODEL}>{DEFAULT_MODEL}</option>}
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-28 flex-col gap-1">
              <label htmlFor="temperature" className="text-xs font-medium text-slate-600">
                Temperature
              </label>
              <input
                id="temperature"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(e.target.valueAsNumber)}
                disabled={generating}
                className={`${inputClass} ${temperatureValid ? '' : 'border-red-400'}`}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={generating}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating && <Spinner />}
                {generating ? 'Generating…' : 'Send'}
              </button>
            </div>
          </div>

          {!temperatureValid && <p className="mt-2 text-xs text-red-600">Temperature must be between 0 and 2.</p>}
          {modelsError && (
            <p className="mt-2 text-xs text-amber-700">Couldn't load models ({modelsError}). Using default.</p>
          )}
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {response && <ResponsePanel response={response} model={responseModel} />}
      </div>
    </main>
  )
}

export default App
