function ThreatIntel() {
  return (
    <div className="threat-container">

      <h3 className="section-title">THREAT INTELLIGENCE</h3>

      <div className="threat-box">

        {/* LEFT */}
        <div className="threat-left">
          <h4>SUMMARY</h4>
          <p className="summary">
            Attempted to inject code into remote process memory space
          </p>

          <h4>KEY FINDINGS</h4>
          <ul className="findings">
            <li>Code Injection via System Call</li>
            <li>Target: explorer.exe</li>
            <li>Method: NtCreateThreadEx API Abuse</li>
            <li>Origin: 192.168.1.104</li>
          </ul>
        </div>

        {/* RIGHT */}
        <div className="threat-right">
          <h4>CLASSIFICATION</h4>
          <div className="tags">
            <span>PROCESS INJECTION</span>
            <span>CRITICAL RISK</span>
            <span>MEMORY MANIPULATION</span>
            <span>PRIVILEGE ESCALATION</span>
          </div>

          <h4>TECHNICAL DETAILS</h4>
          <div className="tech-box">
            <p>Detection: Behavioral Analysis</p>
            <p>MITRE: T1055</p>
            <p>Confidence: 94%</p>
            <p>Time: 2026-03-29</p>
          </div>
        </div>

      </div>

      {/* STATS */}
      <div className="stats">

        <div className="stat clean">
          <h4>Clean Processes</h4>
          <p>847</p>
        </div>

        <div className="stat alert">
          <h4>Alerts Today</h4>
          <p>23</p>
        </div>

        <div className="stat blocked">
          <h4>Blocked Threats</h4>
          <p>156</p>
        </div>

        <div className="stat monitored">
          <h4>Monitored</h4>
          <p>12</p>
        </div>

      </div>

    </div>
  )
}

export default ThreatIntel