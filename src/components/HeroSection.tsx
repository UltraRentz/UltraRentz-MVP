import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

const HeroSection: React.FC = () => {
  const dotsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create animated dots background
    const createDots = () => {
      if (!dotsRef.current) return;

      const container = dotsRef.current;
      const dotCount = 200;
      const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#10B981"];

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement("div");
        dot.className = "absolute w-1 h-1 rounded-full opacity-60";
        dot.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.top = `${Math.random() * 100}%`;
        container.appendChild(dot);
      }
    };

    createDots();

    // Animate dots
    const dots = dotsRef.current?.children;
    if (dots) {
      gsap.to(dots, {
        y: () => Math.random() * 100 - 50,
        x: () => Math.random() * 100 - 50,
        duration: () => Math.random() * 3 + 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.1,
      });
    }

    // Animate content
    gsap.fromTo(
      contentRef.current,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power3.out" }
    );
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      {/* Animated Dots Background */}
      <div
        ref={dotsRef}
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            "radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)",
        }}
      />

      {/* Main Content - Full Width */}
      <div className="relative z-10 flex h-screen">
        {/* Hero Content - Full Width */}
        <div
          ref={contentRef}
          className="flex-1 flex items-center justify-center relative px-4 py-16 overflow-y-auto"
        >
          <div className="text-center max-w-6xl w-full">
            <h1
              className="text-4xl lg:mt-0 mt-40 sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 sm:mb-6 leading-tight"
              style={{ color: "var(--text-color)" }}
            >
              <span className="bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent">
                UltraRentz
              </span>
            </h1>
            <h2
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-4 sm:mb-6 font-light px-4"
              style={{ color: "var(--text-color)" }}
            >
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">
                Protect • Grow • Resolve
              </span>
              <br />
              <span style={{ color: "var(--text-color)", opacity: 0.8 }}>
                The premium way to manage and grow your rent deposits
              </span>
            </h2>
            <p
              className="text-base sm:text-lg mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-4 fade-in-text"
              style={{ color: "var(--text-color)", opacity: 0.8 }}
            >
              Manage rent deposits simply and securely. Get help with disputes, earn interest, and pay or receive deposits your way.
            </p>

            {/* CTA Buttons - Clearer Labels with Tooltips */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 px-4">
              <Link
                to="/rent-deposits"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-center"
                title="Protect: Start a new deposit to keep your tenant’s money safe and secure."
                data-motto="Protect"
              >
                Start a New Deposit
              </Link>
              <Link
                style={{ color: "var(--text-color)" }}
                to="/dashboard"
                className="border-2 border-gray-600 hover:border-blue-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 hover:bg-white/5 text-center"
                title="Grow: View your deposits and see how much interest you’ve earned."
                data-motto="Grow"
              >
                View My Deposits
              </Link>
            </div>

            {/* Core Features - Plain English, No Jargon, With Tooltips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 text-center px-4 mt-8">
              <div title="Pay or receive deposits by bank, card, or your preferred method. No crypto or technical setup needed.">
                <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">Flexible Payment Options</div>
                <div className="text-xs sm:text-sm" style={{ color: "var(--text-color)", opacity: 0.7 }}>
                  Pay or receive deposits by bank transfer, card, or your preferred method—simple and secure.
                </div>
              </div>
              <div title="Your deposit is sent back to you automatically at the end of the tenancy. No paperwork or chasing required.">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">Automatic Deposit Return</div>
                <div className="text-xs sm:text-sm" style={{ color: "var(--text-color)", opacity: 0.7 }}>
                  Your deposit is sent back to you automatically at the end of the tenancy—no paperwork needed.
                </div>
              </div>
              <div title="If there’s a disagreement, our team helps resolve it quickly and fairly for everyone.">
                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">Get Help with Disputes</div>
                <div className="text-xs sm:text-sm" style={{ color: "var(--text-color)", opacity: 0.7 }}>
                  If there’s a disagreement, our team helps resolve it quickly and fairly for everyone.
                </div>
              </div>
              <div title="Watch your deposit grow with interest while it’s safely held for you. You keep all the earnings.">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">Interest Earned</div>
                <div className="text-xs sm:text-sm" style={{ color: "var(--text-color)", opacity: 0.7 }}>
                  Watch your deposit grow with interest while it’s safely held for you.
                </div>
              </div>
              <div title="Take your deposit record with you when you move to a new property or landlord. No hassle, no extra steps.">
                <div className="text-2xl sm:text-3xl font-bold text-pink-400 mb-2">Move Deposit Easily</div>
                <div className="text-xs sm:text-sm" style={{ color: "var(--text-color)", opacity: 0.7 }}>
                  Take your deposit record with you when you move to a new property or landlord—no hassle.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay - This will be handled by the parent component */}
    </div>
  );
};

export default HeroSection;
