import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EscrowOrchestrator from "./components/EscrowOrchestrator";
import DashboardLayout from "./components/DashboardLayout";
import Yield from "./components/Yield";
import "./styles.css";

export default function App() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Router>
      <DashboardLayout>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="theme-toggle mb-4"
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <Routes>
          <Route path="/" element={<EscrowOrchestrator />} />
          <Route path="/yield" element={<Yield />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}
