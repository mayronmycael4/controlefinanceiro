"use client";

import { useEffect } from "react";

const MASK = "••••••";
const CURRENCY = /R\$\s*[\d.,]+/g;

function isPublicContext(node: Node) {
  const parent = node.parentElement;
  if (!parent) return false;
  const context = parent.closest("[data-public-financial='true']") ?? parent.closest("[data-label]");
  const text = context?.textContent?.toLowerCase() ?? "";
  return context?.getAttribute("data-public-financial") === "true" || text.includes("cotação atual") || text.includes("cotacao atual") || text.includes("dividend yield") || text.includes("dy 12m");
}

export function PrivacyDisplayGuard() {
  useEffect(() => {
    const originals = new WeakMap<Text, string>();
    const process = () => {
      const hidden = document.documentElement.dataset.privacyHidden === "true";
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let current: Node | null;
      while ((current = walker.nextNode())) nodes.push(current as Text);
      for (const node of nodes) {
        const original = originals.get(node) ?? node.nodeValue ?? "";
        if (!originals.has(node)) originals.set(node, original);
        if (hidden && !isPublicContext(node) && CURRENCY.test(original)) node.nodeValue = original.replace(CURRENCY, MASK);
        else if (!hidden && node.nodeValue !== original) node.nodeValue = original;
        CURRENCY.lastIndex = 0;
      }
    };
    const observer = new MutationObserver(() => process());
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    window.addEventListener("privacychange", process);
    process();
    return () => { observer.disconnect(); window.removeEventListener("privacychange", process); };
  }, []);
  return null;
}
