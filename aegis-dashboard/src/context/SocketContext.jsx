import { createContext, useContext, useEffect, useState } from "react"

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {

  const [data, setData] = useState(null)
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState("DISCONNECTED")

  useEffect(() => {

    const socket = new WebSocket("ws://localhost:8080/api/v1/telemetry/live")

    socket.onopen = () => {
      console.log("🟢 Connected")
      setStatus("CONNECTED")
    }

    socket.onmessage = (event) => {
      const incoming = JSON.parse(event.data)

      // 🔥 store EVERYTHING
      setData(incoming)
      setLogs(prev => [incoming, ...prev.slice(0, 50)])
    }

    socket.onclose = () => {
      setStatus("DISCONNECTED")
    }

    socket.onerror = () => {
      setStatus("ERROR")
    }

    return () => socket.close()

  }, [])

  return (
    <SocketContext.Provider value={{ data, logs, status }}>
      {children}
    </SocketContext.Provider>
  )
}