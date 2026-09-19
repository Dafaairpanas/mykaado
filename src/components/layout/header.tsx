"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { db } from "@/lib/db";

import { RotateCcw, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "minna";
  const isSetupPage = pathname === "/flashcard/setup";

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
      if (typeof setIsDark === 'function') setIsDark(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-style', 'modern');
      document.documentElement.setAttribute('data-color', 'crimson');
      document.documentElement.classList.add('dark');
      
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('style', 'modern');
      localStorage.setItem('color', 'crimson');
      if (typeof setIsDark === 'function') setIsDark(true);
    }
  };
  return (
    <header className="hidden md:block sticky top-0 z-50 bg-[var(--color-bg-main)] border-b-[var(--bw-sm)] border-[var(--color-border-main)] transition-colors duration-300">
      <div className="w-full max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-8">
          <Link href="/" className="font-extrabold text-xl tracking-tight flex items-center gap-2 cursor-pointer group">
            <Logo className="w-8 h-8 text-[var(--color-accent)] transition-transform group-hover:scale-110" />
            MyKaado
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isSetupPage && (
            <div className="hidden md:flex bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] p-1 shadow-[2px_2px_0px_var(--color-shadow-main)]">
              {(["minna", "irodori", "n3", "kanji"] as const).map(tab => (
                <Link
                  key={tab}
                  href={`?filter=${tab}`}
                  className={`px-4 py-1.5 rounded-[var(--radius-sm)] font-bold text-sm transition-colors ${
                    filter === tab 
                      ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)]" 
                      : "hover:bg-[var(--color-bg-nav)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {tab === "kanji" ? "Kanji" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Link>
              ))}
            </div>
          )}
          {isSetupPage && (
            <button 
              onClick={async () => {
                if (window.confirm("Yakin ingin menghapus semua progress hafalan (Reset Data)?")) {
                  await db.progress.clear();
                  await db.history.clear();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)] transition-colors text-red-500 font-bold text-sm" 
              title="Reset Data"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Data</span>
            </button>
          )}
          {mounted && (
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)] transition-colors" 
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
