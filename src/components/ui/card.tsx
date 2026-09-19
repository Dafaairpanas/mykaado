import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-md)]",
        "shadow-[4px_4px_0px_var(--color-shadow-main)] bg-[var(--color-bg-card)]",
        "transition-[transform,box-shadow,background-color,border-color] duration-300",
        "data-[style=modern]:shadow-[0_8px_24px_rgba(0,0,0,0.05)]",
        "dark:data-[style=modern]:shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
