"use client";

import { Check, Palette } from "lucide-react";

import { CHART_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const personalizada = !CHART_COLORS.includes(value);

  return (
    <div className="flex items-center gap-2">
      {/* Cor personalizada */}
      <label
        className={cn(
          "relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 transition",
          personalizada ? "border-foreground" : "border-border"
        )}
        style={
          personalizada
            ? { backgroundColor: value }
            : {
                background:
                  "conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #06b6d4, #6366f1, #ec4899, #ef4444)",
              }
        }
        title="Cor personalizada"
      >
        <input
          type="color"
          value={personalizada ? value : "#6366f1"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Escolher cor personalizada"
        />
        {personalizada ? (
          <Check className="size-4 text-white" />
        ) : (
          <Palette className="size-4 text-white drop-shadow" />
        )}
      </label>

      <span className="mx-1 h-6 w-px bg-border" />

      {/* Cores predefinidas */}
      {CHART_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "flex size-8 items-center justify-center rounded-full border-2 transition",
            value === c ? "border-foreground" : "border-transparent"
          )}
          style={{ backgroundColor: c }}
          aria-label={`Cor ${c}`}
        >
          {value === c && <Check className="size-4 text-white" />}
        </button>
      ))}
    </div>
  );
}
