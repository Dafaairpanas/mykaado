"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative w-full bg-[var(--color-bg-main)] border-[length:var(--bw-md)] border-solid border-[var(--color-border-main)]",
        "rounded-[var(--radius-lg)] shadow-[6px_6px_0px_var(--color-shadow-main)] overflow-hidden",
        "data-[style=modern]:shadow-[0_20px_40px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200",
        className || "max-w-md"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] border-dashed">
          <h2 className="font-bold text-lg">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--color-bg-nav)] transition-colors"
          >
            <X className="w-6 h-6 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
