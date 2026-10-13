import { useState } from "react";
import "./App.css";
import Playground from "./components/Playground";

function App() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h1>LLM Playground</h1>
      <Playground />
    </div>
  );
}

export default App;
