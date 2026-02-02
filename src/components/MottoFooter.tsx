import React from "react";

const MottoFooter: React.FC = () => (
  <footer
    className="fixed bottom-0 left-0 w-full z-50 flex justify-center items-center py-2 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-pink-900/80"
    style={{ boxShadow: "0 -2px 16px 0 rgba(99,102,241,0.10)" }}
  >
    <span
      className="text-lg sm:text-xl font-bold tracking-wide animate-motto-pulse"
      style={{ color: "#e0e7ef", letterSpacing: "0.08em" }}
    >
      Protect <span className="mx-1">•</span> Grow <span className="mx-1">•</span> Resolve
    </span>
  </footer>
);

export default MottoFooter;
