"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function Accordion({ title, children, className, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-bg-card)]", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 font-semibold text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)] transition-colors text-left"
      >
        {title}
        <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 border-t-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] border-dashed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
