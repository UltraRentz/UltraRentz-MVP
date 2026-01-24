import React from "react";
import HelpFAQModal from "./HelpFAQModal";

export function useHelpFAQModal() {
  const [open, setOpen] = React.useState(false);
  const HelpFAQ = React.useCallback(() => <HelpFAQModal open={open} onClose={() => setOpen(false)} />, [open]);
  return { open, setOpen, HelpFAQ };
}
