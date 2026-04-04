import React, { useState } from "react";
import { useSocket } from "../hooks/useSocket";

const Sentinel = () => {
  const [analysis, setAnalysis] = useState(null);

  useSocket("analysis", (data) => {
    setAnalysis(data);
  });

  return (
    <div className="p-4 text-white bg-black min-h-screen">
      <h1 className="text-2xl mb-4">Sentinel AI</h1>

      {analysis && (
        <div>
          <p>{analysis.summary}</p>
          <ul>
            {analysis.ttps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sentinel;