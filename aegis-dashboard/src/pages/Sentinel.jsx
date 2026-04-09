import "../styles/sentinel.css"
import { useState, useEffect } from "react"
import { useSocket } from "../context/SocketContext"
import { useNavigate } from "react-router-dom"

function Sentinel() {
  const { data, logs, status: socketStatus } = useSocket()
  const navigate = useNavigate()

  // State to track which historical incident the user clicked on
  const [selectedIncident, setSelectedIncident] = useState(null)

  // Auto-select the newest incident if none is selected
  useEffect(() => {
    if (logs.length > 0 && !selectedIncident) {
      setSelectedIncident(logs[0])
    }
  }, [logs, selectedIncident])

  // Use the selected incident for the right pane, fallback to the live 'data' if history is empty
  const activeData = selectedIncident || data;

  // Math & Status for the active data
  const score = Math.round((activeData?.score || 0) * 100)
  const isSystemUser = activeData?.uid < 1000
  
  let threatStatus = "SAFE"
  let statusColor = "#38bdf8"
  if (score >= 70) { 
    threatStatus = "CRITICAL"
    statusColor = "#ff4444" 
  } else if (score >= 30) { 
    threatStatus = "WARNING"
    statusColor = "#fbbf24" 
  }

  return (
    <div style={{ padding: "20px 40px", maxWidth: "1600px", margin: "0 auto", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      
      {/* 1. TOP NAV */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "15px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ color: "#f43f5e", margin: 0, letterSpacing: "2px", fontSize: "1.5rem" }}>FORENSIC COMMAND CENTER</h1>
          <p style={{ color: "#8892b0", margin: "5px 0 0 0", fontSize: "0.9rem" }}>Powered by Sentinel AI Core</p>
        </div>
        <button 
          onClick={() => navigate("/")}
          style={{ background: "transparent", color: "#38bdf8", border: "1px solid #38bdf8", padding: "8px 16px" }}
        >
          ← Return to Dashboard
        </button>
      </div>

      {/* 2. THE HUD (Heads Up Display) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#020617", border: "1px solid #1e293b", borderRadius: "8px", padding: "20px 40px", marginBottom: "20px" }}>
        {/* Left Flair */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#8892b0", fontSize: "0.8rem", margin: "0 0 5px 0", letterSpacing: "1px" }}>eBPF SENSOR</p>
          <p style={{ color: socketStatus === "CONNECTED" ? "#64ffda" : "#ff4444", fontWeight: "bold", margin: 0 }}>
            {socketStatus === "CONNECTED" ? "ACTIVE / SYNCED" : "OFFLINE"}
          </p>
        </div>

        {/* Center: The Circular Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="circle" style={{ 
            width: "120px", height: "120px", fontSize: "2rem", margin: "0", borderWidth: "6px",
            borderColor: statusColor, boxShadow: `0 0 20px ${statusColor}40`, color: "white" 
          }}>
            <span>{score}%</span>
          </div>
          <p style={{ color: statusColor, fontWeight: "bold", letterSpacing: "2px", marginTop: "15px", marginBottom: 0 }}>
            {threatStatus}
          </p>
        </div>

        {/* Right Flair */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#8892b0", fontSize: "0.8rem", margin: "0 0 5px 0", letterSpacing: "1px" }}>INCIDENTS LOGGED</p>
          <p style={{ color: "white", fontWeight: "bold", margin: 0, fontSize: "1.2rem" }}>{logs.length}</p>
        </div>
      </div>

      {/* 3. THE 40/60 SPLIT */}
      <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0 }}>
        
        {/* LEFT PANE (40%): THE HISTORY LEDGER */}
        <div style={{ flex: "0 0 40%", background: "#020617", border: "1px solid #1e293b", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "15px", borderBottom: "1px solid #1e293b", background: "#0f172a" }}>
            <h3 style={{ color: "#8892b0", margin: 0, fontSize: "0.9rem", letterSpacing: "1px" }}>THREAT ARCHIVE</h3>
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "10px" }}>
            {logs.length === 0 ? (
              <p style={{ color: "#8892b0", textAlign: "center", marginTop: "20px" }}>No telemetry recorded.</p>
            ) : (
              logs.map((log, i) => {
                const logScore = Math.round((log.score || 0) * 100)
                const isSelected = selectedIncident === log
                const rowColor = logScore >= 70 ? "#ff4444" : logScore >= 30 ? "#fbbf24" : "#38bdf8"
                
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedIncident(log)}
                    style={{ 
                      padding: "12px", borderBottom: "1px solid #1e293b", cursor: "pointer",
                      background: isSelected ? "#0f172a" : "transparent",
                      borderLeft: isSelected ? `4px solid ${rowColor}` : "4px solid transparent",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ color: "#64ffda", fontSize: "0.8rem", fontFamily: "monospace" }}>[{new Date().toLocaleTimeString()}]</span>
                      <span style={{ color: rowColor, fontWeight: "bold", fontSize: "0.8rem" }}>CRS: {logScore}%</span>
                    </div>
                    <div style={{ color: "white", fontSize: "0.9rem", fontFamily: "monospace" }}>
                      PID: {log.pid} ({log.comm})
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE (60%): THE FORENSIC DETAIL MATRIX */}
        <div style={{ flex: "0 0 60%", background: "#020617", border: "1px solid #1e293b", borderRadius: "8px", padding: "25px", overflowY: "auto" }}>
          {!activeData ? (
            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#8892b0" }}>
              Select an incident to view forensic details.
            </div>
          ) : (
            <>
              {/* AI Brief */}
              <div style={{ borderLeft: `4px solid ${statusColor}`, paddingLeft: "20px", marginBottom: "30px" }}>
                <h4 style={{ color: "#8892b0", margin: "0 0 10px 0", fontSize: "0.8rem", letterSpacing: "1px" }}>SENTINEL INTELLIGENCE BRIEF</h4>
                <p style={{ color: "white", fontSize: "1.2rem", lineHeight: "1.6", margin: 0, fontStyle: "italic" }}>
                  "{activeData.reason}"
                </p>
              </div>

              {/* Data Grid */}
              <h4 style={{ color: "#8892b0", margin: "0 0 15px 0", fontSize: "0.8rem", letterSpacing: "1px", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>
                TELEMETRY EVIDENCE MATRIX
              </h4>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "15px", fontFamily: "monospace", fontSize: "0.95rem" }}>
                <div style={{ color: "#8892b0" }}>PROCESS BINARY:</div>
                <div style={{ color: "white" }}>{activeData.comm}</div>

                <div style={{ color: "#8892b0" }}>PROCESS ID (PID):</div>
                <div style={{ color: "white" }}>{activeData.pid}</div>

                <div style={{ color: "#8892b0" }}>PARENT ID (PPID):</div>
                <div style={{ color: "white" }}>{activeData.ppid}</div>

                <div style={{ color: "#8892b0" }}>USER IDENTITY (UID):</div>
                <div style={{ color: isSystemUser ? "#ff4444" : "#64ffda", fontWeight: "bold" }}>
                  {activeData.uid} {isSystemUser ? "[SYSTEM ACCOUNT DETECTED]" : "[STANDARD USER]"}
                </div>

                <div style={{ color: "#8892b0", marginTop: "15px" }}>NETWORK TARGET:</div>
                <div style={{ color: "#fbbf24", fontWeight: "bold", marginTop: "15px" }}>
                  {activeData.dest_ip} : {activeData.dest_port}
                </div>

                <div style={{ color: "#8892b0" }}>ACTION TAKEN:</div>
                <div style={{ color: statusColor, fontWeight: "bold" }}>
                  {score >= 70 ? "NETWORK NAMESPACE ISOLATION APPLIED" : "TRAFFIC ALLOWED / LOGGED"}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export default Sentinel
