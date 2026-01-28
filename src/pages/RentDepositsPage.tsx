import React from "react";
import RentDepositApp from "../components/RentDepositApp";

const RentDepositsPage: React.FC = () => {
  return (
    <div
      className="min-h-screen pt-16"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <RentDepositApp />
    </div>
  );
};

export default RentDepositsPage;
