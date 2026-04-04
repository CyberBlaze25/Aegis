import "../styles/dashboard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AttackLogs from "../components/AttackLogs";
import { useSocket } from "../hooks/useSocket";

function Dashboard() {
  const navigate = useNavigate();

  // 🔥 STATE
  const [threatLevel, setThreatLevel] = useState(50);
  const [status, setStatus] = useState("MONITORING");

  const [stats, setStats] = useState({
    clean: 847,
    alerts: 23,
    blocked: 156,
    monitored: 12,
  });

  // 🔌 REAL-TIME: Suspicion Score
  useSocket("suspicion_score", (data) => {
    if (!data) return;

    const level = Math.floor((data.value || 0) * 100);
    setThreatLevel(level);

    if (level > 70) setStatus("CRITICAL");
    else if (level > 40) setStatus("MONITORING");
    else setStatus("SAFE");
  });

  // 🔌 REAL-TIME: Events
  useSocket("new_event", () => {
    setStats((prev) => ({
      ...prev,
      alerts: prev.alerts + 1,
      monitored: prev.monitored + 1,
    }));
  });

  // 🔌 REAL-TIME: Honeypod
  useSocket("honeypod_activity", () => {
    setStats((prev) => ({
      ...prev,
      blocked: prev.blocked + 1,
    }));
  });

  return (
    <div className="dashboard">

      {/* ===== HEADER ===== */}
      <div className="header">
        <h1>AEGIS SENTINEL</h1>
        <p>Status: {status}</p>

        {/* 🔥 NAV BUTTONS */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            className="nav-btn"
            onClick={() => navigate("/honeypod")}
          >
            Honeypod
          </button>

          <button
            className="nav-btn"
            onClick={() => navigate("/telemetry")}
          >
            Telemetry
          </button>
        </div>
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
  );
}

export default Dashboard;