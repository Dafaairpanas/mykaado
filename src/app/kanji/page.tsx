"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { KANJI_SOURCES, fetchSelectedDecks } from "@/lib/data-loader";
import type { KanjiItem } from "@/types";

export default function KanjiPage() {
  const [selectedLevel, setSelectedLevel] = useState("kj_n5");
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [selectedKanji, setSelectedKanji] = useState<KanjiItem | null>(null);

  useEffect(() => {
    async function loadKanji() {
      setIsLoading(true);
      const data = await fetchSelectedDecks([selectedLevel]);
      setKanjiList(data as KanjiItem[]);
      setIsLoading(false);
    }
    loadKanji();
  }, [selectedLevel]);

  const levels = KANJI_SOURCES[0].chapters;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold mb-2">Kamus Kanji</h1>
        <p className="text-[var(--color-text-muted)]">Pilih level untuk melihat daftar kanji beserta detailnya.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {levels.map(level => (
          <Button
            key={level.id}
            variant={selectedLevel === level.id ? "primary" : "default"}
            onClick={() => setSelectedLevel(level.id)}
            className="transition-transform hover:-translate-y-1 hover:shadow-[2px_2px_0px_var(--color-shadow-main)] active:translate-y-0 active:shadow-none"
          >
            {level.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center font-semibold animate-pulse">Memuat Kanji...</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3">
          {kanjiList.map((kj, idx) => (
            <Card 
              key={idx}
              className="group aspect-square flex items-center justify-center cursor-pointer hover:bg-[var(--color-accent)] hover:text-[var(--color-btn-text)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[4px_4px_0px_var(--color-shadow-main)] active:translate-y-0 active:shadow-none animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx * 30, 600)}ms` }}
              onClick={() => setSelectedKanji(kj)}
            >
              <span className="text-3xl jp-text font-normal transition-transform duration-300 group-hover:scale-110">{kj.kanji}</span>
            </Card>
          ))}
        </div>
      )}

      {/* Kanji Detail Modal */}
      <Modal 
        isOpen={!!selectedKanji} 
        onClose={() => setSelectedKanji(null)}
        title={`Detail Kanji: ${selectedKanji?.level}`}
      >
        {selectedKanji && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="w-32 h-32 flex items-center justify-center border-[var(--bw-sm)] border-[var(--color-border-main)] rounded-[var(--radius-md)] mb-6 bg-[var(--color-bg-nav)] shadow-[4px_4px_0px_var(--color-shadow-main)] transition-transform hover:scale-105">
              <span className="text-7xl jp-text font-normal">{selectedKanji.kanji}</span>
            </div>
            
            <div className="w-full space-y-4">
              <div className="bg-[var(--color-bg-card)] p-3 rounded-[var(--radius-sm)] border-[var(--bw-sm)] border-[var(--color-border-main)] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Onyomi</h4>
                <p className="text-lg jp-text font-medium">{selectedKanji.onyomi || "-"}</p>
              </div>
              
              <div className="bg-[var(--color-bg-card)] p-3 rounded-[var(--radius-sm)] border-[var(--bw-sm)] border-[var(--color-border-main)] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Kunyomi</h4>
                <p className="text-lg jp-text font-medium">{selectedKanji.kunyomi || "-"}</p>
              </div>
              
              <div className="bg-[var(--color-bg-card)] p-3 rounded-[var(--radius-sm)] border-[var(--bw-sm)] border-[var(--color-border-main)] animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Arti</h4>
                <p className="text-xl font-bold text-[var(--color-accent)] drop-shadow-sm">{selectedKanji.meaning}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
