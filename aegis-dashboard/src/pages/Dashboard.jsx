import "../styles/dashboard.css"
import { useState, useEffect } from "react"
import { useSocket } from "../context/SocketContext"
import { useNavigate } from "react-router-dom"
import AttackLogs from "../components/AttackLogs"

function Dashboard() {
  const navigate = useNavigate()
  const { data, status: socketStatus } = useSocket()

  const [threatLevel, setThreatLevel] = useState(0)
  const [status, setStatus] = useState("SAFE")

  // Counters for the footer
  const [stats, setStats] = useState({
    scanned: 0,
    alerts: 0,
    blocked: 0,
  })

  useEffect(() => {
    if (!data) return

    const score = Math.round((data.score || 0) * 100)
    setThreatLevel(score)

    // Update status based on our agreed thresholds
    if (score >= 70) setStatus("CRITICAL")
    else if (score >= 30) setStatus("MONITORING")
    else setStatus("SAFE")

    // Increment stats
    setStats(prev => ({
      scanned: prev.scanned + 1,
      alerts: score >= 30 ? prev.alerts + 1 : prev.alerts,
      blocked: score >= 70 ? prev.blocked + 1 : prev.blocked,
    }))

  }, [data])

  // Dynamic styling for our Call to Action button
  const getButtonProps = () => {
    if (status === "CRITICAL") return { text: "VIEW INCIDENT REPORT", color: "#ff4444", bg: "#4a0f0f", anim: "pulse 1s infinite" }
    if (status === "MONITORING") return { text: "Investigate Activity", color: "#fbbf24", bg: "#422006", anim: "none" }
    return { text: "View Analysis", color: "#8892b0", bg: "#112240", anim: "none" }
  }
  const btn = getButtonProps()

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>AEGIS SENTINEL</h1>
          <p style={{ color: "#8892b0", marginTop: "5px" }}>COMMAND CENTER</p>
        </div>
        <div style={{ color: socketStatus === "CONNECTED" ? "#64ffda" : "#ff4444", fontWeight: "bold" }}>
          {socketStatus === "CONNECTED" ? "🟢 LINK ESTABLISHED" : "🔴 LINK LOST"}
        </div>
      </div>

      {/* MIDDLE GRID: THE ACTIVE THREAT ZONE */}
      <div className="grid">

        {/* Left: Process Context */}
        <div className="panel left">
          <h3 style={{ color: "#8892b0" }}>PROCESS CONTEXT</h3>
          {data ? (
            <div style={{ marginTop: "15px", lineHeight: "1.8" }}>
              <p><b>Process:</b> <span style={{ color: "white" }}>{data.comm}</span></p>
              <p><b>PID:</b> <span style={{ color: "white" }}>{data.pid}</span></p>
              <p><b>PPID:</b> <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{data.ppid}</span></p>
              <p><b>UID:</b> <span style={{ color: data.uid < 1000 ? "#ff4444" : "#64ffda", fontWeight: "bold" }}>{data.uid} {data.uid < 1000 ? "(System)" : "(User)"}</span></p>
              <p><b>Target:</b> <span style={{ color: "white" }}>{data.dest_ip}:{data.dest_port}</span></p>
            </div>
          ) : (
            <p style={{ color: "#8892b0", marginTop: "20px" }}>Awaiting kernel intercept...</p>
          )}
        </div>

        {/* Center: Hero Metric */}
        <div className="panel center" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 className="alert" style={{ margin: 0, color: "#8892b0" }}>THREAT LEVEL</h2>

          <div className="circle" style={{ 
            borderColor: status === "CRITICAL" ? "#ff4444" : status === "MONITORING" ? "#fbbf24" : "#38bdf8",
            boxShadow: status === "CRITICAL" ? "0 0 20px #ff4444" : "none",
            transition: "all 0.3s ease"
          }}>
            <span style={{ fontSize: "3rem", color: "white" }}>{threatLevel}%</span>
          </div>

          {/* The Call-To-Action Button */}
          <button 
            onClick={() => navigate('/sentinel')}
            style={{
              marginTop: "20px", padding: "12px 24px", borderRadius: "4px", border: `1px solid ${btn.color}`,
              backgroundColor: btn.bg, color: btn.color, fontWeight: "bold", cursor: "pointer",
              animation: btn.anim, transition: "all 0.3s"
            }}
          >
            {btn.text}
          </button>
        </div>

        {/* Right: Sentinel Verdict */}
        <div className="panel right">
          <h3 style={{ color: "#8892b0" }}>SENTINEL VERDICT</h3>
          <h2 style={{ color: status === "CRITICAL" ? "#ff4444" : status === "MONITORING" ? "#fbbf24" : "#64ffda", fontSize: "2rem", margin: "10px 0" }}>
            {status === "CRITICAL" ? "ISOLATING" : status === "MONITORING" ? "MONITORING" : "ALLOW"}
          </h2>
          {data?.reason ? (
            <p style={{ fontSize: "1rem", color: "#ccd6f6", marginTop: "15px", fontStyle: "italic", lineHeight: "1.5" }}>
              "{data.reason}"
            </p>
          ) : (
            <p style={{ color: "#8892b0" }}>System nominal.</p>
          )}
        </div>

      </div>

      {/* TERMINAL LOGS */}
      <AttackLogs />

      {/* FOOTER STATS */}
      <div className="stats" style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
        <div className="stat clean">
          <h4 style={{ color: "#8892b0", margin: "0 0 5px 0" }}>Total Scanned</h4>
          <p style={{ fontSize: "1.5rem", color: "white", margin: 0 }}>{stats.scanned}</p>
        </div>
        <div className="stat alert">
          <h4 style={{ color: "#8892b0", margin: "0 0 5px 0" }}>Active Alerts</h4>
          <p style={{ fontSize: "1.5rem", color: "#fbbf24", margin: 0 }}>{stats.alerts}</p>
        </div>
        <div className="stat blocked">
          <h4 style={{ color: "#8892b0", margin: "0 0 5px 0" }}>Threats Isolated</h4>
          <p style={{ fontSize: "1.5rem", color: "#ff4444", margin: 0 }}>{stats.blocked}</p>
        </div>
        <div className="stat monitored">
          <h4 style={{ color: "#8892b0", margin: "0 0 5px 0" }}>System Health</h4>
          <p style={{ fontSize: "1.5rem", color: "#64ffda", margin: 0 }}>{status === "CRITICAL" ? "COMPROMISED" : "SECURE"}</p>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
