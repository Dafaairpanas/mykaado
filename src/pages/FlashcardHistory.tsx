import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Play, Search, RotateCcw, AlertTriangle, BookOpen, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { fetchAllCardsMap } from "@/lib/data-loader";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [cardsMap, setCardsMap] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Review Log & Selection
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Filter & Search
  const [activeTab, setActiveTab] = useState<"all" | "again" | "hard" | "good">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setIsLoading(true);

    // 1. Load cards dictionary (fast path cached)
    const map = await fetchAllCardsMap();
    setCardsMap(map);

    // 2. Fetch history and progress from DB
    const histories = await db.history.toArray();
    const progressList = await db.progress.toArray();

    const progressMap = new Map(progressList.map(p => [p.card_id, p]));
    const historyByCard = new Map<string, any[]>();

    histories.forEach(h => {
      if (!h.card_id) return;
      if (!historyByCard.has(h.card_id)) historyByCard.set(h.card_id, []);
      historyByCard.get(h.card_id)!.push(h);
    });

    // All candidates from history and progress
    const allCandidateCardIds = new Set<string>([
      ...Array.from(historyByCard.keys()),
      ...progressList.filter(p => p.unmastered || (p.lapses || 0) > 0 || (p.state !== 0 && p.state !== 2)).map(p => p.card_id)
    ]);

    const items: any[] = [];

    allCandidateCardIds.forEach(cardId => {
      const cardHistories = historyByCard.get(cardId) || [];
      const progress = progressMap.get(cardId);

      // Sort ascending by time
      cardHistories.sort((a, b) => new Date(a.reviewed_at).getTime() - new Date(b.reviewed_at).getTime());

      let againCount = 0;
      let hardCount = 0;
      let goodCount = 0;
      let easyCount = 0;

      cardHistories.forEach(h => {
        const r = Number(h.rating);
        if (r === 1 || h.rating === "Again") againCount++;
        else if (r === 2 || h.rating === "Hard") hardCount++;
        else if (r === 3 || h.rating === "Good") goodCount++;
        else if (r === 4 || h.rating === "Easy") easyCount++;
      });

      // KRUSIAL (Sesuai Permintaan User):
      // Yang masuk ke riwayat adalah kartu yang PERNAH di-review Again (1), Hard (2), atau Good (3).
      // - Walaupun kartu tersebut pada akhirnya di-review Easy, kartu itu TETAP MASUK ke history!
      // - Sebaliknya, jika kartu langsung di-review Easy (tanpa pernah di-review Again, Hard, atau Good),
      //   kartu tersebut TIDAK MASUK ke history!
      const hasStruggledOrRepeated = (againCount > 0 || hardCount > 0 || goodCount > 0) ||
        (cardHistories.length === 0 && progress && ((progress.lapses || 0) > 0 || progress.unmastered));

      if (hasStruggledOrRepeated) {
        const lastLog = cardHistories.length > 0 ? cardHistories[cardHistories.length - 1] : null;
        const lastRating = lastLog ? Number(lastLog.rating) : (againCount > 0 ? 1 : hardCount > 0 ? 2 : 3);
        const lastReviewedAt = lastLog ? lastLog.reviewed_at : (progress?.last_review || new Date());

        const cardData = map.get(cardId) || {
          id: cardId,
          kanji: cardId,
          kana: "",
          meaning: "Kotoba " + cardId,
          chapter: "-",
          level: "-"
        };

        items.push({
          card_id: cardId,
          rating: lastRating,
          againCount,
          hardCount,
          goodCount,
          easyCount,
          totalReviews: cardHistories.length || (progress?.reps || 1),
          reviewed_at: lastReviewedAt,
          cardData
        });
      }
    });

    setHistoryItems(items);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return historyItems
      .filter(item => {
        // Tab Filter
        if (activeTab === "again") return item.againCount > 0 || item.rating === 1;
        if (activeTab === "hard") return item.hardCount > 0 || item.rating === 2;
        if (activeTab === "good") return item.goodCount > 0 || item.rating === 3;
        return true;
      })
      .filter(item => {
        // Search Query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const kanji = (item.cardData.kanji || "").toLowerCase();
        const kana = (item.cardData.kana || "").toLowerCase();
        const romaji = (item.cardData.romaji || "").toLowerCase();
        const meaning = (item.cardData.meaning || "").toLowerCase();
        const chapter = (item.cardData.chapter || "").toLowerCase();
        return kanji.includes(q) || kana.includes(q) || romaji.includes(q) || meaning.includes(q) || chapter.includes(q);
      })
      .sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime());
  }, [historyItems, activeTab, searchQuery]);

  // Actions
  const handleDeleteProgress = async (cardId: string) => {
    if (!window.confirm("Hapus kotoba ini dari daftar riwayat latihan?")) return;

    await db.progress.where("card_id").equals(cardId).delete();
    await db.history.where("card_id").equals(cardId).delete();

    setHistoryItems(prev => prev.filter(h => h.card_id !== cardId));
    setSelectedCards(prev => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedCards.size === 0) return;
    if (!window.confirm(`Hapus ${selectedCards.size} kotoba terpilih dari riwayat?`)) return;

    const idsToDelete = Array.from(selectedCards);
    await db.progress.where("card_id").anyOf(idsToDelete).delete();
    await db.history.where("card_id").anyOf(idsToDelete).delete();

    setHistoryItems(prev => prev.filter(h => !selectedCards.has(h.card_id)));
    setSelectedCards(new Set());
  };

  const handleDeleteAll = async () => {
    if (filteredItems.length === 0) return;
    if (!window.confirm(`Hapus SEMUA (${filteredItems.length}) kotoba dari daftar riwayat ini?`)) return;

    const idsToDelete = filteredItems.map(h => h.card_id);
    await db.progress.where("card_id").anyOf(idsToDelete).delete();
    await db.history.where("card_id").anyOf(idsToDelete).delete();

    setHistoryItems(prev => prev.filter(h => !idsToDelete.includes(h.card_id)));
    setSelectedCards(new Set());
  };

  const handlePracticeFiltered = () => {
    const cardsToPractice = selectedCards.size > 0
      ? Array.from(selectedCards)
      : filteredItems.map(h => h.card_id);

    if (cardsToPractice.length === 0) return;

    localStorage.setItem("mykaado_custom_cards", JSON.stringify(cardsToPractice));
    navigate("/flashcard");
  };

  const handlePracticeSingle = (cardId: string) => {
    localStorage.setItem("mykaado_custom_cards", JSON.stringify([cardId]));
    navigate("/flashcard");
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCards(new Set(filteredItems.map(i => i.card_id)));
    } else {
      setSelectedCards(new Set());
    }
  };

  const handleSelect = (cardId: string, checked: boolean) => {
    setSelectedCards(prev => {
      const next = new Set(prev);
      if (checked) next.add(cardId);
      else next.delete(cardId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[var(--color-border-main)] border-t-[var(--color-accent)] rounded-full animate-spin" />
        <span className="font-extrabold text-sm text-[var(--color-text-muted)]">Memuat riwayat kotoba...</span>
      </div>
    );
  }

  // Summary counts
  const totalCount = historyItems.length;
  const againCount = historyItems.filter(i => i.againCount > 0 || i.rating === 1).length;
  const hardCount = historyItems.filter(i => i.hardCount > 0 || i.rating === 2).length;
  const goodCount = historyItems.filter(i => i.goodCount > 0 || i.rating === 3).length;

  return (
    <div className="max-w-[1100px] mx-auto px-4 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/flashcard/setup">
            <Button variant="default" size="icon" className="rounded-full shadow-[2px_2px_0px_var(--color-shadow-main)]" title="Kembali ke Setup">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Riwayat Kotoba</h1>
            <p className="text-xs text-[var(--color-text-muted)] font-bold">
              Kotoba yang pernah diulang (Again, Hard, Good) untuk di-recall kembali.
            </p>
          </div>
        </div>

        {/* Practice CTA */}
        {filteredItems.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handlePracticeFiltered}
              className="font-black text-sm h-11 px-5 shadow-[2px_2px_0px_var(--color-shadow-main)]"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Practice {selectedCards.size > 0 ? `Selected (${selectedCards.size})` : `All (${filteredItems.length})`}
            </Button>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-[var(--color-bg-nav)] p-1 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)] overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-black transition-colors whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-[var(--color-text-main)] text-[var(--color-bg-main)] shadow-[1px_1px_0px_var(--color-shadow-main)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("again")}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-black transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "again"
                  ? "bg-[#FF7B72] text-[#111] shadow-[1px_1px_0px_var(--color-shadow-main)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              <span>Again</span>
              <span className="text-[10px] font-mono px-1 rounded-full bg-black/10">({againCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hard")}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-black transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "hard"
                  ? "bg-[#F0A07B] text-[#111] shadow-[1px_1px_0px_var(--color-shadow-main)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              <span>Hard</span>
              <span className="text-[10px] font-mono px-1 rounded-full bg-black/10">({hardCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("good")}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-black transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "good"
                  ? "bg-[#79BFF8] text-[#111] shadow-[1px_1px_0px_var(--color-shadow-main)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              <span>Good</span>
              <span className="text-[10px] font-mono px-1 rounded-full bg-black/10">({goodCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Cari kanji, arti, bab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] bg-[var(--color-bg-card)] shadow-[1px_1px_0px_var(--color-shadow-main)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-main)]"
            />
          </div>
        </div>

        {/* Bulk Action Bar (when selected) */}
        {selectedCards.size > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-[var(--color-accent)]/15 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] animate-in fade-in duration-150">
            <span className="text-xs font-extrabold flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[var(--color-text-main)]" />
              {selectedCards.size} kotoba dipilih
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handlePracticeFiltered}
                className="font-extrabold text-xs h-8"
              >
                <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Latih Terpilih
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDeleteSelected}
                className="text-red-500 !border-red-500 font-extrabold text-xs h-8 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] overflow-x-auto shadow-[2px_2px_0px_var(--color-shadow-main)]">
        <div className="max-h-[640px] overflow-y-auto min-w-[620px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--color-bg-nav)] sticky top-0 z-10 border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] text-xs uppercase tracking-wider font-extrabold">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[var(--color-text-main)] cursor-pointer"
                    checked={filteredItems.length > 0 && selectedCards.size === filteredItems.length}
                    onChange={handleSelectAll}
                    title="Pilih Semua"
                  />
                </th>
                <th className="p-3">Kotoba</th>
                <th className="p-3">Reaksi & Pengulangan</th>
                <th className="p-3">Tanggal Terakhir</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-bg-nav)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-[var(--color-text-muted)]" />
                      </div>
                      <h3 className="font-extrabold text-base">Belum Ada Riwayat Kotoba</h3>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        Saat kamu belajar flashcard dan memilih respon <strong>Again</strong>, <strong>Hard</strong>, atau <strong>Good</strong>,
                        kartu yang memerlukan pengulangan otomatis dicatat di sini agar dapat kamu recall kembali!
                      </p>
                      <Link to="/flashcard/setup" className="mt-2">
                        <Button variant="primary" size="sm" className="font-extrabold">
                          <Play className="w-4 h-4 mr-1.5 fill-current" /> Mulai Belajar Flashcard
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const card = item.cardData;
                  const jpText = card.kanji || card.kana;
                  const subText = card.kanji && card.kana ? card.kana : card.romaji || "";

                  return (
                    <tr
                      key={item.card_id}
                      className="border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] last:border-0 hover:bg-[var(--color-bg-nav)]/60 transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-[var(--color-text-main)] cursor-pointer"
                          checked={selectedCards.has(item.card_id)}
                          onChange={(e) => handleSelect(item.card_id, e.target.checked)}
                        />
                      </td>

                      {/* Kotoba Card Info */}
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg jp-text leading-tight">{jpText}</span>
                            {card.level && card.level !== "-" && (
                              <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-[var(--color-bg-nav)] border border-[var(--color-border-main)]/30">
                                {card.level}
                              </span>
                            )}
                            {card.chapter && card.chapter !== "-" && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[var(--color-accent)]/20 text-[var(--color-text-main)]">
                                {card.chapter}
                              </span>
                            )}
                          </div>
                          {subText && (
                            <span className="text-xs text-[var(--color-text-muted)] jp-text">{subText}</span>
                          )}
                          <span className="text-sm font-semibold text-[var(--color-text-main)] mt-0.5">{card.meaning}</span>
                        </div>
                      </td>

                      {/* Reaction & Repetition Breakdown */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1.5">
                          {/* Last Reaction Badge */}
                          <div className="flex items-center gap-1.5">
                            {item.rating === 1 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-[#FF7B72] text-[#111] border border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)]">
                                AGAIN
                              </span>
                            )}
                            {item.rating === 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-[#F0A07B] text-[#111] border border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)]">
                                HARD
                              </span>
                            )}
                            {item.rating === 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-[#79BFF8] text-[#111] border border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)]">
                                GOOD
                              </span>
                            )}
                            {item.rating === 4 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-[#7CE38B] text-[#111] border border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)]">
                                EASY
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-[var(--color-text-muted)]">
                              (Total diulang: {item.totalReviews}x)
                            </span>
                          </div>

                          {/* Pills breakdown of reactions */}
                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                            {item.againCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                                Again: {item.againCount}x
                              </span>
                            )}
                            {item.hardCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                                Hard: {item.hardCount}x
                              </span>
                            )}
                            {item.goodCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                                Good: {item.goodCount}x
                              </span>
                            )}
                            {item.easyCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                                Easy: {item.easyCount}x
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-xs font-mono font-bold text-[var(--color-text-muted)] whitespace-nowrap">
                        {new Date(item.reviewed_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePracticeSingle(item.card_id)}
                            className="h-8 px-2.5 text-xs font-extrabold shadow-[1px_1px_0px_var(--color-shadow-main)]"
                            title="Latih kotoba ini sekarang"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleDeleteProgress(item.card_id)}
                            className="h-8 px-2 text-xs text-red-500 hover:text-white hover:bg-red-500 transition-colors"
                            title="Hapus dari daftar riwayat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Action */}
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs">
          <Button
            variant="default"
            size="sm"
            onClick={handleDeleteAll}
            className="text-red-500 font-extrabold hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus Semua Riwayat ({filteredItems.length})
          </Button>

          <span className="font-mono text-[var(--color-text-muted)] font-bold">
            Menampilkan {filteredItems.length} dari {totalCount} kotoba
          </span>
        </div>
      )}
    </div>
  );
}
