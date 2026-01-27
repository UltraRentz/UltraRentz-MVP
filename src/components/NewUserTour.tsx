// src/components/NewUserTour.tsx
import React, { useEffect, useRef } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

const tourSteps = [
  {
    id: "welcome",
    text: "Welcome to UltraRentz! Your Digital Vault keeps your deposit safe, with no crypto jargon required.",
    attachTo: { element: "#vault-intro", on: "bottom" },
    buttons: [
      { text: "Next", action: () => { tour.next(); } }
    ]
  },
  {
    id: "email-signatory",
    text: "Sign with your email—no wallet or ETH needed! UltraRentz covers all Security Transaction fees so you onboard instantly.",
    attachTo: { element: "#email-sign", on: "bottom" },
    buttons: [
      { text: "Next", action: () => { tour.next(); } }
    ]
  },
  {
    id: "account-abstraction",
    text: "UltraRentz uses a Secure Digital Vault for seamless, secure onboarding. You control your deposit, not your keys.",
    attachTo: { element: "#account-abstraction", on: "bottom" },
    buttons: [
      { text: "Finish", action: () => { tour.complete(); } }
    ]
  }
];

let tour: Shepherd.Tour;

const NewUserTour: React.FC = () => {
  const tourRef = useRef<Shepherd.Tour | null>(null);

  useEffect(() => {
    tour = new Shepherd.Tour({
      defaultStepOptions: {
        scrollTo: true,
        cancelIcon: { enabled: true },
        classes: "shepherd-theme-arrows"
      },
      useModalOverlay: true
    });
    tourSteps.forEach(step => tour.addStep(step));
    tourRef.current = tour;
    tour.start();
    return () => { tour && tour.complete(); };
  }, []);

  return null;
};

export default NewUserTour;
