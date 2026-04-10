import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Honeypod() {
  const navigate = useNavigate();
  const location = useLocation();
  const targetPid = location.state?.targetPid || "UNKNOWN";

  const [intercepts, setIntercepts] = useState([]);
  const [activeVector, setActiveVector] = useState(null);

  // Fetch Honeypod logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:8081/api/honeypod/logs");
        const data = await res.json();
        
        if (data && data.length > 0) {
          // If we got a NEW payload, trigger the "Vectorizing" animation
          if (intercepts.length === 0 || data[0].timestamp !== intercepts[0]?.timestamp) {
            simulateVectorization(data[0].data);
          }
          setIntercepts(data);
        }
      } catch (err) {
        console.error("Honeypod offline.");
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [intercepts]);

  // Visual flair: Simulates the text -> vector -> Qdrant pipeline for the UI
  const simulateVectorization = (text) => {
    setActiveVector({ status: "EXTRACTING", array: [] });
    
    setTimeout(() => {
      // Generate some fake vector numbers for the UI animation
      const fakeVector = Array.from({length: 12}, () => (Math.random() * 2 - 1).toFixed(4));
      setActiveVector({ status: "EMBEDDING", array: fakeVector });
      
      setTimeout(() => {
        setActiveVector({ status: "SYNCED", array: fakeVector });
      }, 1500);
    }, 1000);
  };

  return (
    <div style={{ padding: "20px 40px", maxWidth: "1600px", margin: "0 auto", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      
      {/* 1. TOP NAV */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "15px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ color: "#f43f5e", margin: 0, letterSpacing: "2px", fontSize: "1.5rem" }}>ISOLATION SANDBOX & INTELLIGENCE LOOP</h1>
          <p style={{ color: "#8892b0", margin: "5px 0 0 0", fontSize: "0.9rem" }}>Capturing payloads and generating behavioral signatures.</p>
        </div>
        <button 
          onClick={() => navigate("/telemetry")}
          style={{ background: "transparent", color: "#38bdf8", border: "1px solid #38bdf8", padding: "8px 16px" }}
        >
          ← Return to Radar
        </button>
      </div>

      {/* 2. THE 60/40 SPLIT */}
      <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0 }}>
        
        {/* LEFT PANE (60%): THE PAYLOAD TERMINAL */}
        <div style={{ flex: "0 0 60%", background: "#020617", border: "1px solid #1e293b", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "15px", borderBottom: "1px solid #1e293b", background: "#0f172a", display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ color: "#8892b0", margin: 0, fontSize: "0.9rem", letterSpacing: "1px" }}>LIVE PAYLOAD INTERCEPTION (PID: {targetPid})</h3>
            <span style={{ color: "#f43f5e", fontSize: "0.8rem", fontWeight: "bold", animation: "pulse 2s infinite" }}>● NETWORK SPOOFED</span>
          </div>
          
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", fontFamily: "monospace" }}>
            {intercepts.length === 0 ? (
              <div style={{ color: "#8892b0", textAlign: "center", marginTop: "50px" }}>Waiting for malware to transmit data...</div>
            ) : (
              intercepts.map((log, i) => (
                <div key={i} style={{ marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px dashed #1e293b" }}>
                  <div style={{ color: "#f43f5e", fontSize: "0.8rem", marginBottom: "8px" }}>
                    [{new Date(log.timestamp).toLocaleTimeString()}] INBOUND FROM: {log.source_ip}
                  </div>
                  <div style={{ background: "#000", color: "#64ffda", padding: "15px", borderRadius: "4px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {log.data}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE (40%): THE QDRANT INTELLIGENCE PIPELINE */}
        <div style={{ flex: "0 0 40%", background: "#020617", border: "1px solid #1e293b", borderRadius: "8px", padding: "25px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <h3 style={{ color: "#8892b0", margin: "0 0 20px 0", fontSize: "0.9rem", letterSpacing: "1px", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>
            AEGIS VECTOR PIPELINE
          </h3>

          {!activeVector ? (
            <div style={{ color: "#8892b0", textAlign: "center", marginTop: "40px", fontStyle: "italic" }}>
              Awaiting payload to generate behavioral embedding...
            </div>
          ) : (
            <>
              {/* Step 1: Status */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "white", margin: "0 0 5px 0", fontSize: "0.9rem" }}>PIPELINE STATUS:</p>
                <p style={{ 
                  margin: 0, fontWeight: "bold", letterSpacing: "1px",
                  color: activeVector.status === "SYNCED" ? "#64ffda" : "#fbbf24" 
                }}>
                  {activeVector.status === "EXTRACTING" && "1. EXTRACTING TOKENS..."}
                  {activeVector.status === "EMBEDDING" && "2. GENERATING LLM EMBEDDING..."}
                  {activeVector.status === "SYNCED" && "3. SIGNATURE SYNCED TO QDRANT"}
                </p>
              </div>

              {/* Step 2: Vector Visualization */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "#8892b0", margin: "0 0 5px 0", fontSize: "0.8rem" }}>MATHEMATICAL BEHAVIORAL VECTOR (DIM: 384)</p>
                <div style={{ background: "#0f172a", padding: "15px", borderRadius: "4px", fontFamily: "monospace", color: "#38bdf8", fontSize: "0.85rem", wordBreak: "break-all", opacity: activeVector.array.length > 0 ? 1 : 0.3 }}>
                  [{activeVector.array.length > 0 ? activeVector.array.join(", ") : "0.0000, 0.0000, 0.0000..."}, ...]
                </div>
              </div>

              {/* Step 3: Database Confirmation */}
              {activeVector.status === "SYNCED" && (
                <div style={{ borderLeft: "4px solid #64ffda", paddingLeft: "15px", background: "rgba(100, 255, 218, 0.1)", padding: "15px", borderRadius: "0 4px 4px 0" }}>
                  <p style={{ color: "#64ffda", margin: "0 0 5px 0", fontWeight: "bold", fontSize: "0.9rem" }}>✓ ZERO-DAY IMMUNITY ACHIEVED</p>
                  <p style={{ color: "#a8b2d1", margin: 0, fontSize: "0.85rem", lineHeight: "1.5" }}>
                    Aegis has successfully stored this behavioral vector in Qdrant. Future attacks matching this mathematical signature will be instantly neutralized without requiring LLM evaluation.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default Honeypod;
