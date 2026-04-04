import { useState, useEffect, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { useNavigate } from "react-router-dom";
import "../styles/telemetry.css";

function Telemetry() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [logs, setLogs] = useState([]);

  const nodesRef = useRef([]);
  const linksRef = useRef([]);

  // 🔌 SOCKET
  useSocket("new_event", (event) => {
    const source =
      event?.source || "proc_" + Math.floor(Math.random() * 5);
    const target =
      event?.target || "file_" + Math.floor(Math.random() * 5);

    const log = `[${new Date().toLocaleTimeString()}] ${source} → ${target}`;
    setLogs((prev) => [log, ...prev].slice(0, 20));

    const nodes = nodesRef.current;
    const links = linksRef.current;

    // 🔥 RANDOM SPAWN (fix collapse)
    if (!nodes.find((n) => n.id === source)) {
      nodes.push({
        id: source,
        x: Math.random() * 800,
        y: Math.random() * 300,
        vx: (Math.random() - 0.5),
        vy: (Math.random() - 0.5),
      });
    }

    if (!nodes.find((n) => n.id === target)) {
      nodes.push({
        id: target,
        x: Math.random() * 800,
        y: Math.random() * 300,
        vx: (Math.random() - 0.5),
        vy: (Math.random() - 0.5),
      });
    }

    links.push({ source, target });

    nodesRef.current = nodes.slice(-20);
    linksRef.current = links.slice(-30);
  });

  // 🎯 PHYSICS ENGINE (STABLE + REPULSION)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const animate = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 🔥 REPULSION (prevents collapsing)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];

          let dx = b.x - a.x;
          let dy = b.y - a.y;

          let dist = Math.sqrt(dx * dx + dy * dy) || 1;

          let force = 2000 / (dist * dist);

          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;

          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // 🔗 LINK FORCE
      links.forEach((link) => {
        const s = nodes.find((n) => n.id === link.source);
        const t = nodes.find((n) => n.id === link.target);
        if (!s || !t) return;

        const dx = t.x - s.x;
        const dy = t.y - s.y;

        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desired = 120;

        const force = (dist - desired) * 0.002;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      });

      // 🧠 MOVEMENT
      nodes.forEach((node) => {
        node.vx *= 0.85;
        node.vy *= 0.85;

        node.x += node.vx;
        node.y += node.vy;

        // boundary
        node.x = Math.max(20, Math.min(canvas.width - 20, node.x));
        node.y = Math.max(20, Math.min(canvas.height - 20, node.y));
      });

      // 🔗 DRAW LINKS
      links.forEach((link) => {
        const s = nodes.find((n) => n.id === link.source);
        const t = nodes.find((n) => n.id === link.target);
        if (!s || !t) return;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = "#00d4ff44";
        ctx.stroke();
      });

      // 🔵 DRAW NODES
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);

        ctx.fillStyle = "#00d4ff";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00d4ff";
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "10px monospace";
        ctx.fillText(node.id, node.x + 6, node.y + 4);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="telemetry">
      <div className="telemetry-header">
        <h1>LIVE TELEMETRY</h1>
        <button onClick={() => navigate("/")}>Back</button>
      </div>

      <div className="graph-box">
        <canvas ref={canvasRef} width={900} height={300} />
      </div>

      <div className="log-box">
        <h3>EVENT STREAM</h3>
        {logs.map((log, i) => (
          <div key={i} className="log">{log}</div>
        ))}
      </div>
    </div>
  );
}

export default Telemetry;