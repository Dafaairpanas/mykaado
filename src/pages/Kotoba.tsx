import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, Eye, Bookmark, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { KOTOBA_SOURCES, fetchSelectedDecks, type DeckSource } from "@/lib/data-loader";
import type { KotobaItem } from "@/types";

export default function KotobaPage() {
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("minna");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Data State
  const [chapterData, setChapterData] = useState<KotobaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection / Marking State
  const [filterMode, setFilterMode] = useState<"all" | "marked">("all");
  const [markedItems, setMarkedItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("mykaado_marked_kotoba");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

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

  // Helper to toggle marked state
  const toggleMark = (id: string) => {
    setMarkedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("mykaado_marked_kotoba", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleRowClick = (itemId: string) => {
    // If user is selecting/highlighting text with mouse, don't trigger toggle
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    toggleMark(itemId);
  };

  const handleClearChapterMarks = () => {
    if (!window.confirm("Hapus semua tanda sulit di bab ini?")) return;
    setMarkedItems(prev => {
      const next = new Set(prev);
      chapterData.forEach((item, idx) => {
        const id = item.id || `${item.kana}-${item.meaning}-${idx}`;
        next.delete(id);
      });
      localStorage.setItem("mykaado_marked_kotoba", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handlePracticeMarked = () => {
    const markedInChapter = chapterData
      .filter((item, idx) => {
        const id = item.id || `${item.kana}-${item.meaning}-${idx}`;
        return markedItems.has(id);
      })
      .map((item, idx) => item.id || `${item.kana}-${item.meaning}-${idx}`);

    if (markedInChapter.length === 0) return;

    // Ensure flashcard config exists so /flashcard won't redirect to setup
    const existingConfig = localStorage.getItem("mykaado_flashcard_config");
    if (!existingConfig) {
      localStorage.setItem(
        "mykaado_flashcard_config",
        JSON.stringify({
          selectedDecks: [selectedChapterId],
          grades: [1, 2, 3],
          levels: ["ALL"],
          studyMode: "Standard",
          hideLabel: false,
        })
      );
    }
    localStorage.setItem("mykaado_custom_cards", JSON.stringify(markedInChapter));
    navigate("/flashcard");
  };

  // Count marked items in the current chapter
  const chapterMarkedCount = useMemo(() => {
    return chapterData.filter((item, idx) => {
      const id = item.id || `${item.kana}-${item.meaning}-${idx}`;
      return markedItems.has(id);
    }).length;
  }, [chapterData, markedItems]);

  const filteredData = useMemo(() => {
    let list = chapterData;
    if (filterMode === "marked") {
      list = list.filter((item, idx) => {
        const id = item.id || `${item.kana}-${item.meaning}-${idx}`;
        return markedItems.has(id);
      });
    }
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      (item.kanji && item.kanji.toLowerCase().includes(q)) ||
      (item.kana && item.kana.toLowerCase().includes(q)) ||
      (item.romaji && item.romaji.toLowerCase().includes(q)) ||
      (item.meaning && item.meaning.toLowerCase().includes(q))
    );
  }, [chapterData, searchQuery, filterMode, markedItems]);

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
                    onClick={() => { setSelectedChapterId(chapter.id); setSearchQuery(""); setFilterMode("all"); }}
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
          <Button variant="default" size="sm" onClick={() => { setSelectedChapterId(null); setFilterMode("all"); }} className="h-10 shrink-0">
            <ChevronLeft className="w-5 h-5 mr-1" /> Pilih Bab
          </Button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-extrabold uppercase line-clamp-1">{currentChapterInfo?.title} {currentChapterInfo?.label}</h1>
            <span className="px-3 py-1 bg-[var(--color-bg-nav)] text-[var(--color-text-muted)] rounded-full text-xs font-bold border-[1px] border-solid border-[var(--color-border-main)] shrink-0">
              {chapterData.length} kata
            </span>
            {chapterMarkedCount > 0 && (
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-500/30 shrink-0 flex items-center gap-1.5 animate-fade-in-up">
                <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{chapterMarkedCount} ditandai</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Dropdown to switch chapter in the same source */}
        <div className="flex items-center w-full md:w-auto shrink-0">
           <select 
             className="w-full md:w-auto px-4 py-2.5 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] font-bold text-sm outline-none cursor-pointer focus:shadow-[2px_2px_0px_var(--color-shadow-main)]"
             value={selectedChapterId}
             onChange={(e) => {
               setSelectedChapterId(e.target.value);
               setSearchQuery("");
               setFilterMode("all");
             }}
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
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
        <input 
          type="text" 
          placeholder="Cari kana, kanji, atau arti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-[var(--radius-md)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] font-medium outline-none focus:shadow-[4px_4px_0px_var(--color-shadow-main)] transition-shadow"
        />
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-[var(--color-bg-card)] p-2.5 md:p-3 rounded-[var(--radius-md)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs md:text-sm transition-all ${
              filterMode === "all"
                ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[1px_1px_0px_var(--color-shadow-main)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)]"
            }`}
          >
            Semua ({chapterData.length})
          </button>
          <button
            onClick={() => setFilterMode("marked")}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 ${
              filterMode === "marked"
                ? "bg-amber-500 text-white shadow-[1px_1px_0px_var(--color-shadow-main)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)]"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${filterMode === "marked" ? "fill-white" : ""}`} />
            Ditandai ({chapterMarkedCount})
          </button>
        </div>

        {/* Action Buttons & Hint */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {chapterMarkedCount > 0 ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePracticeMarked}
                className="h-9 px-3 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_var(--color-shadow-main)]"
                title="Latih kosakata yang ditandai langsung di flashcard"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Flashcard ({chapterMarkedCount})</span>
              </Button>
              <button
                onClick={handleClearChapterMarks}
                className="text-xs text-[var(--color-text-muted)] hover:text-red-500 font-bold px-2 py-1.5 rounded hover:bg-[var(--color-bg-nav)] transition-colors"
                title="Hapus semua penanda di bab ini"
              >
                Reset Tanda
              </button>
            </>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)] font-medium hidden sm:inline">
              💡 Ketuk baris kata untuk menandai kosakata sulit
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius-md)] border-[length:var(--bw-md)] border-solid border-[var(--color-border-main)] overflow-hidden bg-[var(--color-bg-card)] shadow-[4px_4px_0px_var(--color-shadow-main)]">
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
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            {filterMode === "marked" ? (
              <>
                <Bookmark className="w-10 h-10 text-[var(--color-text-muted)] opacity-30 stroke-[1.5]" />
                <p className="font-bold text-base text-[var(--color-text-main)]">Belum ada kosakata yang ditandai</p>
                <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                  Ketuk baris kosakata atau ikon penanda di kolom Kana untuk menandai kata-kata yang sulit dihafal.
                </p>
                <button 
                  onClick={() => setFilterMode("all")}
                  className="mt-2 text-xs font-bold text-[var(--color-text-main)] underline hover:opacity-80"
                >
                  Tampilkan Semua Kata
                </button>
              </>
            ) : (
              <div className="font-bold text-[var(--color-text-muted)]">
                Tidak ada kata yang cocok dengan "{searchQuery}"
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y-[1px] divide-dashed divide-[var(--color-border-main)]">
            {filteredData.map((item, idx) => {
              const itemId = item.id || `${item.kana}-${item.meaning}-${idx}`;
              const isMarked = markedItems.has(itemId);

              return (
                <div 
                  key={itemId} 
                  onClick={() => handleRowClick(itemId)}
                  className={`grid grid-cols-3 divide-x-[1px] divide-dashed divide-[var(--color-border-main)] transition-colors cursor-pointer group select-none md:select-text border-l-4 ${
                    isMarked 
                      ? "bg-amber-100/45 dark:bg-amber-500/15 hover:bg-amber-100/65 dark:hover:bg-amber-500/25 border-l-amber-500" 
                      : "border-l-transparent hover:bg-[var(--color-bg-nav)]"
                  }`}
                  title={isMarked ? "Klik untuk membatalkan tanda sulit" : "Klik untuk menandai sebagai kata sulit"}
                >
                  <div className="p-4 flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMark(itemId);
                      }}
                      title={isMarked ? "Hapus tanda sulit" : "Tandai kata sulit"}
                      className={`p-1 -ml-1 mt-0.5 rounded transition-all shrink-0 ${
                        isMarked 
                          ? "text-amber-500 scale-110" 
                          : "text-[var(--color-text-muted)] opacity-25 group-hover:opacity-80 hover:text-amber-500 hover:opacity-100"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 transition-all ${isMarked ? "fill-amber-500 text-amber-500" : ""}`} />
                    </button>
                    <span className={`jp-text text-lg font-normal text-[var(--color-text-main)] transition-all leading-snug ${!showKana && "blur-sm opacity-30 select-none group-hover:blur-none group-hover:opacity-100"}`}>
                      {item.kana}
                    </span>
                  </div>
                  <div className={`p-4 jp-text text-lg font-normal text-[var(--color-text-main)] transition-all flex items-center leading-snug ${!showKanji && "blur-sm opacity-30 select-none group-hover:blur-none group-hover:opacity-100"}`}>
                    {item.kanji || "-"}
                  </div>
                  <div className={`p-4 text-sm font-semibold transition-all flex items-center leading-relaxed ${!showMeaning && "blur-sm opacity-30 select-none group-hover:blur-none group-hover:opacity-100"}`}>
                    {item.meaning}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button for Settings */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-[var(--color-accent)] text-[var(--color-bg-main)] rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center justify-center shadow-[4px_4px_0px_var(--color-shadow-main)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_var(--color-shadow-main)] transition-all z-50"
        title="Pengaturan Tampilan & Hafalan"
      >
        <Eye className="w-6 h-6 text-[#111]" />
      </button>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Pengaturan Tampilan & Hafalan">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-text-muted)] font-medium mb-2">
            Sembunyikan salah satu kolom untuk melatih ingatan Anda. Arahkan kursor atau ketuk baris untuk mengintip kembali tulisan yang diburamkan.
          </p>
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

          <div className="pt-2 border-t border-dashed border-[var(--color-border-main)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">Penanda Kosakata Sulit</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Total ditandai di bab ini: {chapterMarkedCount} kata</p>
              </div>
              {chapterMarkedCount > 0 && (
                <button
                  onClick={handleClearChapterMarks}
                  className="text-xs text-red-500 hover:underline font-bold"
                >
                  Reset Penanda
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}

