import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import TopHeader from "./layouts/TopHeader";
import MobileMenu from "./components/MobileMenu";
import HomePage from "./pages/HomePage";
import RentDepositsPage from "./pages/RentDepositsPage";
import SignatoryYieldPage from "./pages/SignatoryYieldPage";
import DisputesPage from "./pages/DisputesPage";
import DashboardPage from "./pages/DashboardPage";
import "./styles.css";

const AppContent: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <Router>
      <div
        className="min-h-screen"
        style={{
          backgroundColor: "var(--bg-color)",
          color: "var(--text-color)",
        }}
      >
        <TopHeader onMobileMenuToggle={toggleMobileMenu} />
        <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rent-deposits" element={<RentDepositsPage />} />
          <Route path="/signatory-yield" element={<SignatoryYieldPage />} />
          <Route path="/disputes" element={<DisputesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
  );
}
