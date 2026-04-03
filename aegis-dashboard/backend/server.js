const express = require("express")
const cors = require("cors")

const app = express()
app.use(cors())

// 🔥 MAIN SYSTEM API
app.get("/api/system", (req, res) => {

  const attacks = [
    {
      ip: "192.168.1.10",
      type: "Brute Force",
      port: 22,
      country: "India",
      risk: "High",
      time: new Date().toLocaleTimeString()
    },
    {
      ip: "45.23.11.9",
      type: "Port Scan",
      port: 80,
      country: "USA",
      risk: "Medium",
      time: new Date().toLocaleTimeString()
    }
  ]

  const stats = {
    clean: Math.floor(Math.random() * 1000),
    alerts: Math.floor(Math.random() * 100),
    blocked: Math.floor(Math.random() * 500),
    monitored: Math.floor(Math.random() * 50)
  }

  const dashboard = {
    threatLevel: Math.floor(Math.random() * 100),
    status: ["SAFE", "MONITORING", "CRITICAL"][Math.floor(Math.random()*3)]
  }

  res.json({
    attacks,
    stats,
    dashboard
  })
})

// 🔥 HONEYPOT API
app.get("/api/honeypot", (req, res) => {

  const attacks = [
    {
      ip: "18.170.115.20",
      type: "SQL Injection",
      port: 80,
      country: "Russia",
      risk: "Low",
      time: new Date().toLocaleTimeString()
    }
  ]

  const stats = {
    total: Math.floor(Math.random() * 2000),
    blocked: Math.floor(Math.random() * 1500),
    active: Math.floor(Math.random() * 50)
  }

  res.json({ attacks, stats })
})

app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000")
})