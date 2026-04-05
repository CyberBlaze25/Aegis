import { BrowserRouter, Routes, Route } from "react-router-dom";

import { SocketProvider } from "../context/SocketContext.jsx";

import Navbar from "../components/Navbar.jsx";

import Dashboard from "../pages/Dashboard.jsx";
import Honeypod from "../pages/Honeypod.jsx";
import Telemetry from "../pages/Telemetry.jsx";
import Test from "../pages/Test.jsx";
import Sentinel from "../pages/Sentinel.jsx";

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>

        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          
          <Navbar />

          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/honeypod" element={<Honeypod />} />
              <Route path="/telemetry" element={<Telemetry />} />
              <Route path="/test" element={<Test />} />
              <Route path="/sentinel" element={<Sentinel />} />
            </Routes>
          </div>

        </div>

      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;