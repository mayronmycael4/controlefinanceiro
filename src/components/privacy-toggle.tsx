"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

export function PrivacyToggle() {
  const hidden = useSyncExternalStore(
    (callback) => {
      window.addEventListener("privacy-mode-change", callback);
      return () => window.removeEventListener("privacy-mode-change", callback);
    },
    () => window.localStorage.getItem("privacy-mode") === "hidden",
    () => false,
  );
  useEffect(() => {
    const sync = () => {
      const isHidden = document.documentElement.dataset.privacyHidden === "true";
      document.querySelectorAll<HTMLElement>('[data-sensitive="true"]').forEach((element) => {
        if (isHidden) {
          if (!element.hasAttribute("data-privacy-role")) {
            element.dataset.privacyRole = element.getAttribute("role") ?? "";
            element.dataset.privacyLabel = element.getAttribute("aria-label") ?? "";
          }
          element.setAttribute("role", "img");
          element.setAttribute("aria-label", "••••••");
        } else if (element.hasAttribute("data-privacy-role")) {
          const role = element.dataset.privacyRole;
          const label = element.dataset.privacyLabel;
          if (role) element.setAttribute("role", role); else element.removeAttribute("role");
          if (label) element.setAttribute("aria-label", label); else element.removeAttribute("aria-label");
          delete element.dataset.privacyRole;
          delete element.dataset.privacyLabel;
        }
      });
      document.querySelectorAll<HTMLElement>('[data-privacy-chart="true"]').forEach((chart) => {
        if (isHidden) {
          if (!chart.hasAttribute("data-privacy-role")) {
            chart.dataset.privacyRole = chart.getAttribute("role") ?? "";
            chart.dataset.privacyLabel = chart.getAttribute("aria-label") ?? "";
          }
          chart.setAttribute("role", "img");
          chart.setAttribute("aria-label", `${chart.querySelector('[data-slot="card-title"]')?.textContent?.trim() ?? "Gráfico financeiro"}; valores ocultos pelo modo de privacidade`);
          chart.querySelectorAll<HTMLElement>('[role="application"]').forEach((surface) => surface.setAttribute("aria-hidden", "true"));
        } else {
          chart.querySelectorAll<HTMLElement>('[role="application"][aria-hidden="true"]').forEach((surface) => surface.removeAttribute("aria-hidden"));
          if (chart.hasAttribute("data-privacy-role")) {
            const role = chart.dataset.privacyRole;
            const label = chart.dataset.privacyLabel;
            if (role) chart.setAttribute("role", role); else chart.removeAttribute("role");
            if (label) chart.setAttribute("aria-label", label); else chart.removeAttribute("aria-label");
            delete chart.dataset.privacyRole;
            delete chart.dataset.privacyLabel;
          }
        }
      });
    };
    const value = window.localStorage.getItem("privacy-mode") === "hidden";
    document.documentElement.dataset.privacyHidden = value ? "true" : "false";
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  function toggle() {
    const next = !hidden;
    window.localStorage.setItem("privacy-mode", next ? "hidden" : "visible");
    document.documentElement.dataset.privacyHidden = next ? "true" : "false";
    window.dispatchEvent(new Event("privacy-mode-change"));
    document.querySelectorAll<HTMLElement>('[data-sensitive="true"]').forEach((element) => {
      if (next) {
        if (!element.hasAttribute("data-privacy-role")) {
          element.dataset.privacyRole = element.getAttribute("role") ?? "";
          element.dataset.privacyLabel = element.getAttribute("aria-label") ?? "";
        }
        element.setAttribute("role", "img");
        element.setAttribute("aria-label", "••••••");
      } else if (element.hasAttribute("data-privacy-role")) {
        const role = element.dataset.privacyRole;
        const label = element.dataset.privacyLabel;
        if (role) element.setAttribute("role", role); else element.removeAttribute("role");
        if (label) element.setAttribute("aria-label", label); else element.removeAttribute("aria-label");
        delete element.dataset.privacyRole;
        delete element.dataset.privacyLabel;
      }
    });
    document.querySelectorAll<HTMLElement>('[data-privacy-chart="true"]').forEach((chart) => {
      if (next) {
        if (!chart.hasAttribute("data-privacy-role")) {
          chart.dataset.privacyRole = chart.getAttribute("role") ?? "";
          chart.dataset.privacyLabel = chart.getAttribute("aria-label") ?? "";
        }
        chart.setAttribute("role", "img");
        chart.setAttribute("aria-label", `${chart.querySelector('[data-slot="card-title"]')?.textContent?.trim() ?? "Gráfico financeiro"}; valores ocultos pelo modo de privacidade`);
        chart.querySelectorAll<HTMLElement>('[role="application"]').forEach((surface) => surface.setAttribute("aria-hidden", "true"));
      } else {
        chart.querySelectorAll<HTMLElement>('[role="application"][aria-hidden="true"]').forEach((surface) => surface.removeAttribute("aria-hidden"));
        if (chart.hasAttribute("data-privacy-role")) {
          const role = chart.dataset.privacyRole;
          const label = chart.dataset.privacyLabel;
          if (role) chart.setAttribute("role", role); else chart.removeAttribute("role");
          if (label) chart.setAttribute("aria-label", label); else chart.removeAttribute("aria-label");
          delete chart.dataset.privacyRole;
          delete chart.dataset.privacyLabel;
        }
      }
    });
  }
  return <Button variant="ghost" size="icon" onClick={toggle} aria-label={hidden ? "Mostrar valores financeiros" : "Ocultar valores financeiros"} title={hidden ? "Mostrar valores financeiros" : "Ocultar valores financeiros"}>{hidden ? <EyeOff /> : <Eye />}</Button>;
}
