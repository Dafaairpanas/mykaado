"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Play, Activity, BarChart2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { fetchAllCardsMap } from "@/lib/data-loader";

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"log" | "progress" | "activity">("log");
  const [cardsMap, setCardsMap] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Tab 1: Review Log
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Tab 2: Progress
  const [progressStats, setProgressStats] = useState<any[]>([]);

  // Tab 3: Activity
  const [activityData, setActivityData] = useState<any[]>([]);

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
      const masteredCards = new Set<string>(); // for Progress calculation

      const progressList = await db.progress.toArray();
      const progressMap = new Map(progressList.map(p => [p.card_id, p]));

      historyByCard.forEach((cardHistories, cardId) => {
        // Sort ascending by time
        cardHistories.sort((a, b) => new Date(a.reviewed_at).getTime() - new Date(b.reviewed_at).getTime());
        
        // Show all cards in the log for better visibility
        unmasteredCards.set(cardId, cardHistories[cardHistories.length - 1]);

        const prog = progressMap.get(cardId);
        if (prog && prog.unmastered !== undefined) {
          if (!prog.unmastered) {
            masteredCards.add(cardId);
          }
        } else {
          // Fallback logic
          let firstReviewOfLatestSession = cardHistories[0];

          for (let i = cardHistories.length - 1; i > 0; i--) {
             const curr = new Date(cardHistories[i].reviewed_at).getTime();
             const prev = new Date(cardHistories[i - 1].reviewed_at).getTime();
             if (curr - prev > 60 * 60 * 1000) { // 1 hour gap
                firstReviewOfLatestSession = cardHistories[i];
                break;
             }
          }

          if (firstReviewOfLatestSession.rating === 4) {
            masteredCards.add(cardId);
          }
        }
      });
      
      const enrichedHistory = Array.from(unmasteredCards.values())
        .map(h => ({
          ...h,
          cardData: map.get(h.card_id)
        }))
        .filter(h => h.cardData);
      
      setHistoryItems(enrichedHistory);
      
      // Better way for progress: iterate over all cards in map
      const statsMap: Record<string, { total: number, learned: number }> = {
        minna: { total: 0, learned: 0 },
        irodori: { total: 0, learned: 0 },
        n3: { total: 0, learned: 0 },
        kanji: { total: 0, learned: 0 }
      };

      map.forEach((card, id) => {
        let bucket = "";
        const idLower = id.toLowerCase();
        if (idLower.startsWith("mn-") || idLower.startsWith("minna") || idLower.startsWith("bp_minna")) bucket = "minna";
        else if (idLower.startsWith("ir-") || idLower.startsWith("ir_") || idLower.startsWith("bp_irodori")) bucket = "irodori";
        else if (idLower.startsWith("n3-") || idLower.startsWith("n3_") || idLower.startsWith("bp_n3")) bucket = "n3";
        else if (idLower.startsWith("kj-") || idLower.startsWith("kj_")) bucket = "kanji";

        if (bucket) {
          statsMap[bucket].total++;
          if (masteredCards.has(id)) statsMap[bucket].learned++;
        }
      });

      setProgressStats([
        { id: "minna", title: "Minna no Nihongo", ...statsMap.minna },
        { id: "irodori", title: "Irodori", ...statsMap.irodori },
        { id: "n3", title: "JLPT N3", ...statsMap.n3 },
        { id: "kanji", title: "Kanji", ...statsMap.kanji }
      ]);

      // Load Activity (7 Days)
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentHistories = histories.filter(h => new Date(h.reviewed_at) >= sevenDaysAgo);
      
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        
        const dayHistories = recentHistories.filter(h => {
          const hd = new Date(h.reviewed_at);
          return `${hd.getFullYear()}-${hd.getMonth()}-${hd.getDate()}` === dateStr;
        });
        const cardsReviewed = new Set(dayHistories.map(h => h.card_id)).size;
        const durationMs = dayHistories.reduce((sum, h) => sum + (h.review_duration_ms || 0), 0);
        
        days.push({
          date: d.toLocaleDateString("id-ID", { weekday: "short" }),
          cards: cardsReviewed,
          minutes: Math.ceil(durationMs / 60000)
        });
      }
      setActivityData(days);

      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleDeleteProgress = async (cardId: string) => {
    if (!window.confirm("Hapus progress untuk kartu ini?")) return;
    
    await db.progress.where("card_id").equals(cardId).delete();
    await db.history.where("card_id").equals(cardId).delete();
    
    setHistoryItems(prev => prev.filter(h => h.card_id !== cardId));
  };

  const handlePracticeFiltered = () => {
    const cardsToPractice = selectedCards.size > 0 
      ? Array.from(selectedCards)
      : historyItems.map(h => h.card_id);
      
    if (cardsToPractice.length === 0) return;
    
    localStorage.setItem("mykaado_custom_cards", JSON.stringify(cardsToPractice));
    router.push("/flashcard");
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
        <Link href="/flashcard/setup">
          <Button variant="default" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tight">History & Progress</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-8 bg-[var(--color-bg-card)] p-2 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] w-full sm:w-fit">
        <Button 
          variant={activeTab === "log" ? "primary" : "default"}
          onClick={() => setActiveTab("log")}
          className="font-bold flex gap-2 items-center justify-center flex-1"
        >
          <BookOpen className="w-4 h-4" /> Review Log
        </Button>
        <Button 
          variant={activeTab === "progress" ? "primary" : "default"}
          onClick={() => setActiveTab("progress")}
          className="font-bold flex gap-2 items-center justify-center flex-1"
        >
          <BarChart2 className="w-4 h-4" /> Progress
        </Button>
        <Button 
          variant={activeTab === "activity" ? "primary" : "default"}
          onClick={() => setActiveTab("activity")}
          className="font-bold flex gap-2 items-center justify-center flex-1"
        >
          <Activity className="w-4 h-4" /> 7-Day Activity
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "log" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-[var(--color-bg-card)] p-4 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
            <div className="flex gap-2 items-center">
              <span className="font-bold text-sm bg-[var(--color-bg-main)] px-3 py-2 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] whitespace-nowrap">
                Semua Riwayat Kartu
              </span>
            </div>
            <Button variant="primary" onClick={handlePracticeFiltered} disabled={filteredLog.length === 0}>
              <Play className="w-4 h-4 mr-2 fill-current" /> Practice {selectedCards.size > 0 ? `Selected (${selectedCards.size})` : `All (${filteredLog.length})`}
            </Button>
          </div>

          <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] overflow-x-auto shadow-[2px_2px_0px_var(--color-shadow-main)]">
            <div className="max-h-[600px] overflow-y-auto min-w-[600px]">
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
                    <th className="p-3 font-black text-sm uppercase">Rating Terakhir</th>
                    <th className="p-3 font-black text-sm uppercase">Tanggal</th>
                    <th className="p-3 font-black text-sm uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLog.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center font-bold text-[var(--color-text-muted)]">Tidak ada data</td>
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
                      <td className="p-3">
                        {item.rating === 1 && <span className="bg-[var(--color-fsrs-again)] text-[var(--color-bg-main)] px-2 py-1 rounded text-xs font-bold">AGAIN</span>}
                        {item.rating === 2 && <span className="bg-[var(--color-fsrs-hard)] text-[var(--color-bg-main)] px-2 py-1 rounded text-xs font-bold">HARD</span>}
                        {item.rating === 3 && <span className="bg-[var(--color-fsrs-good)] text-[var(--color-bg-main)] px-2 py-1 rounded text-xs font-bold">GOOD</span>}
                        {item.rating === 4 && <span className="bg-[var(--color-fsrs-easy)] text-[var(--color-bg-main)] px-2 py-1 rounded text-xs font-bold">EASY</span>}
                      </td>
                      <td className="p-3 text-sm font-mono font-bold">
                        {new Date(item.reviewed_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="default" size="icon" onClick={() => handleDeleteProgress(item.card_id)} className="text-[var(--color-fsrs-again)] !border-[var(--color-fsrs-again)] hover:bg-[var(--color-fsrs-again)] hover:text-white transition-colors">
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
      )}

      {activeTab === "progress" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progressStats.map(stat => {
            const percentage = stat.total === 0 ? 0 : Math.round((stat.learned / stat.total) * 100);
            return (
              <Card key={stat.id} className="p-6 flex flex-col gap-4 bg-[var(--color-bg-card)]">
                <div className="flex justify-between items-end">
                  <h3 className="text-2xl font-black">{stat.title}</h3>
                  <span className="font-bold text-[var(--color-text-muted)]">{stat.learned} / {stat.total}</span>
                </div>
                <div className="w-full h-8 bg-[var(--color-bg-main)] rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] overflow-hidden flex shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
                  <div 
                    className="h-full bg-[var(--color-fsrs-good)] transition-all duration-1000 border-r-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] flex items-center justify-end px-2"
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 5 && <span className="text-[var(--color-bg-main)] font-black text-xs">{percentage}%</span>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "activity" && (
        <Card className="p-6 bg-[var(--color-bg-card)]">
          <h3 className="text-2xl font-black mb-8 text-center">Aktivitas 7 Hari Terakhir</h3>
          
          <div className="flex flex-col gap-8">
            {/* Chart Cards */}
            <div>
              <h4 className="font-bold text-[var(--color-text-muted)] mb-4 uppercase tracking-wider text-sm text-center md:text-left">Kartu Direview</h4>
              <div className="flex items-end justify-between h-48 gap-2 pb-2 border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)]">
                {activityData.map((day, i) => {
                  const maxCards = Math.max(...activityData.map(d => d.cards), 10); // min 10 for scale
                  const height = `${(day.cards / maxCards) * 100}%`;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full relative flex items-end justify-center h-full">
                        <div 
                          className="w-full max-w-[40px] bg-[var(--color-accent)] rounded-t-[var(--radius-sm)] border-x-[length:var(--bw-sm)] border-t-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] transition-all duration-500 relative"
                          style={{ height }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.cards}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Duration */}
            <div>
              <h4 className="font-bold text-[var(--color-text-muted)] mb-4 uppercase tracking-wider text-sm text-center md:text-left">Durasi Belajar (Menit)</h4>
              <div className="flex items-end justify-between h-48 gap-2 pb-2 border-b-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)]">
                {activityData.map((day, i) => {
                  const maxMins = Math.max(...activityData.map(d => d.minutes), 5); // min 5 for scale
                  const height = `${(day.minutes / maxMins) * 100}%`;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full relative flex items-end justify-center h-full">
                        <div 
                          className="w-full max-w-[40px] bg-[var(--color-fsrs-good)] rounded-t-[var(--radius-sm)] border-x-[length:var(--bw-sm)] border-t-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] transition-all duration-500 relative"
                          style={{ height }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.minutes}m
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
