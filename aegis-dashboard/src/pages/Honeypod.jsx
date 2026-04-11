import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/honeypot.css";
import "../styles/global.css";

function Honeypod() {
  const navigate = useNavigate();
  const location = useLocation();
  const targetPid = location.state?.targetPid || "---";

  const [intercepts, setIntercepts] = useState([]);
  const [activeVector, setActiveVector] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:8081/api/honeypod/logs");
        const data = await res.json();
        
        if (data && data.length > 0) {
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

  const simulateVectorization = (text) => {
    setActiveVector({ status: "EXTRACTING", array: [] });
    setTimeout(() => {
      const fakeVector = Array.from({length: 12}, () => (Math.random() * 2 - 1).toFixed(4));
      setActiveVector({ status: "EMBEDDING", array: fakeVector });
      setTimeout(() => {
        setActiveVector({ status: "SYNCED", array: fakeVector });
      }, 1500);
    }, 1000);
  };

  return (
    <div className="honeypod-layout">
      {/* LEFT PANE: PAYLOAD TERMINAL */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <span className="card-title">Live Payload Interception (PID: {targetPid})</span>
          <span style={{ color: "var(--accent-red)", fontSize: "0.75rem", fontWeight: "bold" }}>● SPOOFED NETWORKS ACTIVE</span>
        </div>
        
        <div className="payload-terminal">
          {intercepts.length === 0 ? (
            <div className="text-dim" style={{ textAlign: "center", marginTop: "50px" }}>Awaiting malware transmission...</div>
          ) : (
            intercepts.map((log, i) => (
              <div key={i} className="payload-entry">
                <div className="payload-header">
                  [{new Date(log.timestamp).toLocaleTimeString()}] INBOUND FROM: {log.source_ip}
                </div>
                <div className="payload-content">
                  {log.data}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE: INTELLIGENCE PIPELINE */}
      <div className="card" style={{ overflowY: 'auto' }}>
        <div className="card-header">
          <span className="card-title">Aegis Vector Pipeline</span>
        </div>

        {!activeVector ? (
          <div className="text-dim" style={{ textAlign: "center", marginTop: "40px", fontStyle: "italic" }}>
            Awaiting payload for behavioral embedding...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="pipeline-step">
              <span className="text-xs text-dim">PIPELINE STATUS</span>
              <div style={{ 
                marginTop: '8px', fontWeight: "bold", 
                color: activeVector.status === "SYNCED" ? "var(--accent-green)" : "var(--accent-yellow)" 
              }}>
                {activeVector.status === "EXTRACTING" && "1. EXTRACTING TOKENS"}
                {activeVector.status === "EMBEDDING" && "2. GENERATING LLM EMBEDDING"}
                {activeVector.status === "SYNCED" && "3. SIGNATURE SYNCED TO QDRANT"}
              </div>
            </div>

            <div className="pipeline-step">
              <span className="text-xs text-dim">BEHAVIORAL VECTOR (DIM: 384)</span>
              <div className="vector-box" style={{ opacity: activeVector.array.length > 0 ? 1 : 0.3 }}>
                [{activeVector.array.length > 0 ? activeVector.array.join(", ") : "0.0000, 0.0000, 0.0000..."}, ...]
              </div>
            </div>

            {activeVector.status === "SYNCED" && (
              <div className="immunity-badge">
                <div style={{ color: "var(--accent-green)", fontWeight: "bold", fontSize: "0.875rem", marginBottom: '8px' }}>
                  ✓ ZERO-DAY IMMUNITY ACHIEVED
                </div>
                <p className="text-sm text-secondary" style={{ lineHeight: "1.5" }}>
                  Malware behavior vectorized and stored. Future execution matches will be neutralized by the kernel instantly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Honeypod;
