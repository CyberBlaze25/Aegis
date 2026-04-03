import "../styles/honeypot.css"
import { useState, useEffect } from "react"

function Honeypod() {

  // 🔥 STATE
  const [logs, setLogs] = useState([])
  const [score, setScore] = useState(0)
  const [connected, setConnected] = useState(false)

  useEffect(() => {

    // 🔥 CONNECT WEBSOCKET
    const socket = new WebSocket("ws://localhost:8080/api/v1/telemetry/live")

    // ✅ CONNECTED
    socket.onopen = () => {
      console.log("🟢 Connected to Sentinel")
      setConnected(true)
    }

    // 🔥 RECEIVE DATA
    socket.onmessage = (event) => {
      try {
        const threatData = JSON.parse(event.data)

        console.log("⚡ TELEMETRY:", threatData)

        // 🔥 ADD NEW LOG (top)
        setLogs(prev => [threatData, ...prev].slice(0, 25))

        // 🔥 UPDATE SCORE
        if (threatData.score !== undefined) {
          setScore(threatData.score)
        }

      } catch (err) {
        console.error("Parse error:", err)
      }
    }

    // ❌ DISCONNECTED
    socket.onclose = () => {
      console.log("🔴 Disconnected")
      setConnected(false)
    }

    // ❌ ERROR
    socket.onerror = (err) => {
      console.error("Socket error:", err)
    }

    // 🧹 CLEANUP
    return () => {
      socket.close()
    }

  }, [])

  return (
    <div className="honeypot">

      {/* HEADER */}
      <div className="hp-header">
        <h1>Honeypod Activity</h1>

        <span className={connected ? "status green" : "status red"}>
          ● {connected ? "System Armed" : "Disconnected"}
        </span>
      </div>

      {/* 🔥 SCORE DIAL */}
      <div className="score-box">

        <h3>Threat Score</h3>

        <div className="score-bar">
          <div
            className="score-fill"
            style={{ width: `${score}%` }}
          ></div>
        </div>

        <p>{score}%</p>

      </div>

      {/* 🔥 LIVE LOGS */}
      <div className="hp-table">

        <div className="table-header">
          <span>PID</span>
          <span>PROCESS</span>
          <span>SYSCALL</span>
          <span>STATUS</span>
          <span>SCORE</span>
          <span>TIME</span>
        </div>

        {logs.map((log, i) => (
          <div
            key={i}
            className={`log-row ${log.is_anomalous ? "anomaly" : ""}`}
          >
            <span>{log.pid}</span>
            <span>{log.process_name}</span>
            <span>{log.syscall}</span>

            <span>
              {log.is_anomalous ? "THREAT" : "SAFE"}
            </span>

            <span>{log.score}</span>

            <span>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        ))}

      </div>

    </div>
  )
}

export default Honeypod