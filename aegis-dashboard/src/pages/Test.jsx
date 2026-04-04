import { useState } from "react";
import { useSocket } from "../hooks/useSocket";

function Test() {
  const [logs, setLogs] = useState([]);

  useSocket("ping", (data) => {
    setLogs(prev => [data.time, ...prev]);
  });

  return (
    <div style={{ padding: "20px", color: "white", background: "black", height: "100vh" }}>
      <h1>Socket Working</h1>

      {logs.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
    </div>
  );
}

export default Test;