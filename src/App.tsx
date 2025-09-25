import React from "react";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import RentDepositApp from "./components/RentDepositApp";
import "./styles.css";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
      <span className="hidden sm:inline ml-2">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="main-container">
      <ThemeToggle />
      <RentDepositApp />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
