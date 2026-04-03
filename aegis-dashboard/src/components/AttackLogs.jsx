import { useEffect, useState } from "react"

function AttackLogs() {

  const [logs, setLogs] = useState([])

  useEffect(() => {

    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/honeypot")
        const data = await res.json()

        const formatted = data.attacks.map(a => ({
          time: new Date().toLocaleTimeString(),
          status: a.risk,
          level: a.risk === "High" ? 90 : a.risk === "Medium" ? 50 : 20
        }))

        setLogs(formatted)

      } catch (e) {
        console.log(e)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)

  }, [])

  return (
    <div className="logs">
      <h3>ATTACK LOGS</h3>

      {logs.map((log, i) => (
        <p key={i}>
          [{log.time}] Status: {log.status} | Threat Level: {log.level}
        </p>
      ))}
    </div>
  )
}

export default AttackLogs