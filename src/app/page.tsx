"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const menuItems = [
    {
      title: "Flashcard",
      jpTitle: "日本語",
      href: "/flashcard/setup",
    },
    {
      title: "Kanji Tunggal",
      jpTitle: "漢字",
      href: "/kanji",
    },
    {
      title: "List Kotoba",
      jpTitle: "言葉",
      href: "/kotoba",
    },
    {
      title: "Bunpou",
      jpTitle: "文法",
      href: "/bunpou",
    },
    {
      title: "Renshuu",
      jpTitle: "練習",
      href: "/renshuu",
    },
    {
      title: "Settings",
      jpTitle: "設定",
      href: "/settings",
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 mt-8">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold mb-2">Pilih menu untuk mulai belajar</h1>
        <p className="text-[var(--color-text-muted)] text-sm">Akses semua materi dari dashboard ini.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {menuItems.map((item, idx) => {
          return (
            <Link key={idx} href={item.href}>
              <Card 
                className="aspect-video md:aspect-square p-4 hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-shadow-main)] transition-all cursor-pointer group flex flex-col items-center justify-center text-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="text-3xl md:text-4xl jp-text font-normal transition-transform duration-300 group-hover:scale-110 text-[var(--color-text-main)] group-hover:text-[var(--color-accent)]">
                  {item.jpTitle}
                </div>
                <h2 className="text-sm md:text-base font-bold">{item.title}</h2>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

