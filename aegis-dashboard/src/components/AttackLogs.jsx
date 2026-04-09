import { useSocket } from "../context/SocketContext"

function AttackLogs() {
  // Grab the live array of telemetry logs from our context
  const { logs } = useSocket()

  return (
    <div className="logs" style={{ background: "#0a192f", padding: "15px", borderRadius: "8px", border: "1px solid #233554", marginTop: "20px", height: "200px", overflowY: "auto", fontFamily: "monospace" }}>
      <h3 style={{ color: "#8892b0", marginTop: 0 }}>LIVE TERMINAL LOGS</h3>

      {logs.length === 0 && <p style={{ color: "#8892b0" }}>[SYSTEM] Awaiting kernel telemetry...</p>}

      {logs.map((log, i) => {
        const threatLevel = Math.round((log.score || 0) * 100)
        const statusColor = threatLevel >= 70 ? "#ff4444" : threatLevel >= 30 ? "#fbbf24" : "#38bdf8"
        
        return (
          <p key={i} style={{ color: "#a8b2d1", margin: "5px 0", fontSize: "14px" }}>
            <span style={{ color: "#64ffda" }}>[{new Date().toLocaleTimeString()}]</span> 
            <span style={{ color: statusColor, fontWeight: "bold", marginLeft: "10px" }}>
              [{threatLevel >= 70 ? "CRITICAL" : threatLevel >= 30 ? "WARNING" : "SAFE"}]
            </span>
            <strong style={{ color: "white", marginLeft: "10px" }}>PID: {log.pid} ({log.comm})</strong> 
            <span style={{ marginLeft: "10px", fontStyle: "italic" }}>→ {log.reason || "Standard traffic"}</span>
          </p>
        )
      })}
    </div>
  )
}

export default AttackLogs
