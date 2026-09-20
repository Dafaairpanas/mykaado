"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

const COLORS = [
  { id: "matcha", label: "Matcha", hex: "#C0D684" },
  { id: "lime", label: "Lime", hex: "#A0D468" },
  { id: "green", label: "Green", hex: "#89D99D" },
  { id: "teal", label: "Teal", hex: "#38B2AC" },
  { id: "cyan", label: "Cyan", hex: "#0BC5EA" },
  { id: "blue", label: "Blue", hex: "#7BB4F0" },
  { id: "indigo", label: "Indigo", hex: "#667EEA" },
  { id: "purple", label: "Purple", hex: "#C4B5FD" },
  { id: "violet", label: "Violet", hex: "#B794F4" },
  { id: "pink", label: "Pink", hex: "#F9A8D4" },
  { id: "sakura", label: "Sakura", hex: "#FFB7B2" },
  { id: "rose", label: "Rose", hex: "#F56565" },
  { id: "crimson", label: "Crimson", hex: "#FF5A5F" },
  { id: "orange", label: "Orange", hex: "#F0A07B" },
  { id: "amber", label: "Amber", hex: "#F6AD55" },
  { id: "yellow", label: "Yellow", hex: "#FFD54F" }
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

  const handleClearProgress = async () => {
    if (window.confirm("PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA progress belajar flashcard? Anda akan mengulang semua kartu dari awal. Aksi ini tidak dapat dibatalkan!")) {
      try {
        await db.progress.clear();
        await db.history.clear();
        alert("Semua progress berhasil dihapus!");
      } catch (error) {
        console.error(error);
        alert("Gagal menghapus progress.");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Pengaturan</h1>
        <p className="text-[var(--color-text-muted)]">Sesuaikan tampilan MyKaado sesuai selera Anda.</p>
      </div>

      <div className="space-y-10">
        {/* Color Mode */}
        <section className="pb-8 border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)]">
          <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Mode Warna</h2>
          <div className="flex gap-3">
            <Button 
              variant={theme === "light" ? "primary" : "default"} 
              className="flex-1 max-w-[200px]"
              onClick={() => changeTheme("light")}
            >
              Terang (Light)
            </Button>
            <Button 
              variant={theme === "dark" ? "primary" : "default"} 
              className="flex-1 max-w-[200px]"
              onClick={() => changeTheme("dark")}
            >
              Gelap (Dark)
            </Button>
          </div>
        </section>

        {/* UI Style */}
        <section className="pb-8 border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)]">
          <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Gaya Desain</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant={style === "neobrutalism" ? "primary" : "default"} 
              className="flex-1 max-w-[200px]"
              onClick={() => changeStyle("neobrutalism")}
            >
              Neobrutalism
            </Button>
            <Button 
              variant={style === "modern" ? "primary" : "default"} 
              className="flex-1 max-w-[200px]"
              onClick={() => changeStyle("modern")}
            >
              Modern Sleek
            </Button>
          </div>
        </section>

        {/* Accent Color */}
        <section className="pb-8 border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)]">
          <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Warna Aksen</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => changeColor(c.id)}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-transform hover:scale-105 ${color === c.id ? 'bg-[var(--color-bg-nav)] border-[var(--bw-sm)] border-solid border-[var(--color-border-main)]' : 'border border-transparent'}`}
              >
                <div className="w-8 h-8 rounded-full border-[var(--bw-sm)] border-solid border-[var(--color-border-main)]" style={{ backgroundColor: c.hex }} />
                <span className="text-[10px] font-bold uppercase">{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">Zona Bahaya</h2>
          <p className="text-[var(--color-text-muted)] mb-4 text-sm max-w-xl">Menghapus data akan menghilangkan semua rekam jejak hafalan (riwayat kapan kartu direview, kartu yang sudah dikuasai, dll) secara permanen dari perangkat ini.</p>
          <Button variant="danger" className="w-full sm:w-auto bg-red-500 text-white hover:bg-red-600 border-red-700 font-bold px-6" onClick={handleClearProgress}>
            Hapus Semua Progress
          </Button>
        </section>
      </div>
    </div>
  );
}
