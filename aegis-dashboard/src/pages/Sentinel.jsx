import "../styles/sentinel.css"
import { useState, useEffect } from "react"
import { useSocket } from "../context/SocketContext"
import { useNavigate } from "react-router-dom"

function Sentinel() {

  const { data, logs, status } = useSocket()
  const navigate = useNavigate()

  const [score, setScore] = useState(0)
  const [response, setResponse] = useState("NONE")

  useEffect(() => {
    if (!data) return

    const s = data.score || 0
    setScore(s)

    if (s > 80) setResponse("ISOLATED")
    else if (s > 50) setResponse("MONITORING")
    else setResponse("ALLOWED")

  }, [data])

  return (
    <div className={`sentinel ${data?.is_anomalous ? "alert-mode" : ""}`}>

      {/* HEADER */}
      <div className="sentinel-header">
        <h1>🧠 SENTINEL AI CORE</h1>
        <span className={`connection ${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      {/* 🔥 FIXED BUTTON HERE */}
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "15px",
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          background: "#38bdf8",
          color: "black",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Back to Dashboard
      </button>

      {/* GRID */}
      <div className="sentinel-grid">

        {/* SCORE */}
        <div className="panel">
          <h3>THREAT SCORE</h3>

          <div className="score-circle">
            <span>{score}</span>
          </div>

          <p>
            {score > 80 ? "CRITICAL" : score > 50 ? "WARNING" : "SAFE"}
          </p>
        </div>

        {/* ANALYSIS */}
        <div className="panel">
          <h3>AI ANALYSIS</h3>

          {data ? (
            <>
              <p><b>Reason:</b> {data.reason}</p>
              <p><b>PID:</b> {data.pid}</p>
              <p><b>Score:</b> {data.score}</p>
            </>
          ) : (
            <p>No data yet</p>
          )}
        </div>

        {/* RESPONSE */}
        <div className="panel">
          <h3>AUTO RESPONSE</h3>

          <div className={`response-box ${response.toLowerCase()}`}>
            {response}
          </div>
        </div>

      </div>

      {/* LOGS */}
      <div className="logs">
        <h3>LIVE TELEMETRY</h3>

        {logs.map((log, i) => (
          <div
            key={i}
            className={`log ${log.is_anomalous ? "anomaly" : ""}`}
          >
            <span>{log.pid}</span>
            <span>{log.reason}</span>
            <span>{log.score}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Sentinel