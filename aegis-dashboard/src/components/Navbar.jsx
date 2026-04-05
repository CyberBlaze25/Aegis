import { useNavigate, useLocation } from "react-router-dom"
import "../styles/navbar.css"

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="navbar">

      <div className="logo">
        AEGIS SENTINEL
      </div>

      <div className="nav-links">

        <button
          className={`nav-btn ${location.pathname === "/" ? "active dashboard" : "dashboard"}`}
          onClick={() => navigate("/")}
        >
          Dashboard
        </button>

        <button
          className={`nav-btn ${location.pathname === "/honeypod" ? "active honeypod" : "honeypod"}`}
          onClick={() => navigate("/honeypod")}
        >
          Honeypod
        </button>

        <button
          className={`nav-btn ${location.pathname === "/telemetry" ? "active telemetry" : "telemetry"}`}
          onClick={() => navigate("/telemetry")}
        >
          Telemetry
        </button>

        <button
          className={`nav-btn ${location.pathname === "/sentinel" ? "active sentinel" : "sentinel"}`}
          onClick={() => navigate("/sentinel")}
        >
          Sentinel AI
        </button>

      </div>

    </div>
  )
}

export default Navbar