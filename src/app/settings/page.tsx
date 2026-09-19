"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const COLORS = [
  { id: "matcha", label: "Matcha", hex: "#C0D684" },
  { id: "crimson", label: "Crimson", hex: "#FF5A5F" },
  { id: "orange", label: "Orange", hex: "#F0A07B" },
  { id: "blue", label: "Blue", hex: "#7BB4F0" },
  { id: "green", label: "Green", hex: "#89D99D" },
  { id: "yellow", label: "Yellow", hex: "#FFD54F" },
  { id: "purple", label: "Purple", hex: "#C4B5FD" },
  { id: "pink", label: "Pink", hex: "#F9A8D4" }
];

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [style, setStyle] = useState("modern");
  const [color, setColor] = useState("matcha");

  useEffect(() => {
    // Load initial from html element attributes
    setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    setStyle(document.documentElement.getAttribute("data-style") || "modern");
    setColor(document.documentElement.getAttribute("data-color") || "matcha");
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const changeStyle = (newStyle: string) => {
    setStyle(newStyle);
    localStorage.setItem("style", newStyle);
    document.documentElement.setAttribute("data-style", newStyle);
  };

  const changeColor = (newColor: string) => {
    setColor(newColor);
    localStorage.setItem("color", newColor);
    document.documentElement.setAttribute("data-color", newColor);
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Pengaturan</h1>
        <p className="text-[var(--color-text-muted)]">Sesuaikan tampilan MyKaado sesuai selera Anda.</p>
      </div>

      <div className="space-y-6">
        {/* Color Mode */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Mode Warna</h2>
          <div className="flex gap-4">
            <Button 
              variant={theme === "light" ? "primary" : "default"} 
              className="flex-1"
              onClick={() => changeTheme("light")}
            >
              Terang (Light)
            </Button>
            <Button 
              variant={theme === "dark" ? "primary" : "default"} 
              className="flex-1"
              onClick={() => changeTheme("dark")}
            >
              Gelap (Dark)
            </Button>
          </div>
        </Card>

        {/* UI Style */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Gaya Desain</h2>
          <div className="flex gap-4">
            <Button 
              variant={style === "neobrutalism" ? "primary" : "default"} 
              className="flex-1"
              onClick={() => changeStyle("neobrutalism")}
            >
              Neobrutalism
            </Button>
            <Button 
              variant={style === "modern" ? "primary" : "default"} 
              className="flex-1"
              onClick={() => changeStyle("modern")}
            >
              Modern Sleek
            </Button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3 text-center">
            Neobrutalism memiliki garis tepi dan bayangan yang tegas. Modern Sleek lebih halus dan elegan.
          </p>
        </Card>

        {/* Accent Color */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Warna Aksen</h2>
          <div className="grid grid-cols-4 gap-3">
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => changeColor(c.id)}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-transform hover:scale-105 ${color === c.id ? 'bg-[var(--color-bg-nav)] border-[var(--bw-sm)] border-[var(--color-border-main)]' : ''}`}
              >
                <div className="w-8 h-8 rounded-full border-[var(--bw-sm)] border-[var(--color-border-main)]" style={{ backgroundColor: c.hex }} />
                <span className="text-xs font-semibold">{c.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-500/50">
          <h2 className="text-lg font-bold mb-4 text-red-500">Zona Bahaya</h2>
          <p className="text-[var(--color-text-muted)] mb-4 text-sm">Menghapus data akan menghilangkan semua progress FSRS Anda secara permanen dari perangkat ini.</p>
          <Button variant="danger" className="w-full bg-red-500 text-white hover:bg-red-600 border-red-700">
            Hapus Semua Progress
          </Button>
        </Card>
      </div>
    </div>
  );
}
