import "../styles/telemetry.css";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

function Telemetry() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const popupRef = useRef(null);
  
  // 🧠 Central Nervous System
  const { data, status: socketStatus } = useSocket();

  // 🕸️ State
  const [stats, setStats] = useState({ nodes: 0, threats: 0 });
  const [selectedThreat, setSelectedThreat] = useState(null);

  // ⚛️ Physics Memory
  const nodesRef = useRef([]);
  const linksRef = useRef([]);

  // --- 1. DATA INGESTION (Rolling 30 FIFO Queue) ---
  useEffect(() => {
    if (!data) return;

    let nodes = nodesRef.current;
    let links = linksRef.current;

    const sourceId = `${data.comm} [${data.pid}]`;
    const targetId = `${data.dest_ip}:${data.dest_port}`;
    const isDanger = data.score >= 0.7;

    // Create or Update Local Source Node
    let sourceNode = nodes.find(n => n.id === sourceId);
    if (!sourceNode) {
      sourceNode = { id: sourceId, pid: data.pid, type: "local", danger: isDanger, x: window.innerWidth / 2, y: window.innerHeight / 2, vx: Math.random() - 0.5, vy: Math.random() - 0.5 };
      nodes.push(sourceNode);
    } else if (isDanger) sourceNode.danger = true; // Upgrade to danger

    // Create or Update Remote Target Node
    let targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) {
      targetNode = { id: targetId, type: "remote", danger: isDanger, x: window.innerWidth / 2 + (Math.random()*100-50), y: window.innerHeight / 2 + (Math.random()*100-50), vx: Math.random() - 0.5, vy: Math.random() - 0.5 };
      nodes.push(targetNode);
    } else if (isDanger) targetNode.danger = true;

    // Add Link to Queue
    links.push({ source: sourceId, target: targetId, danger: isDanger });
    
    // ENFORCE ROLLING 30 (FIFO)
    if (links.length > 30) {
      links.shift();
    }

    // Garbage Collect Orphaned Nodes (Nodes with no links in the active 30)
    nodesRef.current = nodes.filter(n => links.some(l => l.source === n.id || l.target === n.id));

  }, [data]);

  // --- 2. PHYSICS & RENDERING ENGINE ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      // Dark radar background with slight motion blur
      ctx.fillStyle = "rgba(2, 6, 23, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let nodes = nodesRef.current;
      let links = linksRef.current;

      setStats({
        nodes: nodes.length,
        threats: nodes.filter(n => n.danger).length
      });

      // Physics: Force-Directed Graph
      for (let i = 0; i < nodes.length; i++) {
        // Repulsion
        for (let j = i + 1; j < nodes.length; j++) {
          let dx = nodes[i].x - nodes[j].x;
          let dy = nodes[i].y - nodes[j].y;
          let dist = Math.sqrt(dx*dx + dy*dy) || 1;
          if (dist < 150) {
            let force = (150 - dist) / 150 * 0.3;
            nodes[i].vx += (dx / dist) * force;
            nodes[i].vy += (dy / dist) * force;
            nodes[j].vx -= (dx / dist) * force;
            nodes[j].vy -= (dy / dist) * force;
          }
        }
        // Gravity (Pull to center)
        nodes[i].vx += (canvas.width / 2 - nodes[i].x) * 0.0005;
        nodes[i].vy += (canvas.height / 2 - nodes[i].y) * 0.0005;
      }

      // Physics: Attraction (Links)
      links.forEach(link => {
        let s = nodes.find(n => n.id === link.source);
        let t = nodes.find(n => n.id === link.target);
        if (s && t) {
          let dx = t.x - s.x;
          let dy = t.y - s.y;
          let dist = Math.sqrt(dx*dx + dy*dy) || 1;
          let force = (dist - 100) * 0.01;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
          t.vx -= (dx / dist) * force;
          t.vy -= (dy / dist) * force;
        }
      });

      // Render Links
      links.forEach(link => {
        const s = nodes.find(n => n.id === link.source);
        const t = nodes.find(n => n.id === link.target);
        if (!s || !t) return;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = link.danger ? "rgba(244, 63, 94, 0.8)" : "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = link.danger ? 3 : 1;
        ctx.stroke();
      });

      // Render Nodes
      nodes.forEach(node => {
        node.vx *= 0.85; // Friction
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;

        // Keep inside screen bounds
        node.x = Math.max(20, Math.min(canvas.width - 20, node.x));
        node.y = Math.max(20, Math.min(canvas.height - 20, node.y));

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.type === "local" ? 8 : 5, 0, Math.PI * 2);

        // Highlight ring if actively selected
        if (selectedThreat && selectedThreat.id === node.id) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (node.danger) {
          ctx.fillStyle = "rgba(244, 63, 94, 1)";
          ctx.shadowColor = "rgba(244, 63, 94, 0.8)";
          ctx.shadowBlur = 15;
        } else if (node.type === "local") {
          ctx.fillStyle = "rgba(255, 255, 255, 1)";
          ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = "rgba(56, 189, 248, 1)";
          ctx.shadowColor = "rgba(56, 189, 248, 0.5)";
          ctx.shadowBlur = 5;
        }

        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(168, 178, 209, 1)";
        ctx.font = "12px monospace";
        ctx.fillText(node.id, node.x + 12, node.y + 4);
      });

      // Sync HTML Popup directly to canvas coordinates (60FPS smooth)
      if (selectedThreat && popupRef.current) {
        const activeNode = nodesRef.current.find(n => n.id === selectedThreat.id);
        if (activeNode) {
          popupRef.current.style.left = `${activeNode.x + 15}px`;
          popupRef.current.style.top = `${activeNode.y - 20}px`;
        } else {
          setSelectedThreat(null); // Node fell off the FIFO queue
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [selectedThreat]);

  // --- 3. RAYCASTING (Click Interaction) ---
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node (15px generous hit radius)
    const clickedNode = nodesRef.current.find(n => Math.hypot(n.x - x, n.y - y) < 15);

    // ONLY SHOW MENU IF IT IS AN ISOLATED THREAT
    if (clickedNode && clickedNode.danger) {
      setSelectedThreat(clickedNode);
    } else {
      setSelectedThreat(null); // Clicked background or safe node -> close menu
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 80px)", overflow: "hidden", background: "#020617" }}>
      
      {/* FULL SCREEN CANVAS */}
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        style={{ display: "block", cursor: selectedThreat ? "pointer" : "crosshair" }} 
      />

      {/* DYNAMIC HUD POPUP (Only mounts if a threat is selected) */}
      {selectedThreat && (
        <div 
          ref={popupRef}
          style={{ 
            position: "absolute", zIndex: 50, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(5px)",
            border: "1px solid #f43f5e", borderRadius: "8px", padding: "15px", width: "220px",
            boxShadow: "0 0 20px rgba(244, 63, 94, 0.3)", pointerEvents: "auto", transition: "opacity 0.2s"
          }}
        >
          <p style={{ color: "#f43f5e", margin: "0 0 10px 0", fontSize: "0.8rem", fontWeight: "bold" }}>🚨 ISOLATED ENTITY</p>
          <p style={{ color: "white", margin: "0 0 15px 0", fontFamily: "monospace", fontSize: "0.9rem" }}>{selectedThreat.id}</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button 
              onClick={() => navigate("/sentinel", { state: { targetPid: selectedThreat.pid } })}
              style={{ background: "#1e293b", color: "white", border: "1px solid #8892b0", padding: "8px", fontSize: "0.8rem", width: "100%" }}
            >
              🔎 Sentinel Report
            </button>
            <button 
              onClick={() => navigate("/honeypod", { state: { targetPid: selectedThreat.pid } })}
              style={{ background: "#4c0519", color: "#f43f5e", border: "1px solid #f43f5e", padding: "8px", fontSize: "0.8rem", width: "100%" }}
            >
              🍯 Inspect Honeypod
            </button>
          </div>
        </div>
      )}

      {/* TOP LEFT HUD (Static) */}
      <div style={{ position: "absolute", top: "20px", left: "30px", background: "rgba(15, 23, 42, 0.8)", padding: "20px", borderRadius: "8px", border: "1px solid #1e293b", zIndex: 10, pointerEvents: "none" }}>
        <h1 style={{ color: "#f43f5e", margin: 0, letterSpacing: "2px", fontSize: "1.2rem" }}>LIVE INVESTIGATION RADAR</h1>
        <p style={{ color: socketStatus === "CONNECTED" ? "#64ffda" : "#ff4444", margin: "5px 0 15px 0", fontSize: "0.85rem", fontWeight: "bold" }}>
          {socketStatus === "CONNECTED" ? "SENSOR SYNCED" : "LINK LOST"}
        </p>
        
        <div style={{ display: "flex", gap: "20px" }}>
          <div>
            <p style={{ color: "#8892b0", margin: "0 0 5px 0", fontSize: "0.8rem" }}>ACTIVE NODES (MAX 30)</p>
            <p style={{ color: "white", margin: 0, fontSize: "1.5rem", fontFamily: "monospace" }}>{stats.nodes}</p>
          </div>
          <div>
            <p style={{ color: "#8892b0", margin: "0 0 5px 0", fontSize: "0.8rem" }}>ISOLATED THREATS</p>
            <p style={{ color: "#ff4444", margin: 0, fontSize: "1.5rem", fontFamily: "monospace" }}>{stats.threats}</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Telemetry;
