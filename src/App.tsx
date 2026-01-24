import { useState, useEffect } from "react";
import RentDepositApp from "./components/RentDepositApp";
import DashboardLayout from "./components/DashboardLayout";
import "./styles.css"; // Your existing custom styles

export default function App() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <DashboardLayout>
      <section id="deposit">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="theme-toggle mb-4"
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        {/* Deposit Flow: RentDepositApp orchestrates deposit process */}
        <RentDepositApp />
      </section>
    </DashboardLayout>
  );
}
