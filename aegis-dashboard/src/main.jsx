import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// ✅ IMPORTANT: correct path
import App from "./app/App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);