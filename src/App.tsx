import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// ThemeProvider and ThemeContext removed
import { AuthProvider } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import MottoFooter from "./components/MottoFooter";
import EscrowOrchestrator from "./components/EscrowOrchestrator";
// import Yield from "./components/Yield"; // unused
import HomePage from "./pages/HomePage";
import RentDepositsPage from "./pages/RentDepositsPage";
import YieldPage from "./pages/SignatoryYieldPage";
import DisputesPage from "./pages/DisputesPage";
import DashboardPage from "./pages/DashboardPage";
import "./styles.css";

const AppContent: React.FC = () => {
  // Always use dark theme classes via Tailwind or CSS
  return (
    <Router>
      <DashboardLayout>
        {/* Theme toggle removed, always dark theme */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rent-deposits" element={<RentDepositsPage />} />
          <Route path="/yield" element={<YieldPage />} />
          <Route path="/disputes" element={<DisputesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/escrow" element={<EscrowOrchestrator />} />
        </Routes>
        <MottoFooter />
      </DashboardLayout>
    </Router>
  );
};


export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
