import { useSocket } from "../context/SocketContext"
import "../styles/dashboard.css"

function AttackLogs() {
  const { logs } = useSocket()

  return (
    <div className="terminal-body" style={{ 
      background: "black", 
      padding: "16px", 
      height: "240px", 
      overflowY: "auto", 
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.8125rem',
      lineHeight: '1.5'
    }}>
      {logs.length === 0 && (
        <div className="text-dim">[SYSTEM] Awaiting kernel telemetry intercept...</div>
      )}

      {logs.slice().reverse().map((log, i) => {
        const threatLevel = Math.round((log.score || 0) * 100)
        let statusColor = "var(--accent-blue)"
        let statusLabel = "SAFE"
        
        if (threatLevel >= 70) {
          statusColor = "var(--accent-red)"
          statusLabel = "CRITICAL"
        } else if (threatLevel >= 30) {
          statusColor = "var(--accent-yellow)"
          statusLabel = "WARNING"
        }
        
        return (
          <div key={i} style={{ marginBottom: "4px", display: 'flex', gap: '12px' }}>
            <span style={{ color: "var(--text-dim)" }}>[{new Date().toLocaleTimeString()}]</span> 
            <span style={{ color: statusColor, fontWeight: "bold", width: '70px', display: 'inline-block' }}>
              [{statusLabel}]
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              PID:<span style={{ color: 'var(--accent-blue)' }}>{log.pid}</span> ({log.comm})
            </span>
            <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
              {log.reason ? `— ${log.reason}` : "— Nominal activity detected"}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default AttackLogs
