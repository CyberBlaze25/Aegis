import { useNavigate } from "react-router-dom"

function Navbar() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 25px",
        borderBottom: "1px solid #1e293b",
        background: "#020617"
      }}
    >

      {/* LOGO */}
      <div
        style={{
          color: "#22d3ee",
          fontSize: "1.5rem",
          fontWeight: "bold",
          textShadow: "0 0 10px rgba(34, 211, 238, 0.7)"
        }}
      >
        AEGIS SENTINEL
      </div>

      {/* NAV BUTTONS */}
      <div style={{ display: "flex", gap: "10px" }}>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "8px 14px",
            background: "#38bdf8",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            color: "black",
            fontWeight: "bold"
          }}
        >
          Dashboard
        </button>

        <button
          onClick={() => navigate("/honeypod")}
          style={{
            padding: "8px 14px",
            background: "#22c55e",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            color: "black",
            fontWeight: "bold"
          }}
        >
          Honeypod
        </button>

      </div>

    </div>
  )
}

export default Navbar