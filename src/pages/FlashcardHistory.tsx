import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { fetchAllCardsMap } from "@/lib/data-loader";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [cardsMap, setCardsMap] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Review Log
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Load all cards dictionary
      const map = await fetchAllCardsMap();
      setCardsMap(map);

      // Group History by Card
      const histories = await db.history.toArray();
      const historyByCard = new Map<string, any[]>();
      histories.forEach(h => {
        if (!historyByCard.has(h.card_id)) historyByCard.set(h.card_id, []);
        historyByCard.get(h.card_id)!.push(h);
      });

      const unmasteredCards = new Map<string, any>();

      historyByCard.forEach((cardHistories, cardId) => {
        // Sort ascending by time
        cardHistories.sort((a, b) => new Date(a.reviewed_at).getTime() - new Date(b.reviewed_at).getTime());
        
        // Hanya tampilkan kotoba yang PERNAH direspon: Again (1), Hard (2), atau Good (3)
        // Meskipun nanti di akhir direspon Easy (4), tetap masuk ke daftar ini
        const hasEverBeenReviewedOrStruggled = cardHistories.some(
          h => h.rating === 1 || h.rating === 2 || h.rating === 3
        );

        if (hasEverBeenReviewedOrStruggled) {
          unmasteredCards.set(cardId, cardHistories[cardHistories.length - 1]);
        }
      });
      
      const enrichedHistory = Array.from(unmasteredCards.values())
        .map(h => ({
          ...h,
          cardData: map.get(h.card_id)
        }))
        .filter(h => h.cardData);
      
      setHistoryItems(enrichedHistory);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleDeleteProgress = async (cardId: string) => {
    if (!window.confirm("Hapus kartu ini dari daftar riwayat?")) return;
    
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
    if (!window.confirm(`Hapus ${selectedCards.size} kartu yang dipilih dari daftar riwayat?`)) return;

    const idsToDelete = Array.from(selectedCards);
    await db.progress.where("card_id").anyOf(idsToDelete).delete();
    await db.history.where("card_id").anyOf(idsToDelete).delete();

    setHistoryItems(prev => prev.filter(h => !selectedCards.has(h.card_id)));
    setSelectedCards(new Set());
  };

  const handleDeleteAll = async () => {
    if (filteredLog.length === 0) return;
    if (!window.confirm(`Hapus SEMUA (${filteredLog.length}) kartu dari daftar riwayat ini?`)) return;

    const idsToDelete = filteredLog.map(h => h.card_id);
    await db.progress.where("card_id").anyOf(idsToDelete).delete();
    await db.history.where("card_id").anyOf(idsToDelete).delete();

    setHistoryItems([]);
    setSelectedCards(new Set());
  };

  const handlePracticeFiltered = () => {
    const cardsToPractice = selectedCards.size > 0 
      ? Array.from(selectedCards)
      : historyItems.map(h => h.card_id);
      
    if (cardsToPractice.length === 0) return;
    
    localStorage.setItem("mykaado_custom_cards", JSON.stringify(cardsToPractice));
    navigate("/flashcard");
  };

  const filteredLog = [...historyItems].sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCards(new Set(filteredLog.map(i => i.card_id)));
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
    return <div className="flex h-screen items-center justify-center font-bold">Memuat data...</div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 pb-12 pt-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/flashcard/setup">
          <Button variant="default" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tight">Riwayat Kotoba</h1>
      </div>

      {/* Review Log Table */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--color-bg-card)] p-4 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="font-bold text-sm bg-[var(--color-bg-main)] px-3 py-2 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] whitespace-nowrap">
              Riwayat Kotoba ({filteredLog.length})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            {selectedCards.size > 0 && (
              <Button 
                variant="default" 
                onClick={handleDeleteSelected}
                className="text-[var(--color-fsrs-again)] !border-[var(--color-fsrs-again)] hover:bg-[var(--color-fsrs-again)] hover:text-white transition-colors font-bold text-xs"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Hapus Terpilih ({selectedCards.size})
              </Button>
            )}

            <Button 
              variant="default" 
              onClick={handleDeleteAll}
              disabled={filteredLog.length === 0}
              className="text-[var(--color-fsrs-again)] !border-[var(--color-fsrs-again)] hover:bg-[var(--color-fsrs-again)] hover:text-white transition-colors font-bold text-xs"
              title="Hapus semua kartu dalam daftar ini"
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Hapus Semua
            </Button>

            <Button variant="primary" onClick={handlePracticeFiltered} disabled={filteredLog.length === 0}>
              <Play className="w-4 h-4 mr-2 fill-current" /> Practice {selectedCards.size > 0 ? `Selected (${selectedCards.size})` : `All (${filteredLog.length})`}
            </Button>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] overflow-x-auto shadow-[2px_2px_0px_var(--color-shadow-main)]">
          <div className="max-h-[600px] overflow-y-auto min-w-[500px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--color-bg-nav)] sticky top-0 z-10 border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)]">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                      checked={filteredLog.length > 0 && selectedCards.size === filteredLog.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-3 font-black text-sm uppercase">Kartu</th>
                  <th className="p-3 font-black text-sm uppercase">Tanggal Terakhir</th>
                  <th className="p-3 font-black text-sm uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center font-bold text-[var(--color-text-muted)]">Tidak ada data</td>
                  </tr>
                ) : filteredLog.map((item) => (
                  <tr key={item.card_id} className="border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] last:border-0 hover:bg-[var(--color-bg-nav)] transition-colors">
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                        checked={selectedCards.has(item.card_id)}
                        onChange={(e) => handleSelect(item.card_id, e.target.checked)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-normal text-lg jp-text">{item.cardData.kanji || item.cardData.kana}</div>
                      <div className="text-sm font-bold text-[var(--color-text-muted)]">{item.cardData.meaning}</div>
                    </td>
                    <td className="p-3 text-sm font-mono font-bold">
                      {new Date(item.reviewed_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="default" size="icon" onClick={() => handleDeleteProgress(item.card_id)} className="text-[var(--color-fsrs-again)] !border-[var(--color-fsrs-again)] hover:bg-[var(--color-fsrs-again)] hover:text-white transition-colors" title="Hapus kartu ini">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
