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
  const [stats, setStats] = useState({
    scanned: 0,
    alerts: 0,
    blocked: 0,
  })

  useEffect(() => {
    if (!data) return
    const score = Math.round((data.score || 0) * 100)
    setThreatLevel(score)
    if (score >= 70) setStatus("CRITICAL")
    else if (score >= 30) setStatus("MONITORING")
    else setStatus("SAFE")
    setStats(prev => ({
      scanned: prev.scanned + 1,
      alerts: score >= 30 ? prev.alerts + 1 : prev.alerts,
      blocked: score >= 70 ? prev.blocked + 1 : prev.blocked,
    }))
  }, [data])

  const getStatusColor = () => {
    if (status === "CRITICAL") return "var(--accent-red)"
    if (status === "MONITORING") return "var(--accent-yellow)"
    return "var(--accent-blue)"
  }

  const getVerdictLabel = () => {
    if (status === "CRITICAL") return "ISOLATING THREAT"
    if (status === "MONITORING") return "ACTIVE MONITORING"
    return "SYSTEM SECURE"
  }

  return (
    <div className="dashboard-root">
      {/* Top Stats Bar */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-label">Total Scanned</span>
          <span className="stat-value">{stats.scanned.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Alerts</span>
          <span className="stat-value" style={{ color: "var(--accent-yellow)" }}>{stats.alerts}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Threats Blocked</span>
          <span className="stat-value" style={{ color: "var(--accent-red)" }}>{stats.blocked}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">System Health</span>
          <span className="stat-value" style={{ color: "var(--accent-green)", fontSize: '1rem' }}>
            {status === "CRITICAL" ? "MITIGATING" : "NOMINAL"}
          </span>
        </div>
      </div>

      {/* Main Panels */}
      <div className="main-panel-grid">
        {/* Left: Process Context */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Process Context</span>
          </div>
          <div className="process-list">
            <div className="process-item">
              <span className="process-key">Executable</span>
              <span className="process-val">{data?.comm || '---'}</span>
            </div>
            <div className="process-item">
              <span className="process-key">PID</span>
              <span className="process-val">{data?.pid || '---'}</span>
            </div>
            <div className="process-item">
              <span className="process-key">PPID</span>
              <span className="process-val" style={{ color: 'var(--accent-blue)' }}>{data?.ppid || '---'}</span>
            </div>
            <div className="process-item">
              <span className="process-key">UID / Scope</span>
              <span className="process-val">
                {data ? `${data.uid} (${data.uid < 1000 ? 'SYS' : 'USR'})` : '---'}
              </span>
            </div>
            <div className="process-item">
              <span className="process-key">Network Target</span>
              <span className="process-val">{data ? `${data.dest_ip}:${data.dest_port}` : '---'}</span>
            </div>
          </div>
        </div>

        {/* Center: Hero Metric */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Threat Assessment</span>
          </div>
          <div className="threat-gauge-container">
            <div className="threat-gauge" style={{ borderColor: getStatusColor(), boxShadow: `0 0 20px ${getStatusColor()}22` }}>
              <span className="threat-gauge-value" style={{ color: getStatusColor() }}>{threatLevel}%</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className="text-dim text-xs">KERNEL CONFIDENCE SCORE</span>
            </div>
            <button className="btn-primary" onClick={() => navigate('/sentinel')}>
              {status === "CRITICAL" ? "OPEN INCIDENT REPORT" : "VIEW FULL ANALYSIS"}
            </button>
          </div>
        </div>

        {/* Right: Sentinel Verdict */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sentinel AI Verdict</span>
          </div>
          <div className="verdict-box" style={{ border: `1px solid ${getStatusColor()}44`, background: `${getStatusColor()}08` }}>
            <div className="verdict-text" style={{ color: getStatusColor() }}>{getVerdictLabel()}</div>
            <div className="text-sm text-dim" style={{ fontStyle: 'italic', lineHeight: '1.4' }}>
              {data?.reason ? `"${data.reason}"` : "Waiting for next event stream..."}
            </div>
          </div>
          <div style={{ marginTop: '24px' }}>
            <span className="card-title text-xs">Automated Actions</span>
            <div className="text-xs text-secondary" style={{ marginTop: '8px', lineHeight: '1.6' }}>
              • Memory Isolation: {status === "CRITICAL" ? "ACTIVE" : "READY"}<br />
              • Process Throttling: {status === "CRITICAL" ? "ENGAGED" : "READY"}<br />
              • Network Lock: {status === "CRITICAL" ? "PENDING" : "IDLE"}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="logs-section">
        <div className="logs-header">
          <span className="card-title" style={{ margin: 0 }}>Active Event Stream</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
          </div>
        </div>
        <AttackLogs />
      </div>
    </div>
  )
}

export default Dashboard
