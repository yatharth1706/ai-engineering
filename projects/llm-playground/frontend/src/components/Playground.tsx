import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = "http://localhost:8000";
const DEFAULT_MODEL = "gemini-3.8-flash";

type ModelOption = { id: string; name: string };

function Playground() {
  const [text, setText] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [models, setModels] = useState<ModelOption[]>([
    { id: DEFAULT_MODEL, name: "Gemini 3.8 Flash" },
  ]);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [inputTokens, setInputTokens] = useState<number | null>(null);
  const [outputTokens, setOutputTokens] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/models`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: ModelOption[]) => {
        if (data.length > 0) setModels(data);
      })
      .catch(() => {
        // keep the default model if the list can't be loaded
      });
  }, []);

  const handleSendToLLM = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: text,
          model: model,
          temperature: temperature,
        }),
      });
      const data = await result.json();

      if (!result.ok) {
        setResponse("");
        setError(
          typeof data.detail === "string" ? data.detail : "Request failed",
        );
        return;
      }

      setResponse(data.text);
      setInputTokens(data.usage?.input_tokens ?? null);
      setOutputTokens(data.usage?.output_tokens ?? null);
    } catch {
      setError("Could not reach the backend");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTemperature(0.2);
    setResponse("");
    setError("");
    setText("");
    setModel(DEFAULT_MODEL);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* textarea */}
      <h3>Text</h3>
      <textarea
        className="border border-gray-200 w-full h-44 p-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {/* footer with dropdowns containing models, temperature and send button */}
      <div className="flex gap-3">
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          className="w-14"
          onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
        />
        <button
          className="bg-sky-400 text-white border border-sky-500 px-2 py-1 rounded-md disabled:opacity-50"
          onClick={handleSendToLLM}
          disabled={loading || !text.trim()}
        >
          Send
        </button>
        <button
          className="bg-gray-500 text-white px-2 py-1 rounded-md"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
      <h3>Response</h3>
      <div className="border border-gray-200 w-full min-h-44 p-3 overflow-auto">
        {loading ? (
          <p className="text-gray-500">Generating response ....</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="prose max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>{response}</Markdown>
          </div>
        )}
      </div>
      {response && !loading && (
        <div className="flex gap-3">
          <span>Tokens used - </span>
          <span>Input: {inputTokens ?? "-"}</span>
          <span>Output: {outputTokens ?? "-"}</span>
        </div>
      )}
    </div>
  );
}

export default Playground;
