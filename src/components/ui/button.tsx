import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost" | "danger" | "nav";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold font-ui cursor-pointer transition-all duration-100",
          "disabled:opacity-50 disabled:pointer-events-none",
          
          // Variants
          variant === "default" && "border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-sm)] shadow-[3px_3px_0px_var(--color-shadow-main)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_var(--color-shadow-main)] data-[style=modern]:shadow-[0_2px_8px_rgba(0,0,0,0.05)] data-[style=modern]:active:scale-95 data-[style=modern]:active:shadow-none",
          
          variant === "primary" && "border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-sm)] shadow-[3px_3px_0px_var(--color-shadow-main)] bg-[var(--color-accent)] text-[var(--color-btn-text)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_var(--color-shadow-main)] data-[style=modern]:shadow-[0_2px_8px_rgba(0,0,0,0.05)] data-[style=modern]:active:scale-95 data-[style=modern]:active:shadow-none",
          
          variant === "nav" && "bg-transparent border-none text-[var(--color-text-muted)] hover:bg-[var(--color-bg-nav)] hover:text-[var(--color-text-main)] rounded-full",
          
          // Sizes
          size === "default" && "h-10 px-4 py-2 gap-2",
          size === "sm" && "h-9 px-3 gap-1.5 text-sm",
          size === "lg" && "h-12 px-8 gap-2 text-lg",
          size === "icon" && "h-10 w-10",
          
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
