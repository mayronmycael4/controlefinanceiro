"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function PrivacyToggle() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => { const value = window.localStorage.getItem("privacy-mode") === "hidden"; setHidden(value); document.documentElement.dataset.privacyHidden = value ? "true" : "false"; }, []);
  function toggle() { const next = !hidden; setHidden(next); window.localStorage.setItem("privacy-mode", next ? "hidden" : "visible"); document.documentElement.dataset.privacyHidden = next ? "true" : "false"; window.dispatchEvent(new Event("privacychange")); }
  return <Button variant="ghost" size="icon" onClick={toggle} aria-label={hidden ? "Mostrar valores financeiros" : "Ocultar valores financeiros"} title={hidden ? "Mostrar valores financeiros" : "Ocultar valores financeiros"}>{hidden ? <EyeOff /> : <Eye />}</Button>;
}
