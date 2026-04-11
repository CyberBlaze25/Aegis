import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SocketProvider } from "../context/SocketContext.jsx";
import Layout from "../components/ui/Layout.jsx";

import Dashboard from "../pages/Dashboard.jsx";
import Honeypod from "../pages/Honeypod.jsx";
import Telemetry from "../pages/Telemetry.jsx";
import Test from "../pages/Test.jsx";
import Sentinel from "../pages/Sentinel.jsx";

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/honeypod" element={<Honeypod />} />
            <Route path="/telemetry" element={<Telemetry />} />
            <Route path="/test" element={<Test />} />
            <Route path="/sentinel" element={<Sentinel />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
