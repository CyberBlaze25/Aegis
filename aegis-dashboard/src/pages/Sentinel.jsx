import "../styles/sentinel.css"
import "../styles/global.css"
import { useState, useEffect } from "react"
import { useSocket } from "../context/SocketContext"
import { useNavigate } from "react-router-dom"

function Sentinel() {
  const { data, logs, status: socketStatus } = useSocket()
  const navigate = useNavigate()

  const [selectedIncident, setSelectedIncident] = useState(null)

  useEffect(() => {
    if (logs.length > 0 && !selectedIncident) {
      setSelectedIncident(logs[0])
    }
  }, [logs, selectedIncident])

  const activeData = selectedIncident || data;
  const score = Math.round((activeData?.score || 0) * 100)
  const isSystemUser = activeData?.uid < 1000
  
  let threatStatus = "SAFE"
  let statusColor = "var(--accent-blue)"
  if (score >= 70) { 
    threatStatus = "CRITICAL"
    statusColor = "var(--accent-red)" 
  } else if (score >= 30) { 
    threatStatus = "WARNING"
    statusColor = "var(--accent-yellow)" 
  }

  return (
    <div className="sentinel-layout">
      {/* 1. HUD */}
      <div className="sentinel-hud">
        <div className="card" style={{ textAlign: 'center' }}>
          <span className="text-xs text-dim">eBPF SENSOR</span>
          <div style={{ color: socketStatus === "CONNECTED" ? "var(--accent-green)" : "var(--accent-red)", fontWeight: "bold", marginTop: '8px' }}>
            {socketStatus === "CONNECTED" ? "ACTIVE / SYNCED" : "OFFLINE"}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="text-xs text-dim">THREAT SCORE</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: statusColor }}>{score}%</div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-color)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="text-xs text-dim">AI STATUS</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: statusColor }}>{threatStatus}</div>
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <span className="text-xs text-dim">TOTAL INCIDENTS</span>
          <div style={{ color: "var(--text-primary)", fontWeight: "bold", marginTop: '8px', fontSize: '1.25rem' }}>
            {logs.length}
          </div>
        </div>
      </div>

      {/* 2. MAIN SPLIT */}
      <div className="sentinel-split">
        {/* HISTORY LEDGER */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
            <span className="card-title">Threat Archive</span>
          </div>
          <div className="incident-list">
            {logs.length === 0 ? (
              <div className="text-dim" style={{ textAlign: "center", padding: "32px" }}>No telemetry recorded.</div>
            ) : (
              logs.map((log, i) => {
                const logScore = Math.round((log.score || 0) * 100)
                const isSelected = selectedIncident === log
                let rowColor = "var(--accent-blue)"
                if (logScore >= 70) rowColor = "var(--accent-red)"
                else if (logScore >= 30) rowColor = "var(--accent-yellow)"
                
                return (
                  <div 
                    key={i} 
                    className={`incident-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedIncident(log)}
                    style={{ borderLeftColor: isSelected ? rowColor : 'transparent' }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span className="text-xs font-mono" style={{ color: "var(--accent-green)" }}>[{new Date().toLocaleTimeString()}]</span>
                      <span className="text-xs font-mono" style={{ color: rowColor, fontWeight: "bold" }}>CRS: {logScore}%</span>
                    </div>
                    <div className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                      PID: {log.pid} ({log.comm})
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* FORENSIC DETAIL MATRIX */}
        <div className="card" style={{ overflowY: 'auto' }}>
          {!activeData ? (
            <div className="text-dim" style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
              Select an incident to view forensic details.
            </div>
          ) : (
            <>
              <div className="brief-box" style={{ borderLeftColor: statusColor }}>
                <span className="text-xs text-dim">SENTINEL INTELLIGENCE BRIEF</span>
                <p className="brief-text" style={{ color: "var(--text-primary)", marginTop: '8px' }}>
                  "{activeData.reason || "No automated summary available."}"
                </p>
              </div>

              <div className="card-title" style={{ marginBottom: '16px', fontSize: '0.75rem' }}>Forensic Evidence Matrix</div>
              <div className="forensic-matrix">
                <div className="forensic-key">Process Binary</div>
                <div className="forensic-val">{activeData.comm}</div>

                <div className="forensic-key">Process ID (PID)</div>
                <div className="forensic-val">{activeData.pid}</div>

                <div className="forensic-key">Parent ID (PPID)</div>
                <div className="forensic-val">{activeData.ppid}</div>

                <div className="forensic-key">User Identity</div>
                <div className="forensic-val" style={{ color: isSystemUser ? "var(--accent-red)" : "var(--accent-green)", fontWeight: "bold" }}>
                  {activeData.uid} {isSystemUser ? "[SYSTEM PRIVILEGE]" : "[STANDARD USER]"}
                </div>

                <div className="forensic-key">Network Target</div>
                <div className="forensic-val" style={{ color: "var(--accent-yellow)" }}>
                  {activeData.dest_ip}:{activeData.dest_port}
                </div>

                <div className="forensic-key">Mitigation Status</div>
                <div className="forensic-val" style={{ color: statusColor, fontWeight: "bold" }}>
                  {score >= 70 ? "NETWORK NAMESPACE ISOLATED" : "ACTIVE MONITORING"}
                </div>
              </div>

              <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <span className="card-title" style={{ fontSize: '0.75rem' }}>Automated Analysis Sequence</span>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="text-sm text-dim">• Scanning process memory segments... [COMPLETE]</div>
                  <div className="text-sm text-dim">• Trace system call behavioral sequence... [COMPLETE]</div>
                  <div className="text-sm text-dim">• Verifying binary signature... [VERIFIED]</div>
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
