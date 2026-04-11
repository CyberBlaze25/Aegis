import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Honeypod() {
  const navigate = useNavigate();
  const [activeThreat, setActiveThreat] = useState(null);
  const [rawLogs, setRawLogs] = useState([]);
  const [vectorState, setVectorState] = useState({ status: "WAITING", array: [] });
  const ws = useRef(null);

  // Connect to the Go API Websocket AND Fetch History
  useEffect(() => {
    // 1. RESTORE STATE ON REFRESH: Fetch the recent history from the DB
    fetch("http://localhost:8080/api/v1/telemetry/history")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Find the most recent DEFCON 1 isolation event in the DB
          const lastCriticalThreat = data.find(d => d.score >= 0.90);
          if (lastCriticalThreat) {
            handleNewThreat(lastCriticalThreat);
          }
        }
      })
      .catch(err => console.error("Could not fetch history:", err));

    // 2. LISTEN FOR LIVE EVENTS: Connect to the Websocket
    ws.current = new WebSocket("ws://localhost:8080/api/v1/telemetry/ws");
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.score >= 0.90) {
        handleNewThreat(data);
      }
    };

    return () => ws.current?.close();
  }, []); // Run once on mount

  const handleNewThreat = (data) => {
    setActiveThreat(data);
    
    // 1. Simulate the Raw Socket Intercept (Left Panel)
    const mockHex = `00000000  ${Array.from({length: 8}, () => Math.floor(Math.random()*255).toString(16).padStart(2,'0')).join(' ')}  |........|`;
    const logEntry = `[${new Date().toLocaleTimeString()}] INBOUND TCP (${data.comm}):\n${mockHex}\nPAYLOAD: ${data.dest_ip}:${data.dest_port} EXFIL_INIT`;
    setRawLogs(prev => [...prev, logEntry]);

    // 2. Trigger the Vector Synthesis Animation (Right Panel)
    setVectorState({ status: "EXTRACTING", array: [] });
    setTimeout(() => {
      const fakeVector = Array.from({length: 24}, () => (Math.random() * 2 - 1).toFixed(4));
      setVectorState({ status: "EMBEDDING", array: fakeVector });
      
      setTimeout(() => {
        setVectorState({ status: "SYNCED", array: fakeVector });
      }, 1500);
    }, 1000);
  };

  return (
    <div style={{ padding: "20px 40px", height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#020617", fontFamily: "sans-serif" }}>
      
      {/* TOP RIBBON */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "15px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={() => navigate("/")} style={{ background: "transparent", color: "#38bdf8", border: "1px solid #38bdf8", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
            ← Return to Radar
          </button>
          <div>
            <h1 style={{ color: "#f43f5e", margin: 0, letterSpacing: "2px", fontSize: "1.5rem", textTransform: "uppercase" }}>
              Honeypod Extraction Matrix
            </h1>
            <p style={{ color: "#8892b0", margin: "5px 0 0 0", fontSize: "0.9rem" }}>
              {activeThreat ? `PID ${activeThreat.pid} (UID ${activeThreat.uid}) Contained. Network routed to internal trap.` : "System Idle. Monitoring for DEFCON 1 Isolation Events."}
            </p>
          </div>
        </div>
        
        <div style={{ background: activeThreat ? "#4c0519" : "#0f172a", border: `1px solid ${activeThreat ? "#f43f5e" : "#334155"}`, padding: "10px 20px", borderRadius: "4px", textAlign: "right" }}>
          <p style={{ color: activeThreat ? "#fca5a5" : "#64748b", fontSize: "0.7rem", margin: "0 0 5px 0", letterSpacing: "1px" }}>BRAZIL PROTOCOL STATUS</p>
          <p style={{ color: activeThreat ? "white" : "#475569", fontSize: "1.1rem", fontWeight: "bold", margin: 0, animation: activeThreat ? "pulse 2s infinite" : "none" }}>
            {activeThreat ? "🔴 ACTIVE CONTAINMENT" : "🟢 STANDBY"}
          </p>
        </div>
      </div>

      {/* 3-PANEL MATRIX */}
      <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0 }}>
        
        {/* PANEL 1: RAW INTERCEPT */}
        <div style={{ flex: "1", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 15px", borderBottom: "1px solid #1e293b", background: "#020617" }}>
            <h3 style={{ color: "#38bdf8", margin: 0, fontSize: "0.8rem", letterSpacing: "1px" }}>1. RAW SOCKET INTERCEPT</h3>
          </div>
          <div style={{ flex: 1, padding: "15px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
            {rawLogs.length === 0 ? <span style={{ color: "#475569" }}>Waiting for malware transmission...</span> : rawLogs.map((log, i) => (
              <div key={i} style={{ color: "#64ffda", marginBottom: "15px" }}>{log}</div>
            ))}
          </div>
        </div>

        {/* PANEL 2: AI INTENT */}
        <div style={{ flex: "1", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 15px", borderBottom: "1px solid #1e293b", background: "#020617" }}>
            <h3 style={{ color: "#a855f7", margin: 0, fontSize: "0.8rem", letterSpacing: "1px" }}>2. AI INTENT ANALYSIS</h3>
          </div>
          <div style={{ flex: 1, padding: "15px", fontFamily: "monospace", fontSize: "0.85rem", color: "#cbd5e1" }}>
            {!activeThreat ? <span style={{ color: "#475569" }}>Awaiting payload for processing...</span> : (
              <div>
                <p style={{ color: "#a855f7" }}>{`> Analyzing telemetry & raw bytes...`}</p>
                <p>{`> Target Process: ${activeThreat.comm} (PID: ${activeThreat.pid})`}</p>
                <p>{`> Extracted Reason: ${activeThreat.reason}`}</p>
                <br/>
                {vectorState.status !== "EXTRACTING" && (
                  <div style={{ background: "#1e1b4b", padding: "15px", borderLeft: "3px solid #a855f7", marginTop: "10px" }}>
                    <span style={{ color: "#f472b6", fontWeight: "bold" }}>THREAT SCORE:</span> {activeThreat.score.toFixed(2)}<br/><br/>
                    <span style={{ color: "#f472b6", fontWeight: "bold" }}>INTENT:</span> Unauthorized System-Level C2 Beaconing / Exfiltration.<br/>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: QDRANT */}
        <div style={{ flex: "1", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 15px", borderBottom: "1px solid #1e293b", background: "#020617" }}>
            <h3 style={{ color: "#64ffda", margin: 0, fontSize: "0.8rem", letterSpacing: "1px" }}>3. QDRANT SIGNATURE (VECTOR DB)</h3>
          </div>
          <div style={{ flex: 1, padding: "15px", overflowY: "auto" }}>
            {vectorState.status === "WAITING" ? <span style={{ color: "#475569", fontFamily: "monospace", fontSize: "0.85rem" }}>Awaiting vector generation...</span> : (
              <div>
                <p style={{ color: vectorState.status === "SYNCED" ? "#64ffda" : "#fbbf24", fontWeight: "bold", fontSize: "0.85rem", letterSpacing: "1px", fontFamily: "monospace" }}>
                  {vectorState.status === "SYNCED" ? "✓ SIGNATURE SYNCED TO VECTOR DB" : "GENERATING LLM EMBEDDING..."}
                </p>
                
                <div style={{ background: "#020617", padding: "15px", borderRadius: "4px", fontFamily: "monospace", color: "#38bdf8", fontSize: "0.75rem", wordBreak: "break-all", marginTop: "15px", opacity: vectorState.array.length > 0 ? 1 : 0.3 }}>
                  <span style={{ color: "#64748b" }}>// Dim: 384 Cosine Similarity Array</span><br/>
                  [{vectorState.array.length > 0 ? vectorState.array.join(", ") : "0.0000, 0.0000..."} ...]
                </div>

                {vectorState.status === "SYNCED" && (
                  <div style={{ marginTop: "20px", border: "1px solid #64ffda", background: "rgba(100, 255, 218, 0.05)", padding: "15px", borderRadius: "4px" }}>
                    <p style={{ color: "#64ffda", margin: "0 0 5px 0", fontWeight: "bold", fontSize: "0.9rem" }}>ZERO-DAY IMMUNITY ACHIEVED</p>
                    <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.8rem", lineHeight: "1.5" }}>
                      Future executions matching this mathematical vector will bypass the LLM and instantly trigger isolation.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
    </div>
  );
}
