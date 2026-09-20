"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { KOTOBA_SOURCES, fetchSelectedDecks, type DeckSource } from "@/lib/data-loader";
import type { KotobaItem } from "@/types";

export default function KotobaPage() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("minna");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Data State
  const [chapterData, setChapterData] = useState<KotobaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Display Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showKanji, setShowKanji] = useState(true);
  const [showKana, setShowKana] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);

  // Derive sources for the active tab (e.g. merging Irodori A1, A2-1, A2-2)
  const getActiveSources = (): DeckSource[] => {
    if (activeTab === "irodori") return KOTOBA_SOURCES.filter(s => s.id.startsWith("irodori_"));
    return KOTOBA_SOURCES.filter(s => s.id === activeTab);
  };
  const activeSources = getActiveSources();

  // Load detailed chapter data when a chapter is selected
  useEffect(() => {
    if (!selectedChapterId) {
      setChapterData([]);
      return;
    }
    
    async function loadChapter() {
      setIsLoading(true);
      try {
        const items = await fetchSelectedDecks([selectedChapterId!]);
        setChapterData(items as KotobaItem[] || []);
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    }
    loadChapter();
  }, [selectedChapterId]);

  // Find the label for the currently selected chapter
  const currentChapterInfo = useMemo(() => {
    if (!selectedChapterId) return null;
    for (const source of KOTOBA_SOURCES) {
      const ch = source.chapters.find(c => c.id === selectedChapterId);
      if (ch) return { title: source.title, label: ch.label };
    }
    return null;
  }, [selectedChapterId]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return chapterData;
    const q = searchQuery.toLowerCase();
    return chapterData.filter(item => 
      (item.kanji && item.kanji.toLowerCase().includes(q)) ||
      (item.kana && item.kana.toLowerCase().includes(q)) ||
      (item.romaji && item.romaji.toLowerCase().includes(q)) ||
      (item.meaning && item.meaning.toLowerCase().includes(q))
    );
  }, [chapterData, searchQuery]);

  // View: LIST OF CHAPTERS
  if (!selectedChapterId) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 pb-20 pt-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">List Kotoba</h1>
            <p className="text-[var(--color-text-muted)] font-medium">Pilih bab untuk melihat daftar kosakata</p>
          </div>
          
          <div className="flex gap-2 bg-[var(--color-bg-nav)] p-1.5 rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] self-start md:self-auto overflow-x-auto max-w-full hide-scrollbar">
            <button
              onClick={() => setActiveTab("minna")}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${activeTab === "minna" ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)]"}`}
            >
              Minna
            </button>
            <button
              onClick={() => setActiveTab("irodori")}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${activeTab === "irodori" ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)]"}`}
            >
              Irodori
            </button>
            <button
              onClick={() => setActiveTab("n3")}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${activeTab === "n3" ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)]"}`}
            >
              Sou N3
            </button>
          </div>
        </div>
        
        {/* Chapters Grid */}
        <div className="flex flex-col gap-10">
          {activeSources.map(source => (
            <div key={source.id}>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-1.5 h-6 bg-[var(--color-text-main)] rounded-full"></div>
                <h2 className="text-xl font-extrabold">{source.title}</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 gap-3">
                {source.chapters.map(chapter => (
                  <button
                    key={chapter.id}
                    onClick={() => { setSelectedChapterId(chapter.id); setSearchQuery(""); }}
                    className="py-3 px-2 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] text-center font-bold text-sm hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_var(--color-shadow-main)] transition-all"
                  >
                    {chapter.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View: CHAPTER DETAIL
  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-20 pt-4">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button variant="default" size="sm" onClick={() => setSelectedChapterId(null)} className="h-10 shrink-0">
            <ChevronLeft className="w-5 h-5 mr-1" /> Pilih Bab
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold uppercase line-clamp-1">{currentChapterInfo?.title} {currentChapterInfo?.label}</h1>
            <span className="px-3 py-1 bg-[var(--color-bg-nav)] text-[var(--color-text-muted)] rounded-full text-xs font-bold border-[1px] border-solid border-[var(--color-border-main)] shrink-0">
              {chapterData.length} kata
            </span>
          </div>
        </div>
        
        {/* Dropdown to switch chapter in the same source */}
        <div className="flex items-center w-full md:w-auto shrink-0">
           <select 
             className="w-full md:w-auto px-4 py-2.5 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] font-bold text-sm outline-none cursor-pointer focus:shadow-[2px_2px_0px_var(--color-shadow-main)]"
             value={selectedChapterId}
             onChange={(e) => setSelectedChapterId(e.target.value)}
           >
             {KOTOBA_SOURCES.map(source => (
                <optgroup key={source.id} label={source.title}>
                  {source.chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.label}</option>
                  ))}
                </optgroup>
             ))}
           </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
        <input 
          type="text" 
          placeholder="Cari kana, kanji, atau arti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-[var(--radius-md)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] font-medium outline-none focus:shadow-[4px_4px_0px_var(--color-shadow-main)] transition-shadow"
        />
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius-md)] border-[length:var(--bw-md)] border-solid border-[var(--color-border-main)] overflow-hidden bg-[var(--color-bg-card)]">
        {/* Table Header */}
        <div className="grid grid-cols-3 bg-[var(--color-bg-nav)] border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] divide-x-[length:var(--bw-sm)] divide-solid divide-[var(--color-border-main)] font-bold text-sm">
          <div className="p-4 flex items-center gap-2">日本語 <span className="text-[var(--color-text-muted)] font-medium text-xs hidden md:inline">Kana</span></div>
          <div className="p-4 flex items-center gap-2">漢字 <span className="text-[var(--color-text-muted)] font-medium text-xs hidden md:inline">Kanji</span></div>
          <div className="p-4 flex items-center gap-2">インドネシア語 <span className="text-[var(--color-text-muted)] font-medium text-xs hidden md:inline">Arti</span></div>
        </div>
        
        {/* Table Body */}
        {isLoading ? (
          <div className="p-12 text-center font-bold animate-pulse">Memuat data...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center font-bold text-[var(--color-text-muted)]">Tidak ada kata yang cocok dengan "{searchQuery}"</div>
        ) : (
          <div className="divide-y-[1px] divide-dashed divide-[var(--color-border-main)]">
            {filteredData.map((item, idx) => (
              <div key={idx} className="grid grid-cols-3 divide-x-[1px] divide-dashed divide-[var(--color-border-main)] hover:bg-[var(--color-bg-nav)] transition-colors group">
                <div className={`p-4 jp-text text-lg font-normal text-[var(--color-text-main)] transition-all ${!showKana && "blur-sm opacity-30 select-none group-hover:blur-none group-hover:opacity-100"}`}>
                  {item.kana}
                </div>
                <div className={`p-4 jp-text text-lg font-normal text-[var(--color-text-main)] transition-all ${!showKanji && "blur-sm opacity-30 select-none group-hover:blur-none group-hover:opacity-100"}`}>
                  {item.kanji || "-"}
                </div>
                <div className={`p-4 text-sm font-semibold transition-all flex items-center ${!showMeaning && "blur-sm opacity-30 select-none group-hover:blur-none group-hover:opacity-100"}`}>
                  {item.meaning}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Settings */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-[var(--color-accent)] text-[var(--color-bg-main)] rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center justify-center shadow-[4px_4px_0px_var(--color-shadow-main)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_var(--color-shadow-main)] transition-all z-50"
      >
        <Eye className="w-6 h-6 text-[#111]" />
      </button>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Pengaturan Tampilan">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-text-muted)] font-medium mb-2">Sembunyikan salah satu kolom untuk melatih ingatan Anda. Arahkan kursor atau ketuk baris untuk mengintip kembali tulisan yang diburamkan.</p>
          <div className="flex items-center justify-between p-3 border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-sm)] bg-[var(--color-bg-nav)]">
            <span className="font-bold">Tampilkan Kana</span>
            <Toggle pressed={showKana} onPressedChange={setShowKana} className="py-1 h-auto text-sm">Kana</Toggle>
          </div>
          <div className="flex items-center justify-between p-3 border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-sm)] bg-[var(--color-bg-nav)]">
            <span className="font-bold">Tampilkan Kanji</span>
            <Toggle pressed={showKanji} onPressedChange={setShowKanji} className="py-1 h-auto text-sm">Kanji</Toggle>
          </div>
          <div className="flex items-center justify-between p-3 border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-sm)] bg-[var(--color-bg-nav)]">
            <span className="font-bold">Tampilkan Arti</span>
            <Toggle pressed={showMeaning} onPressedChange={setShowMeaning} className="py-1 h-auto text-sm">Arti</Toggle>
          </div>
        </div>
      </Modal>

    </div>
  );
}
