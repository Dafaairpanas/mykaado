import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { Search, ChevronLeft, Eye, Bookmark, Play, Shuffle, RotateCcw, AlertCircle, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { KOTOBA_SOURCES, fetchSelectedDecks, fetchAllKotobaForSearch, type DeckSource, type UniversalKotobaItem } from "@/lib/data-loader";
import { getKotobaChapterUrl, resolveKotobaRoute } from "@/lib/kotoba-routes";
import { matchesJapaneseSearch, getSearchRelevanceScore } from "@/lib/japanese-search";
import type { KotobaItem } from "@/types";

export default function KotobaPage() {
  const navigate = useNavigate();
  const { source, chapter } = useParams<{ source?: string; chapter?: string }>();
  const [searchParams] = useSearchParams();

  // Resolve current route into chapter ID and active tab
  const routeInfo = useMemo(() => {
    return resolveKotobaRoute(source, chapter, searchParams.get("tab"));
  }, [source, chapter, searchParams]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>(routeInfo.activeTab);
  const selectedChapterId = routeInfo.chapterId;

  // Universal Search State (cross-material search on List Kotoba)
  const [universalSearchQuery, setUniversalSearchQuery] = useState("");
  const [universalSourceFilter, setUniversalSourceFilter] = useState<"all" | "minna" | "irodori" | "n3">("all");
  const [allKotobaItems, setAllKotobaItems] = useState<UniversalKotobaItem[]>([]);
  const [isUniversalLoading, setIsUniversalLoading] = useState(false);
  const [universalResultsLimit, setUniversalResultsLimit] = useState(40);

  // Keep activeTab in sync with routeInfo
  useEffect(() => {
    setActiveTab(routeInfo.activeTab);
  }, [routeInfo.activeTab]);
  
  // Data State
  const [chapterData, setChapterData] = useState<KotobaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Shuffle / Order State
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

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

  // Tab switch handler
  const handleTabChange = (tab: "minna" | "irodori" | "n3") => {
    setActiveTab(tab);
    navigate(`/kotoba/${tab}`, { replace: true });
  };

  // Load detailed chapter data when a chapter is selected
  useEffect(() => {
    setIsShuffled(false);
    setShuffledOrder([]);
    setSearchQuery("");
    setFilterMode("all");

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

  // Load all kotoba cards in background for universal search
  useEffect(() => {
    let isMounted = true;
    async function loadAll() {
      setIsUniversalLoading(true);
      try {
        const list = await fetchAllKotobaForSearch();
        if (isMounted) setAllKotobaItems(list);
      } catch (e) {
        console.error("Failed to load universal kotoba", e);
      } finally {
        if (isMounted) setIsUniversalLoading(false);
      }
    }
    loadAll();
    return () => { isMounted = false; };
  }, []);

  // Filtered Universal Search Results
  const universalSearchResults = useMemo(() => {
    const q = universalSearchQuery.trim();
    if (!q) return [];

    return allKotobaItems
      .filter(item => {
        // Tab filter (all | minna | irodori | n3)
        if (universalSourceFilter !== "all" && item.sourceCategory !== universalSourceFilter) {
          return false;
        }

        return matchesJapaneseSearch(item, q);
      })
      .sort((a, b) => getSearchRelevanceScore(b, q) - getSearchRelevanceScore(a, q));
  }, [allKotobaItems, universalSearchQuery, universalSourceFilter]);

  // Counts for material filter tabs in Universal Search
  const universalFilterCounts = useMemo(() => {
    const q = universalSearchQuery.trim();
    if (!q) return { all: 0, minna: 0, irodori: 0, n3: 0 };
    let all = 0, minna = 0, irodori = 0, n3 = 0;
    
    for (const item of allKotobaItems) {
      if (matchesJapaneseSearch(item, q)) {
        all++;
        if (item.sourceCategory === "minna") minna++;
        else if (item.sourceCategory === "irodori") irodori++;
        else if (item.sourceCategory === "n3") n3++;
      }
    }
    return { all, minna, irodori, n3 };
  }, [allKotobaItems, universalSearchQuery]);

  // Practice handlers for Universal Search
  const handlePracticeUniversalResults = () => {
    const ids = universalSearchResults.slice(0, 100).map(i => i.id).filter(Boolean);
    if (ids.length === 0) return;
    localStorage.setItem("mykaado_custom_cards", JSON.stringify(ids));
    navigate("/flashcard");
  };

  const handlePracticeSingleKotoba = (id: string) => {
    localStorage.setItem("mykaado_custom_cards", JSON.stringify([id]));
    navigate("/flashcard");
  };

  // Auto-scroll to highlighted item if arriving from Universal Search "Buka Bab"
  const highlightId = searchParams.get("highlight");
  useEffect(() => {
    if (!highlightId || chapterData.length === 0) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`kotoba-row-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [highlightId, chapterData]);

  // Shuffle helper functions
  const handleShuffle = () => {
    if (chapterData.length === 0) return;
    const indices = Array.from({ length: chapterData.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledOrder(indices);
    setIsShuffled(true);
  };

  const handleResetOrder = () => {
    setIsShuffled(false);
  };

  // Find the label for the currently selected chapter
  const currentChapterInfo = useMemo(() => {
    if (!selectedChapterId) return null;
    for (const source of KOTOBA_SOURCES) {
      const ch = source.chapters.find(c => c.id === selectedChapterId);
      if (ch) return { title: source.title, label: ch.label };
    }
    return null;
  }, [selectedChapterId]);

  // Set document title according to chapter or page
  useEffect(() => {
    if (currentChapterInfo) {
      document.title = `${currentChapterInfo.title} ${currentChapterInfo.label} - Kotoba | MyKaado`;
    } else {
      document.title = "List Kotoba | MyKaado";
    }
  }, [currentChapterInfo]);

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

  const displayItems = useMemo(() => {
    if (!isShuffled || shuffledOrder.length !== chapterData.length) {
      return chapterData.map((item, originalIndex) => ({ item, originalIndex }));
    }
    return shuffledOrder
      .map(idx => ({ item: chapterData[idx], originalIndex: idx }))
      .filter(x => Boolean(x.item));
  }, [chapterData, isShuffled, shuffledOrder]);

  const filteredData = useMemo(() => {
    let list = displayItems;
    if (filterMode === "marked") {
      list = list.filter(({ item, originalIndex }) => {
        const id = item.id || `${item.kana}-${item.meaning}-${originalIndex}`;
        return markedItems.has(id);
      });
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim();
    return list
      .filter(({ item }) => matchesJapaneseSearch(item, q))
      .sort((a, b) => getSearchRelevanceScore(b.item, q) - getSearchRelevanceScore(a.item, q));
  }, [displayItems, searchQuery, filterMode, markedItems]);

  // View: CHAPTER NOT FOUND
  if (routeInfo.isNotFound) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-20 text-center animate-fade-in-up">
        <div className="p-8 rounded-[var(--radius-md)] border-[length:var(--bw-md)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] shadow-[4px_4px_0px_var(--color-shadow-main)] flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-2xl mb-4 border-[length:var(--bw-sm)] border-solid border-red-300 dark:border-red-900">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black mb-2">Bab Tidak Ditemukan</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-6 max-w-sm">
            Bab atau sumber kosakata yang Anda tuju tidak ditemukan atau tautan salah.
          </p>
          <Button variant="primary" onClick={() => navigate("/kotoba")}>
            Kembali ke Daftar Bab
          </Button>
        </div>
      </div>
    );
  }

  // View: LIST OF CHAPTERS
  if (!selectedChapterId) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 pb-20 pt-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">List Kotoba</h1>
            <p className="text-[var(--color-text-muted)] font-medium">Pilih bab atau cari kosakata universal lintas materi</p>
          </div>
          
          <div className="flex gap-2 bg-[var(--color-bg-nav)] p-1.5 rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] self-start md:self-auto overflow-x-auto max-w-full hide-scrollbar">
            <button
              onClick={() => {
                setUniversalSearchQuery("");
                handleTabChange("minna");
              }}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === "minna" ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)]"}`}
            >
              Minna
            </button>
            <button
              onClick={() => {
                setUniversalSearchQuery("");
                handleTabChange("irodori");
              }}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === "irodori" ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)]"}`}
            >
              Irodori
            </button>
            <button
              onClick={() => {
                setUniversalSearchQuery("");
                handleTabChange("n3");
              }}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === "n3" ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)]"}`}
            >
              Sou N3
            </button>
          </div>
        </div>

        {/* Universal Search Bar */}
        <div className="relative mb-8">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="🔍 Universal Search: Cari kosakata lintas materi (contoh: makan, たべる, taberu, 食べる)..."
              value={universalSearchQuery}
              onChange={(e) => {
                setUniversalSearchQuery(e.target.value);
                setUniversalResultsLimit(40);
              }}
              className="w-full pl-12 pr-12 py-3.5 text-sm sm:text-base font-bold rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] shadow-[3px_3px_0px_var(--color-shadow-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-text-muted)]/70 transition-all"
            />
            {universalSearchQuery && (
              <button
                type="button"
                onClick={() => setUniversalSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)] transition-colors cursor-pointer"
                title="Bersihkan pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Universal Search Results View (Active when search query is entered) */}
        {universalSearchQuery.trim() ? (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            {/* Header bar with summary and quick actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-[var(--color-btn-text)] flex items-center justify-center font-black shrink-0 shadow-[1px_1px_0px_var(--color-shadow-main)]">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Hasil Pencarian Lintas Materi
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-bold">
                    Ditemukan <span className="text-[var(--color-text-main)] font-black">{universalSearchResults.length}</span> kosakata untuk &ldquo;{universalSearchQuery}&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {universalSearchResults.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePracticeUniversalResults}
                    className="font-extrabold text-xs h-9 shadow-[2px_2px_0px_var(--color-shadow-main)]"
                    title="Latih hasil pencarian langsung di flashcard"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    Latih {Math.min(universalSearchResults.length, 100)} di Flashcard
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setUniversalSearchQuery("")}
                  className="font-extrabold text-xs h-9"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Kembali ke Bab
                </Button>
              </div>
            </div>

            {/* Material Filter Tabs for Universal Search */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setUniversalSourceFilter("all")}
                className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] cursor-pointer ${
                  universalSourceFilter === "all"
                    ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]"
                    : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                }`}
              >
                Semua Materi ({universalFilterCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setUniversalSourceFilter("minna")}
                className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center gap-1.5 cursor-pointer ${
                  universalSourceFilter === "minna"
                    ? "bg-blue-600 text-white shadow-[2px_2px_0px_var(--color-shadow-main)]"
                    : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                }`}
              >
                <span>Minna no Nihongo</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 font-mono">({universalFilterCounts.minna})</span>
              </button>
              <button
                type="button"
                onClick={() => setUniversalSourceFilter("irodori")}
                className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center gap-1.5 cursor-pointer ${
                  universalSourceFilter === "irodori"
                    ? "bg-emerald-600 text-white shadow-[2px_2px_0px_var(--color-shadow-main)]"
                    : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                }`}
              >
                <span>Irodori</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 font-mono">({universalFilterCounts.irodori})</span>
              </button>
              <button
                type="button"
                onClick={() => setUniversalSourceFilter("n3")}
                className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center gap-1.5 cursor-pointer ${
                  universalSourceFilter === "n3"
                    ? "bg-purple-600 text-white shadow-[2px_2px_0px_var(--color-shadow-main)]"
                    : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                }`}
              >
                <span>Sou N3</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 font-mono">({universalFilterCounts.n3})</span>
              </button>
            </div>

            {/* Results Table */}
            {isUniversalLoading ? (
              <div className="p-16 text-center font-extrabold flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-[var(--color-border-main)] border-t-[var(--color-accent)] rounded-full animate-spin" />
                <span>Memuat data lintas materi...</span>
              </div>
            ) : universalSearchResults.length === 0 ? (
              <div className="p-16 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] shadow-[2px_2px_0px_var(--color-shadow-main)] text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-nav)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center justify-center">
                  <Search className="w-6 h-6 text-[var(--color-text-muted)]" />
                </div>
                <h4 className="text-lg font-black">Tidak Ada Kosakata yang Cocok</h4>
                <p className="text-xs text-[var(--color-text-muted)] max-w-sm font-medium">
                  Tidak ditemukan kata yang cocok dengan &ldquo;{universalSearchQuery}&rdquo; di materi {universalSourceFilter === "all" ? "manapun" : universalSourceFilter.toUpperCase()}. Coba cari dengan romaji, kana, kanji, atau arti bahasa Indonesia.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setUniversalSearchQuery("")}
                  className="mt-2 font-bold"
                >
                  Bersihkan Pencarian
                </Button>
              </div>
            ) : (
              <div className="rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] overflow-hidden bg-[var(--color-bg-card)] shadow-[3px_3px_0px_var(--color-shadow-main)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-[var(--color-bg-nav)] border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] text-xs uppercase tracking-wider font-extrabold">
                      <tr>
                        <th className="p-3 w-48">Materi & Bab</th>
                        <th className="p-3 w-64">Kosakata (Kana / Kanji)</th>
                        <th className="p-3">Arti (Indonesia)</th>
                        <th className="p-3 w-40 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-[1px] divide-dashed divide-[var(--color-border-main)]">
                      {universalSearchResults.slice(0, universalResultsLimit).map((item, idx) => {
                        const isMarked = markedItems.has(item.id);
                        return (
                          <tr
                            key={item.id || `${item.kana}-${idx}`}
                            className="hover:bg-[var(--color-bg-nav)]/60 transition-colors group"
                          >
                            {/* Source & Chapter */}
                            <td className="p-3 align-top">
                              <div className="flex flex-col gap-1.5 items-start">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded shadow-[1px_1px_0px_var(--color-shadow-main)] border border-[var(--color-border-main)] ${
                                  item.sourceCategory === "minna" 
                                    ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                                    : item.sourceCategory === "irodori"
                                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                                      : "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300"
                                }`}>
                                  {item.sourceTitle}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-[var(--color-text-muted)]">
                                    {item.chapterLabel}
                                  </span>
                                  {item.level && item.level !== "-" && (
                                    <span className="text-[10px] font-mono font-bold px-1 rounded bg-[var(--color-bg-nav)] border border-[var(--color-border-main)]/30">
                                      {item.level}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Kotoba (Kana / Kanji / Romaji) */}
                            <td className="p-3 align-top">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-bold text-xl jp-text leading-tight text-[var(--color-text-main)]">
                                    {item.kanji || item.kana}
                                  </span>
                                  {item.kanji && item.kana && (
                                    <span className="text-xs text-[var(--color-text-muted)] jp-text font-normal">
                                      {item.kana}
                                    </span>
                                  )}
                                </div>
                                {item.romaji && (
                                  <span className="text-xs font-mono text-[var(--color-text-muted)] opacity-80">
                                    {item.romaji}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Meaning */}
                            <td className="p-3 align-top">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-[var(--color-text-main)] leading-relaxed">
                                  {item.meaning}
                                </span>
                                {item.type && (
                                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                                    {item.type} {item.transitivity ? `• ${item.transitivity}` : ""}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3 align-top text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  to={`${getKotobaChapterUrl(item.chapterId)}?highlight=${item.id}`}
                                  className="h-8 px-2.5 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-nav)] hover:bg-[var(--color-accent)] hover:text-[var(--color-btn-text)] text-xs font-extrabold flex items-center gap-1 shadow-[1px_1px_0px_var(--color-shadow-main)] transition-all cursor-pointer"
                                  title={`Buka ${item.sourceTitle} ${item.chapterLabel}`}
                                >
                                  <span>Buka</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handlePracticeSingleKotoba(item.id)}
                                  className="h-8 w-8 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-accent)] text-[var(--color-btn-text)] hover:brightness-105 flex items-center justify-center shadow-[1px_1px_0px_var(--color-shadow-main)] transition-all cursor-pointer"
                                  title="Latih di Flashcard"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleMark(item.id)}
                                  className={`h-8 w-8 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center justify-center shadow-[1px_1px_0px_var(--color-shadow-main)] transition-all cursor-pointer ${
                                    isMarked 
                                      ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400" 
                                      : "bg-[var(--color-bg-nav)] text-[var(--color-text-muted)] hover:text-amber-500"
                                  }`}
                                  title={isMarked ? "Hapus tanda sulit" : "Tandai kata sulit"}
                                >
                                  <Bookmark className={`w-3.5 h-3.5 ${isMarked ? "fill-current" : ""}`} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination / Load more */}
                {universalSearchResults.length > universalResultsLimit && (
                  <div className="p-4 bg-[var(--color-bg-nav)] border-t-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] text-center">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setUniversalResultsLimit(prev => prev + 40)}
                      className="font-extrabold text-xs shadow-[1px_1px_0px_var(--color-shadow-main)]"
                    >
                      Muat Lebih Banyak ({universalSearchResults.length - universalResultsLimit} kata tersisa)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Chapters Grid (When query is empty) */
          <div className="flex flex-col gap-10">
            {activeSources.map(source => (
              <div key={source.id}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-1.5 h-6 bg-[var(--color-text-main)] rounded-full"></div>
                  <h2 className="text-xl font-extrabold">{source.title}</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 gap-3">
                  {source.chapters.map(chapter => (
                    <Link
                      key={chapter.id}
                      to={getKotobaChapterUrl(chapter.id)}
                      className="py-3 px-2 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] text-center font-bold text-sm hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_var(--color-shadow-main)] transition-all flex items-center justify-center cursor-pointer"
                    >
                      {chapter.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // View: CHAPTER DETAIL
  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-20 pt-4">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => { 
              navigate(`/kotoba/${activeTab}`);
            }} 
            className="h-10 shrink-0"
          >
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
            {isShuffled && (
              <span className="px-2.5 py-1 bg-[var(--color-accent)] text-[var(--color-btn-text)] rounded-full text-xs font-bold border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)] shrink-0 flex items-center gap-1.5 animate-fade-in-up">
                <Shuffle className="w-3.5 h-3.5" />
                <span>Urutan Diacak</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Dropdown to switch chapter in the same source */}
        <div className="flex items-center w-full md:w-auto shrink-0">
           <select 
             className="w-full md:w-auto px-4 py-2.5 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] font-bold text-sm outline-none cursor-pointer focus:shadow-[2px_2px_0px_var(--color-shadow-main)]"
             value={selectedChapterId || ""}
             onChange={(e) => {
               const targetChapterId = e.target.value;
               const targetUrl = getKotobaChapterUrl(targetChapterId);
               navigate(targetUrl);
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
        {/* Filter & Order Controls */}
        <div className="flex items-center gap-2 flex-wrap">
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

          <div className="w-[1px] h-5 bg-[var(--color-border-main)] opacity-20 mx-0.5 hidden sm:block" />

          {/* Shuffle / Randomize Button */}
          {!isShuffled ? (
            <button
              onClick={handleShuffle}
              className="px-3.5 py-1.5 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 border-[length:var(--bw-sm)] border-dashed border-[var(--color-border-main)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)] hover:border-solid hover:shadow-[1px_1px_0px_var(--color-shadow-main)] active:scale-95 cursor-pointer"
              title="Acak urutan kata agar hafalan lebih teruji"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Acak Urutan</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-[var(--color-bg-nav)] p-1 rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)]">
              <button
                onClick={handleShuffle}
                className="px-3 py-1 rounded-full font-bold text-xs md:text-sm bg-[var(--color-accent)] text-[var(--color-btn-text)] shadow-[1px_1px_0px_var(--color-shadow-main)] flex items-center gap-1.5 active:scale-95 hover:brightness-105 transition-all cursor-pointer"
                title="Acak ulang kembali susunan kata"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Acak Lagi</span>
              </button>
              <button
                onClick={handleResetOrder}
                className="px-2.5 py-1 rounded-full font-bold text-xs md:text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-card)] transition-all flex items-center gap-1 cursor-pointer"
                title="Kembalikan ke urutan bab asli"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Urutan Asli</span>
                <span className="sm:hidden">Reset</span>
              </button>
            </div>
          )}
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
            {filteredData.map(({ item, originalIndex }) => {
              const itemId = item.id || `${item.kana}-${item.meaning}-${originalIndex}`;
              const isMarked = markedItems.has(itemId);
              const itemPriority = "priority" in item ? Number(item.priority)
                                 : "importinity" in item ? Number((item as any).importinity)
                                 : "importantity" in item ? Number((item as any).importantity)
                                 : 1;
              const isOptional = itemPriority === 2 || itemPriority === 3;

              const isHighlighted = Boolean(highlightId && (item.id === highlightId || itemId === highlightId));

              return (
                <div 
                  key={itemId} 
                  id={`kotoba-row-${item.id || itemId}`}
                  onClick={() => handleRowClick(itemId)}
                  className={`grid grid-cols-3 divide-x-[1px] divide-dashed divide-[var(--color-border-main)] transition-colors cursor-pointer group select-none md:select-text border-l-4 ${
                    isHighlighted
                      ? "bg-[var(--color-accent)]/20 border-l-[var(--color-accent)] ring-2 ring-[var(--color-accent)] shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.3)] animate-pulse"
                      : isMarked 
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
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className={`jp-text text-lg font-normal text-[var(--color-text-main)] transition-all leading-snug ${!showKana && "blur-sm opacity-30 select-none group-hover:blur-none group-hover:opacity-100"}`}>
                        {item.kana}
                      </span>
                      {isOptional && (
                        <span 
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[var(--color-bg-nav)] text-[var(--color-text-muted)] border border-solid border-[var(--color-border-main)]/40 shrink-0 select-none shadow-[1px_1px_0px_var(--color-shadow-main)]"
                          title="Kosakata opsional (tidak wajib)"
                        >
                          Opsional
                        </span>
                      )}
                    </div>
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
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-[var(--color-accent)] text-[var(--color-bg-main)] rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center justify-center shadow-[4px_4px_0px_var(--color-shadow-main)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_var(--color-shadow-main)] transition-all z-50 cursor-pointer"
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
          <div className="flex items-center justify-between p-3 border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-[var(--radius-sm)] bg-[var(--color-bg-nav)]">
            <div>
              <span className="font-bold block">Acak Urutan Kata</span>
              <span className="text-xs text-[var(--color-text-muted)]">Tampilkan kata secara tidak berurutan</span>
            </div>
            <Toggle 
              pressed={isShuffled} 
              onPressedChange={(pressed) => {
                if (pressed) {
                  handleShuffle();
                } else {
                  handleResetOrder();
                }
              }} 
              className="py-1 h-auto text-sm"
            >
              Acak
            </Toggle>
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

