import "../styles/dashboard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";

function Honeypod() {
  const navigate = useNavigate();

  // 🔥 STATE
  const [activities, setActivities] = useState([]);
  const [isolated, setIsolated] = useState(false);

  // 🔌 LISTEN: Honeypod Trigger
  useSocket("honeypod_activity", (data) => {
    setIsolated(true);

    const log = {
      time: new Date().toLocaleTimeString(),
      process: data?.process || "malware.exe",
      mutation: data?.mutation || "Unknown behavior detected",
    };

    setActivities((prev) => [log, ...prev].slice(0, 20));
  });

  return (
    <div className="dashboard">

      {/* ===== HEADER ===== */}
      <div className="header">
        <h1>HONEYPOD ISOLATION</h1>
        <p>
          Status:{" "}
          {isolated
            ? "ISOLATED ENVIRONMENT ACTIVE"
            : "WAITING FOR THREAT"}
        </p>

        <button
          className="nav-btn"
          onClick={() => navigate("/")}
        >
          Back to Dashboard
        </button>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid">

        {/* LEFT PANEL */}
        <div className="panel left">
          <h3>ISOLATED PROCESS</h3>

          {isolated ? (
            <>
              <p className="danger">malware.exe</p>
              <p>Container: honeypod_sandbox_01</p>
              <p>Network: BLOCKED</p>
              <p>Filesystem: FAKE</p>
            </>
          ) : (
            <p>No threats isolated</p>
          )}
        </div>

        {/* CENTER PANEL */}
        <div className="panel center">
          <h2 className="alert">ISOLATION STATUS</h2>

          <div className="circle">
            <span>{isolated ? "ACTIVE" : "IDLE"}</span>
          </div>

          <p>
            {isolated
              ? "Threat contained safely"
              : "Monitoring system..."}
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="panel right">
          <h3>ENVIRONMENT DETAILS</h3>
          <p>OS: Simulated Linux</p>
          <p>Privileges: Restricted</p>
          <p>Outbound Traffic: Disabled</p>
        </div>

      </div>

      {/* ===== ACTIVITY LOG ===== */}
      <div className="threat-section">
        <h2 className="threat-title">MALWARE BEHAVIOR LOG</h2>

        {activities.length === 0 && (
          <p>No activity yet...</p>
        )}

        {activities.map((a, i) => (
          <div key={i}>
            [{a.time}] {a.process} → {a.mutation}
          </div>
        ))}
      </div>

    </div>
  );
}

export default Honeypod;