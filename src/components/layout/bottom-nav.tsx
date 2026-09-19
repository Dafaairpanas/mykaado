"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Layers, Type, List, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isCurrentlyDark) {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-style', 'neobrutalism');
      document.documentElement.setAttribute('data-color', 'matcha');
      document.documentElement.classList.remove('dark');
      
      localStorage.setItem('theme', 'light');
      localStorage.setItem('style', 'neobrutalism');
      localStorage.setItem('color', 'matcha');
      setIsDark(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-style', 'modern');
      document.documentElement.setAttribute('data-color', 'crimson');
      document.documentElement.classList.add('dark');
      
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('style', 'modern');
      localStorage.setItem('color', 'crimson');
      setIsDark(true);
    }
  };

  const navLinks = [
    { href: "/", label: "Home", icon: LayoutGrid },
    { href: "/flashcard", label: "Flashcard", icon: Layers },
    { href: "/kanji", label: "Kanji", icon: Type },
    { href: "/kotoba", label: "Kotoba", icon: List },
  ];

  return (
    <nav className="md:hidden absolute bottom-0 left-0 right-0 flex justify-around px-2 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[var(--color-bg-nav)] border-t-[var(--bw-sm)] border-[var(--color-border-main)] z-50 transition-colors duration-300">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        const Icon = link.icon;
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center gap-1 text-[0.7rem] font-semibold flex-1 py-2 rounded-[var(--radius-sm)] transition-all duration-200",
              isActive ? "text-[var(--color-text-main)]" : "text-[var(--color-text-muted)]"
            )}
          >
            <div className={cn(
              "p-[0.4rem] rounded-full flex items-center justify-center transition-all duration-200",
              isActive 
                ? "bg-[var(--color-accent)] border-[var(--bw-sm)] border-[var(--color-border-main)] text-[var(--color-btn-text)] shadow-[2px_2px_0px_var(--color-border-main)] -translate-y-1 data-[style=modern]:shadow-none data-[style=modern]:-translate-y-0.5" 
                : ""
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <span>{link.label}</span>
          </Link>
        );
      })}
      
      {mounted && (
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 text-[0.7rem] font-semibold flex-1 py-2 rounded-[var(--radius-sm)] transition-all duration-200 text-[var(--color-text-muted)]"
        >
          <div className="p-[0.4rem] rounded-full flex items-center justify-center transition-all duration-200">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </div>
          <span>Tema</span>
        </button>
      )}
    </nav>
  );
}
