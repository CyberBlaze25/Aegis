import Dashboard from "./pages/Dashboard"
import Honeypod from "./pages/Honeypod"
import { BrowserRouter, Routes, Route } from "react-router-dom"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/honeypod" element={<Honeypod />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App