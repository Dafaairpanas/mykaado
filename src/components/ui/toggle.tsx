"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, onPressedChange, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        onClick={() => onPressedChange(!pressed)}
        className={cn(
          "inline-flex items-center justify-center h-9 px-3 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors border-[length:var(--bw-sm)] border-solid",
          pressed 
            ? "bg-[var(--color-accent)] text-[var(--color-btn-text)] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] data-[style=modern]:shadow-none" 
            : "bg-[var(--color-bg-nav)] text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-main)]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Toggle.displayName = "Toggle";
