import "../styles/dashboard.css"
import { useState, useEffect } from "react"
import { useSocket } from "../context/SocketContext"
import AttackLogs from "../components/AttackLogs"

function Dashboard() {

  const { data } = useSocket()

  const [threatLevel, setThreatLevel] = useState(0)
  const [status, setStatus] = useState("SAFE")

  const [stats, setStats] = useState({
    clean: 1000,
    alerts: 0,
    blocked: 0,
    monitored: 0
  })

  useEffect(() => {
    if (!data) return

    const score = data.score || 0

    setThreatLevel(score)

    if (score > 80) setStatus("CRITICAL")
    else if (score > 50) setStatus("MONITORING")
    else setStatus("SAFE")

    setStats({
      clean: 1000 - score,
      alerts: score > 50 ? 1 : 0,
      blocked: score > 80 ? 1 : 0,
      monitored: Math.floor(score / 10)
    })

  }, [data])

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="header">
        <h1>AEGIS SENTINEL</h1>
        <p>Status: {status}</p>
      </div>

      {/* GRID */}
      <div className="grid">

        <div className="panel left">
          <h3>ACTIVE PROCESSES</h3>
          <p>{data?.pid || "No data"}</p>
        </div>

        <div className="panel center">
          <h2 className="alert">SYSTEM THREAT LEVEL</h2>

          <div className="circle">
            <span>{threatLevel}</span>
          </div>

          <p>{status}</p>
        </div>

        <div className="panel right">
          <h3>RESPONSE</h3>
          <p>
            {status === "CRITICAL"
              ? "ISOLATE"
              : status === "MONITORING"
              ? "MONITOR"
              : "ALLOW"}
          </p>
        </div>

      </div>

      {/* LOGS */}
      <AttackLogs />

      {/* STATS */}
      <div className="stats">

        <div className="stat clean">
          <h4>Clean</h4>
          <p>{stats.clean}</p>
        </div>

        <div className="stat alert">
          <h4>Alerts</h4>
          <p>{stats.alerts}</p>
        </div>

        <div className="stat blocked">
          <h4>Blocked</h4>
          <p>{stats.blocked}</p>
        </div>

        <div className="stat monitored">
          <h4>Monitored</h4>
          <p>{stats.monitored}</p>
        </div>

      </div>

    </div>
  )
}

export default Dashboard