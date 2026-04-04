import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard.jsx";
import Honeypod from "../pages/Honeypod.jsx";
import Telemetry from "../pages/Telemetry.jsx";
import Test from "../pages/Test.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/honeypod" element={<Honeypod />} />
        <Route path="/telemetry" element={<Telemetry />} />   {/* IMPORTANT */}
        <Route path="/test" element={<Test />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;