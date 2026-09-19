"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Play, Volume2, RotateCcw, Settings } from "lucide-react";
import { KOTOBA_SOURCES, KANJI_SOURCES, type DeckSource } from "@/lib/data-loader";
import { db } from "@/lib/db";
import { Modal } from "@/components/ui/modal";

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh] font-bold">Memuat...</div>}>
      <SetupPageContent />
    </Suspense>
  );
}

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("filter") as "minna" | "irodori" | "n3" | "kanji" || "minna";

  // State
  const [selectedGrades, setSelectedGrades] = useState<number[]>([1]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["ALL"]);
  const [studyMode, setStudyMode] = useState<string>("Standard");
  const [hideLabel, setHideLabel] = useState<boolean>(false);
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, learning: 0 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Drag to select state
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<"select" | "deselect">("select");
  const [draggedSet, setDraggedSet] = useState<Set<string>>(new Set());

  // Helpers
  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<any[]>>, item: any) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleLevel = (level: string) => {
    if (level === "ALL") {
      setSelectedLevels(["ALL"]);
    } else {
      setSelectedLevels(prev => {
        const withoutAll = prev.filter(l => l !== "ALL");
        if (withoutAll.includes(level)) {
          const next = withoutAll.filter(l => l !== level);
          return next.length === 0 ? ["ALL"] : next;
        } else {
          return [...withoutAll, level];
        }
      });
    }
  };

  const getActiveSources = (): DeckSource[] => {
    if (activeTab === "kanji") return KANJI_SOURCES.filter(s => s.id === "kanji_level");
    if (activeTab === "irodori") return KOTOBA_SOURCES.filter(s => s.id.startsWith("irodori_"));
    return KOTOBA_SOURCES.filter(s => s.id === activeTab);
  };

  const activeSources = getActiveSources();

  // Helper: detect if a string contains actual kanji characters
  const hasKanji = (str: string) => /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(str);

  // Load stats dynamically when selectedDecks change
  useEffect(() => {
    async function loadStats() {
      if (selectedDecks.length === 0 || activeSources.length === 0) {
        setStats({ total: 0, learning: 0 });
        return;
      }
      
      let allCards: any[] = [];
      
      for (const source of activeSources) {
        const selectedChapters = source.chapters.filter(c => selectedDecks.includes(c.id));
        for (const ch of selectedChapters) {
          try {
            const mod = await ch.file();
            allCards = [...allCards, ...(mod.default || mod)];
          } catch(e) {
            console.error("Failed to load chapter", ch.id, e);
          }
        }
      }
      
      const total = allCards.length;

      // If Kanji mode, only count cards that actually have kanji
      const relevantCards = allCards.filter((c: any) => {
        if (studyMode === "Kanji" && !(c.kanji && hasKanji(c.kanji))) {
          return false;
        }
        
        // Filter by Priority / Grade (fallback to 1 if not found)
        const cPriority = "priority" in c ? Number(c.priority) 
                        : "importinity" in c ? Number(c.importinity)
                        : "importantity" in c ? Number(c.importantity)
                        : 1;
        if (selectedGrades.length > 0 && !selectedGrades.includes(cPriority)) {
          return false;
        }

        // Filter by Level
        if (!selectedLevels.includes("ALL")) {
          const cLevel = c.level || "";
          if (!selectedLevels.includes(cLevel)) {
            if (cLevel !== "-" || !selectedLevels.includes("-")) {
              return false;
            }
          }
        }
        
        return true;
      });
      const relevantTotal = relevantCards.length;
      
      try {
        const sourceIds = relevantCards.map((c: any) => c.id);
        const progressList = await db.progress.where('card_id').anyOf(sourceIds).toArray();
        const progressMap = new Map(progressList.map(p => [p.card_id, p]));
        
        const now = new Date();
        let learning = 0;
        
        for (const card of relevantCards) {
          const p = progressMap.get(card.id);
          // Learning = new card OR card that is due
          if (!p || p.due <= now) {
            learning++;
          }
        }
        
        setStats({ total: relevantTotal, learning });
      } catch (e) {
        console.error("Failed to load IndexedDB progress", e);
        setStats({ total: relevantTotal, learning: relevantTotal }); // fallback
      }
    }
    loadStats();
  }, [selectedDecks, activeTab, studyMode, selectedGrades, selectedLevels]);

  const selectRange = (start: number, end: number) => {
    if (activeSources.length === 0) return;
    const ids = activeSources[0].chapters.slice(start - 1, end).map(c => c.id);
    setSelectedDecks(prev => [...new Set([...prev, ...ids])]);
  };

  const selectAll = () => {
    if (activeSources.length === 0) return;
    const ids = activeSources.flatMap(s => s.chapters.map(c => c.id));
    setSelectedDecks(prev => [...new Set([...prev, ...ids])]);
  };

  const clearSelection = () => {
    setSelectedDecks([]);
  };

  // --- Drag to Select Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    const target = e.target as HTMLElement;
    const btn = target.closest('[data-chapter-id]') as HTMLElement;
    
    if (btn) {
      const id = btn.getAttribute('data-chapter-id')!;
      const isCurrentlySelected = selectedDecks.includes(id);
      const action = isCurrentlySelected ? "deselect" : "select";
      
      setIsDragging(true);
      setDragAction(action);
      
      toggleArrayItem(setSelectedDecks, id);
      setDraggedSet(new Set([id]));
      
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;
    
    const btn = element.closest('[data-chapter-id]') as HTMLElement;
    if (btn) {
      const id = btn.getAttribute('data-chapter-id')!;
      
      if (!draggedSet.has(id)) {
        setDraggedSet(prev => new Set(prev).add(id));
        
        setSelectedDecks(prev => {
          if (dragAction === "select" && !prev.includes(id)) {
            return [...prev, id];
          } else if (dragAction === "deselect" && prev.includes(id)) {
            return prev.filter(x => x !== id);
          }
          return prev;
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setDraggedSet(new Set());
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };
  // ------------------------------

  const handleStartSession = () => {
    if (selectedDecks.length === 0) return;
    
    const config = {
      selectedDecks,
      grades: selectedGrades,
      levels: selectedLevels,
      studyMode,
      hideLabel
    };
    
    localStorage.setItem("mykaado_flashcard_config", JSON.stringify(config));
    router.push("/flashcard");
  };

  const settingsContent = (
    <>
      {/* Grade Filter */}
      <div>
        <h3 className="font-bold text-sm text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Tipe</h3>
        <div className="flex gap-2">
          <Toggle pressed={selectedGrades.includes(1)} onPressedChange={() => toggleArrayItem(setSelectedGrades, 1)} className="flex-1 py-1 h-auto text-sm">
            1 Wajib
          </Toggle>
          <Toggle pressed={selectedGrades.includes(2)} onPressedChange={() => toggleArrayItem(setSelectedGrades, 2)} className="flex-1 py-1 h-auto text-sm">
            2 Reff
          </Toggle>
          <Toggle pressed={selectedGrades.includes(3)} onPressedChange={() => toggleArrayItem(setSelectedGrades, 3)} className="flex-1 py-1 h-auto text-sm">
            3 Trash
          </Toggle> 
        </div>
      </div>

      {/* JLPT Level */}
      <div>
        <h3 className="font-bold text-sm text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Level JLPT</h3>
        <div className="flex flex-wrap gap-2">
          {["ALL", "N5", "N4", "N3", "N2", "N1"].map(lvl => (
            <Toggle 
              key={lvl} 
              pressed={selectedLevels.includes(lvl)} 
              onPressedChange={() => toggleLevel(lvl)}
              className="flex-1 min-w-[40px] py-1 h-auto text-sm px-1"
            >
              {lvl}
            </Toggle>
          ))}
        </div>
      </div>

      {/* Study Mode */}
      <div>
        <h3 className="font-bold text-sm text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Mode Belajar</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Toggle pressed={studyMode === "Standard"} onPressedChange={() => setStudyMode("Standard")} className="py-2 h-auto flex flex-col gap-1" title="Jepang ke Indonesia">
            <span className="text-sm font-bold">JP あ - ID</span>
              <span className="text-[10px] uppercase font-bold opacity-70">Standard</span>
          </Toggle>
          <Toggle pressed={studyMode === "Reverse"} onPressedChange={() => setStudyMode("Reverse")} className="py-2 h-auto flex flex-col gap-1" title="Indonesia ke Jepang">
            <span className="text-sm font-bold">ID - JP</span>
            <span className="text-[10px] uppercase font-bold opacity-70">Reverse</span>
          </Toggle>
          <Toggle pressed={studyMode === "Kanji"} onPressedChange={() => setStudyMode("Kanji")} className="py-2 h-auto flex flex-col gap-1" title="Menebak bacaan Kanji">
            <span className="text-sm font-bold">漢字 - あ</span>
            <span className="text-[10px] uppercase font-bold opacity-70">Kanji</span>
          </Toggle>
          <Toggle pressed={studyMode === "Mix"} onPressedChange={() => setStudyMode("Mix")} className="py-2 h-auto flex flex-col gap-1" title="Kombinasi campuran">
            <span className="text-sm font-bold">漢字/あ - ID</span>
            <span className="text-[10px] uppercase font-bold opacity-70">Mix</span>
          </Toggle>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-nav)] rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] mt-2">
          <span className="font-bold text-sm">Tampilkan Label Bab</span>
          <button 
            onClick={() => setHideLabel(!hideLabel)}
            className={`w-12 h-6 rounded-full p-1 transition-colors border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center ${!hideLabel ? "bg-[var(--color-text-main)]" : "bg-[var(--color-bg-card)]"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-[var(--color-bg-main)] transition-transform border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] ${!hideLabel ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-28 lg:pb-12 pt-4">
      
      {/* Top Bar matching screenshot */}


      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Control Panel (Desktop Only) */}
        <div className="hidden lg:flex w-[340px] flex-col gap-6 shrink-0">
          
          <Card className="p-5 flex flex-col gap-6">
            {settingsContent}
          </Card>

          {/* Start Button */}
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full text-lg h-14"
            disabled={selectedDecks.length === 0}
            onClick={handleStartSession}
          >
            START SESSION <Play className="w-5 h-5 ml-2 fill-current" />
          </Button>

        </div>

        {/* Right Column: Library & Stats */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-extrabold">{selectedDecks.length}</div>
              <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Decks Selected</div>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-extrabold">{stats.total === 0 ? "--" : stats.total}</div>
              <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Total Cards</div>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-extrabold text-[var(--color-fsrs-again)]">{stats.total === 0 ? "0" : stats.learning}</div>
              <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Learning</div>
            </Card>
            <Link href="/flashcard/history" className="block">
              <Card className="p-4 flex flex-col items-center justify-center text-center hover:bg-[var(--color-bg-nav)] transition-colors h-full">
                <div className="text-xl font-extrabold flex items-center h-full">History</div>
              </Card>
            </Link>
          </div>

          {/* Library Select */}
          <Card className="p-6 flex-1 flex flex-col max-h-[600px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Library Select</h2>
              <div className="px-3 py-1 bg-[var(--color-bg-nav)] rounded-full text-xs font-bold border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)]">
                {selectedDecks.length} Selected
              </div>
            </div>

            {/* Quick Select Buttons */}
            {activeTab === "minna" && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Button variant="default" size="sm" onClick={() => selectRange(1, 10)}>1-10</Button>
                <Button variant="default" size="sm" onClick={() => selectRange(11, 25)}>11-25</Button>
                <Button variant="default" size="sm" onClick={() => selectRange(1, 25)}>1-25</Button>
                <Button variant="default" size="sm" onClick={() => selectRange(26, 37)}>26-37</Button>
                <Button variant="default" size="sm" onClick={() => selectRange(38, 50)}>38-50</Button>
                <Button variant="default" size="sm" onClick={selectAll}>All Minna</Button>
                <Button variant="default" size="sm" onClick={clearSelection} className="text-[var(--color-fsrs-again)] !border-[var(--color-fsrs-again)]">Clear</Button>
              </div>
            )}
            
            {activeTab === "irodori" && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Button variant="default" size="sm" onClick={selectAll}>All Irodori</Button>
                <Button variant="default" size="sm" onClick={clearSelection} className="text-[var(--color-fsrs-again)] !border-[var(--color-fsrs-again)]">Clear</Button>
              </div>
            )}

            {/* Grid of Chapters */}
            {/* Grid of Chapters */}
            <div 
              className="overflow-y-auto pr-2 pb-4 touch-pan-y select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {activeSources.map(source => (
                <div key={source.id} className="mb-6 last:mb-0">
                  {activeSources.length > 1 && (
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-px bg-[var(--color-border-main)] flex-1"></div>
                      <span className="font-bold text-xs uppercase text-[var(--color-text-muted)] tracking-wider">{source.title}</span>
                      <div className="h-px bg-[var(--color-border-main)] flex-1"></div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
                    {source.chapters.map(chapter => {
                      const isSelected = selectedDecks.includes(chapter.id);
                      return (
                        <button
                          key={chapter.id}
                          data-chapter-id={chapter.id}
                          className={`py-2 px-1 rounded-[var(--radius-sm)] border-[1px] border-solid text-center font-bold text-xs transition-all
                            ${isSelected 
                              ? "bg-[var(--color-text-main)] border-[var(--color-border-main)] text-[var(--color-bg-main)] shadow-[1px_1px_0px_var(--color-shadow-main)] translate-y-[-1px]" 
                              : "bg-[var(--color-bg-card)] border-[var(--color-border-main)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)] shadow-[1px_1px_0px_var(--color-shadow-main)]"
                            }
                          `}
                        >
                          {chapter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
          </Card>
        </div>

      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-bg-main)] border-t-[length:var(--bw-md)] border-solid border-[var(--color-border-main)] flex gap-2 lg:hidden z-50">
        <Button variant="default" className="flex-none px-4 h-14 bg-[var(--color-bg-card)]" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-6 h-6" />
        </Button>
        <Button variant="primary" className="flex-1 h-14 text-lg" disabled={selectedDecks.length === 0} onClick={handleStartSession}>
          START SESSION <Play className="w-5 h-5 ml-2 fill-current" />
        </Button>
      </div>

      {/* Mobile Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Pengaturan">
        <div className="flex flex-col gap-6 pb-4">
          {settingsContent}
        </div>
      </Modal>

    </div>
  );
}
