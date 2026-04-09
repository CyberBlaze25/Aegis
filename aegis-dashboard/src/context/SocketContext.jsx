import { createContext, useContext, useEffect, useState } from "react"

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {

  const [data, setData] = useState(null)
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState("DISCONNECTED")

  useEffect(() => {
    let socket = null;

    // Phase 1: Hydrate from PostgreSQL and apply "Alert Cool-Down"
    const fetchHistory = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/v1/telemetry/history");
        const historyData = await res.json();
        
        if (historyData && historyData.length > 0) {
          // 1. Fill the history logs for the Sidebar/Terminal
          setLogs(historyData); 

          // 2. Alert Cool-Down Logic (5 Minutes)
          const newestEvent = historyData[0];
          const eventTime = new Date(newestEvent.timestamp).getTime();
          const now = Date.now();
          const FiveMinutesInMillis = 5 * 60 * 1000;

          if (now - eventTime < FiveMinutesInMillis) {
            // It's a fresh attack! Alert the dashboard.
            setData(newestEvent); 
          } else {
            // It's an old event. Leave data as 'null' to boot calmly.
            console.log("Historical data loaded. System currently nominal.");
          }
        }
      } catch (err) {
        console.error("Failed to fetch Sentinel history:", err);
      }
    };

    // Phase 2: Establish the Live WebSocket Connection
    const connectSocket = () => {
      socket = new WebSocket("ws://localhost:8080/api/v1/telemetry/live");

      socket.onopen = () => {
        console.log("🟢 Connected");
        setStatus("CONNECTED");
      };

      socket.onmessage = (event) => {
        const incoming = JSON.parse(event.data);
        
        // 🔥 Store EVERYTHING live
        setData(incoming);
        setLogs(prev => [incoming, ...prev].slice(0, 50)); 
      };

      socket.onclose = () => {
        setStatus("DISCONNECTED");
      };

      socket.onerror = () => {
        setStatus("ERROR");
      };
    };

    // Execute Startup Sequence: Fetch History FIRST, then connect Socket
    fetchHistory().then(() => {
      connectSocket();
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };

  }, []);

  return (
    <SocketContext.Provider value={{ data, logs, status }}>
      {children}
    </SocketContext.Provider>
  )
}
