import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { GenerateResponse } from '../api'

type Props = {
  response: GenerateResponse
  model: string
}

export default function ResponsePanel({ response, model }: Props) {
  return (
    <section
      aria-labelledby="response-title"
      className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="border-b border-slate-200 px-5 py-3">
        <h2 id="response-title" className="text-base font-semibold text-slate-900">
          Response
        </h2>
        <p className="text-xs text-slate-500">
          {model} · {response.usage.input_tokens} input / {response.usage.output_tokens} output tokens
        </p>
      </header>

      <div className="prose prose-slate max-w-none px-5 py-4 prose-pre:bg-slate-900">
        <Markdown remarkPlugins={[remarkGfm]}>{response.text}</Markdown>
      </div>
    </section>
  )
}
