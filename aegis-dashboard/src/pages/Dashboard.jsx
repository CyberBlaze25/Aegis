import "../styles/dashboard.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AttackLogs from "../components/AttackLogs"

function Dashboard() {

  const navigate = useNavigate()

  // 🔥 STATE
  const [threatLevel, setThreatLevel] = useState(95)
  const [status, setStatus] = useState("CRITICAL")

  const [stats, setStats] = useState({
    clean: 847,
    alerts: 23,
    blocked: 156,
    monitored: 12
  })

  // 🔥 API CONNECT
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/honeypot")
        const data = await res.json()

        const s = data?.stats || {}
        const active = s.active || 0

        setThreatLevel(Math.min(active * 10, 100))

        setStats({
          clean: 1000 - active,
          alerts: active,
          blocked: s.blocked || 0,
          monitored: Math.floor(active / 2)
        })

        if (active > 10) setStatus("CRITICAL")
        else if (active > 5) setStatus("MONITORING")
        else setStatus("SAFE")

      } catch (err) {
        console.log("API error:", err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)

  }, [])

  return (
    <div className="dashboard">

      {/* ===== HEADER ===== */}
      <div className="header">
        <h1>AEGIS SENTINEL</h1>
        <p>Status: {status}</p>

        {/* 🔥 HONEYPOD BUTTON */}
        <button
          className="nav-btn"
          onClick={() => navigate("/honeypod")}
        >
          View Honeypod Activity
        </button>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid">

        {/* LEFT PANEL */}
        <div className="panel left">
          <h3>ACTIVE PROCESSES</h3>
          <p>chrome.exe - LOW</p>
          <p>node.exe - LOW</p>
          <p>python.exe - MEDIUM</p>
          <p>powershell.exe - HIGH</p>
        </div>

        {/* CENTER PANEL */}
        <div className="panel center">
          <h2 className="alert">SUSPICIOUS SYSCALL DETECTED</h2>

          <div className="circle">
            <span>{threatLevel}</span>
          </div>

          <p>{status}</p>
        </div>

        {/* RIGHT PANEL */}
        <div className="panel right">
          <h3>RESPONSE ACTIONS</h3>

          <button className="btn green">ALLOW</button>
          <button className="btn blue">MONITOR</button>
          <button className="btn red">ISOLATE</button>
        </div>

      </div>

      {/* ===== THREAT INTELLIGENCE ===== */}
      <div className="threat-section">
        <h2 className="threat-title">THREAT INTELLIGENCE</h2>
        <AttackLogs />
      </div>

      {/* ===== STATS ===== */}
      <div className="stats">

        <div className="stat clean">
          <h4>Clean Processes</h4>
          <p>{stats.clean}</p>
        </div>

        <div className="stat alert">
          <h4>Alerts Today</h4>
          <p>{stats.alerts}</p>
        </div>

        <div className="stat blocked">
          <h4>Blocked Threats</h4>
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