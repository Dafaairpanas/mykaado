import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FSRSEngine, type ReviewCard } from "@/lib/fsrs-engine";
import { fetchSelectedDecks, fetchAllCardsMap } from "@/lib/data-loader";
import { db } from "@/lib/db";
import { Rating, State } from "ts-fsrs";
import { ArrowLeft, Mouse } from "lucide-react";
import { MouseShortcutWidget } from "@/components/flashcard/MouseShortcutWidget";
import { MouseShortcutModal } from "@/components/flashcard/MouseShortcutModal";
import { MouseShortcutConfig, MouseInputCode } from "@/types/shortcuts";
import { loadMouseShortcutConfig, saveMouseShortcutConfig } from "@/lib/mouse-shortcuts";

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Helper to render Japanese text where Kana is faded if Kanji is present
function renderKanjiWithFadedKana(text: string | undefined | null | boolean) {
  if (typeof text !== 'string' || !text) return null;
  const hasKanji = /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(text);
  if (!hasKanji) return <>{text}</>;

  const parts = text.split(/([\u4E00-\u9FAF\u3400-\u4DBF]+)/);
  
  return (
    <>
      {parts.map((part, i) => {
        if (/^[\u4E00-\u9FAF\u3400-\u4DBF]+$/.test(part)) {
          return <span key={i}>{part}</span>;
        } else if (part) {
          return <span key={i} className="opacity-40">{part}</span>;
        }
        return null;
      })}
    </>
  );
}

// Helper for dynamic Japanese text size based on character length
function getJpFontSizeClass(text: string | undefined | null) {
  if (!text) return "text-4xl sm:text-5xl md:text-6xl leading-tight py-1";
  const len = text.length;
  if (len > 24) return "text-lg sm:text-xl md:text-2xl leading-relaxed py-1";
  if (len > 14) return "text-xl sm:text-2xl md:text-3xl leading-normal py-1";
  if (len > 6) return "text-3xl sm:text-4xl md:text-5xl leading-snug py-1";
  return "text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-snug py-1.5";
}

// Helper for secondary Japanese text (e.g. kana pronunciation)
function getSecondaryJpFontSizeClass(text: string | undefined | null) {
  if (!text) return "text-base sm:text-lg md:text-xl leading-normal";
  const len = text.length;
  if (len > 24) return "text-xs sm:text-sm md:text-base leading-relaxed mt-1";
  if (len > 14) return "text-sm sm:text-base md:text-lg leading-normal mt-1";
  return "text-base sm:text-lg md:text-2xl leading-normal mt-1.5";
}

// Helper for dynamic Indonesian / meaning text size
function getMeaningFontSizeClass(text: string | undefined | null) {
  if (!text) return "text-2xl sm:text-3xl md:text-4xl leading-snug py-1";
  const len = text.length;
  if (len > 60) return "text-sm sm:text-base md:text-lg leading-relaxed py-1";
  if (len > 35) return "text-base sm:text-lg md:text-xl lg:text-2xl leading-snug py-1";
  if (len > 18) return "text-xl sm:text-2xl md:text-3xl leading-snug py-1";
  return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-snug py-1.5";
}

// Helper for rendering data4 (nuance / context explanation)
function renderData4(data4: string | undefined | null) {
  if (!data4 || !data4.trim()) return null;
  return (
    <div className="mt-3 px-3.5 py-2 rounded-xl bg-[var(--color-bg-nav)]/80 border border-[var(--color-border-main)]/30 text-xs sm:text-sm text-[var(--color-text-muted)] font-normal text-center max-w-xl mx-auto leading-relaxed break-words shadow-sm">
      <span className="opacity-90">{data4}</span>
    </div>
  );
}

// We read this from localStorage that was saved in /flashcard/setup
interface FlashcardConfig {
  selectedDecks: string[];
  grades: number[];
  levels: string[];
  studyMode: string;
  hideLabel: boolean;
  isBatchEnabled?: boolean;
  batchSize?: number;
}

export default function FlashcardPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<FlashcardConfig | null>(null);
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [struggledCards, setStruggledCards] = useState<Map<string, ReviewCard>>(new Map());
  const struggledCardsRef = useRef<Map<string, ReviewCard>>(new Map());
  
  // Stats: learned = cards already reviewed, rev = re-queued cards remaining, new = unseen cards remaining
  const [stats, setStats] = useState({ learned: 0, rev: 0 });
  const [mouseConfig, setMouseConfig] = useState<MouseShortcutConfig>(loadMouseShortcutConfig);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const lastWheelTriggerRef = useRef(0);

  const playAudio = useCallback((text: string) => {
    if (!text || typeof window === 'undefined') return;
    if (localStorage.getItem("mykaado_flashcard_muted") === "true") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Audio trigger effect
  useEffect(() => {
    if (cards.length === 0 || currentIndex >= cards.length || !config) return;
    
    const currentCard = cards[currentIndex].card;
    let jpText = "";
    if ("formula_template" in currentCard) {
      jpText = (currentCard as any).title || "";
    } else {
      jpText = ("kana" in currentCard && currentCard.kana) ? currentCard.kana : (currentCard as any).kanji || "";
    }
    if (!jpText) return;

    if (!isFlipped) {
      if (config.studyMode === "Standard" || config.studyMode === "Audio") {
        playAudio(jpText);
      }
    } else {
      if (config.studyMode === "Kanji" || config.studyMode === "Mix" || config.studyMode === "Reverse") {
        playAudio(jpText);
      }
    }
  }, [currentIndex, isFlipped, cards, config, playAudio]);

  // Listener to stop speech when muted
  useEffect(() => {
    const handleMuteToggle = (e: any) => {
      if (e.detail?.isMuted) {
         window.speechSynthesis.cancel();
      }
    };
    window.addEventListener("flashcard-mute-toggle", handleMuteToggle);
    return () => window.removeEventListener("flashcard-mute-toggle", handleMuteToggle);
  }, []);

  const loadSessionCards = useCallback(async () => {
    setIsLoading(true);
    // Baca config baru atau lama (backward compatibility)
    const savedConfig = localStorage.getItem("mykaado_flashcard_config");
    const savedDecksOnly = localStorage.getItem("mykaado_selected_decks");
    const customCardsStr = localStorage.getItem("mykaado_custom_cards");
    
    let parsedConfig: FlashcardConfig;
    
    if (savedConfig) {
      parsedConfig = JSON.parse(savedConfig);
    } else if (savedDecksOnly) {
      parsedConfig = {
        selectedDecks: JSON.parse(savedDecksOnly),
        grades: [1, 2, 3],
        levels: ["ALL"],
        studyMode: "Standard",
        hideLabel: false,
        batchSize: 20
      };
    } else {
      navigate("/flashcard/setup");
      return;
    }
    
    setConfig(parsedConfig);

    if (customCardsStr) {
      const customCardIds: string[] = JSON.parse(customCardsStr);
      const map = await fetchAllCardsMap();
      const customData = customCardIds.map(id => map.get(id)).filter(Boolean);
      
      const now = new Date();
      const dueCards: ReviewCard[] = [];
      const isKanjiDeck = customData.length > 0 && "onyomi" in customData[0];
      const deckType = isKanjiDeck ? "kanji" : "kotoba";

      const progressList = await db.progress.where('card_id').anyOf(customCardIds).toArray();
      const progressMap = new Map(progressList.map(p => [p.card_id, p]));

      for (const card of customData) {
        let progress = progressMap.get(card.id);
        if (!progress) {
          progress = {
            card_id: card.id,
            type: deckType,
            state: State.New,
            due: now,
            stability: 0,
            difficulty: 0,
            elapsed_days: 0,
            scheduled_days: 0,
            reps: 0,
            lapses: 0,
            last_review: null
          };
        }
        dueCards.push({ card, progress, type: deckType });
        dueCards.push({ card, progress, type: deckType }); // Duplicate 2x for Custom Session
      }

      const shuffled = shuffleArray(dueCards);
      const sessionCustomCards = (parsedConfig.batchSize && parsedConfig.batchSize > 0)
        ? shuffled.slice(0, parsedConfig.batchSize)
        : shuffled;

      setCards(sessionCustomCards);
      setCurrentIndex(0);
      struggledCardsRef.current = new Map();
      setStruggledCards(new Map());
      setStats({ learned: 0, rev: 0 });
      setCardStartTime(Date.now());
      setIsLoading(false);
      return;
    }

    const rawData = await fetchSelectedDecks(parsedConfig.selectedDecks);
    
    // Filter data by priority and level before passing to FSRS
    const filteredData = rawData.filter(item => {
      // Filter by Priority / Grade (if priority exists, fallback to 1)
      const itemPriority = "priority" in item ? Number(item.priority) 
                         : "importinity" in item ? Number(item.importinity)
                         : "importantity" in item ? Number(item.importantity)
                         : 1;
      if (parsedConfig.grades.length > 0 && !parsedConfig.grades.includes(itemPriority)) {
        return false;
      }
      
      // Filter by Level
      if (!parsedConfig.levels.includes("ALL")) {
        const itemLevel = item.level || "";
        if (!parsedConfig.levels.includes(itemLevel)) {
          if (itemLevel !== "-" || !parsedConfig.levels.includes("-")) {
              return false;
          }
        }
      }
      
      return true;
    });

    // If Kanji mode, only keep cards that actually contain kanji characters
    const hasKanji = (str: string) => /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(str);
    const finalData = parsedConfig.studyMode === "Kanji"
      ? filteredData.filter(item => "kanji" in item && hasKanji((item as any).kanji || ""))
      : filteredData;

    // Default type to kotoba for FSRS bucket.
    const isKanjiDeck = finalData.length > 0 && "onyomi" in finalData[0];
    const deckType = isKanjiDeck ? "kanji" : "kotoba";

    // PENTING: Acak (randomize) seluruh data kartu dari semua bab terpilih di background terlebih dahulu!
    const randomizedSource = shuffleArray(finalData);

    // Ambil kartu yang siap direview (due / new)
    const dueCards = await FSRSEngine.getDueCards(randomizedSource, deckType, randomizedSource.length);
    
    // Acak kembali due cards secara menyeluruh agar urutan benar-benar bervariasi antar bab
    const thoroughlyRandomized = shuffleArray(dueCards);

    // Terapkan batasan batch jika opsi dicentang/aktif dan > 0
    const isBatchActive = Boolean(parsedConfig.isBatchEnabled && parsedConfig.batchSize && parsedConfig.batchSize > 0);
    const sessionCards = isBatchActive
      ? thoroughlyRandomized.slice(0, parsedConfig.batchSize!)
      : thoroughlyRandomized;

    setCards(sessionCards);
    setCurrentIndex(0);
    struggledCardsRef.current = new Map();
    setStruggledCards(new Map());
    setStats({ learned: 0, rev: 0 });
    setCardStartTime(Date.now());
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadSessionCards();
  }, [loadSessionCards]);

  const handleRate = useCallback(async (rating: Rating) => {
    if (currentIndex >= cards.length) return;
    
    const currentCard = cards[currentIndex];
    const durationMs = Date.now() - cardStartTime;
    const key = (currentCard.card as any).id || (currentCard.card as any).title || (currentCard.card as any).kanji || (currentCard.card as any).kana || JSON.stringify(currentCard.card);
    
    let newUnmasteredState: boolean | undefined = undefined;

    if (rating !== Rating.Easy) {
      newUnmasteredState = true;
      struggledCardsRef.current.set(key, currentCard);
      setStruggledCards(new Map(struggledCardsRef.current));
    } else {
      // Jika kartu ini PERNAH dijawab Again/Hard/Good di sesi ini, jangan di-reset unmastered-nya
      // Hanya jika kartu ini BELUM PERNAH kesulitan di sesi ini, unmastered di-set false
      if (!struggledCardsRef.current.has(key)) {
        newUnmasteredState = false;
      }
    }
    
    await FSRSEngine.rateCard(currentCard, rating, durationMs, newUnmasteredState);
    
    // Flip card back first, then wait for animation to finish before advancing
    setIsFlipped(false);
    
    setTimeout(() => {
      // Determine how many times to re-queue based on rating
      // Again = 3x, Hard = 2x, Good = 1x, Easy = 0 (done)
      const requeueCount = rating === Rating.Again ? 3 
                         : rating === Rating.Hard ? 2 
                         : rating === Rating.Good ? 1 
                         : 0;

      if (requeueCount > 0) {
        setCards(prev => {
          const newCards = [...prev];
          const remaining = newCards.length - (currentIndex + 1);
          
          for (let i = 0; i < requeueCount; i++) {
            // Insert at a random position among the remaining cards (not immediately next)
            // Minimum offset of 3 cards ahead (or fewer if not enough remaining)
            const minOffset = Math.min(3, remaining + i);
            const maxOffset = remaining + i;
            const offset = minOffset + Math.floor(Math.random() * (maxOffset - minOffset + 1));
            const insertAt = currentIndex + 1 + offset;
            newCards.splice(insertAt, 0, currentCard);
          }
          return newCards;
        });
        setStats(s => ({ learned: s.learned + 1, rev: s.rev + requeueCount }));
      } else {
        // Easy → card is done, just count as learned
        setStats(s => ({ ...s, learned: s.learned + 1 }));
      }
      setCurrentIndex(i => i + 1);
      setCardStartTime(Date.now());
    }, 400);
  }, [currentIndex, cards, cardStartTime]);

  // History Shield: Mencegah browser back tak sengaja (misal dari tombol samping mouse / gesture)
  useEffect(() => {
    // Push dummy state agar jika tombol back tertekan, pengguna tidak langsung terlempar keluar
    window.history.pushState({ flashcardShield: true }, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState({ flashcardShield: true }, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cegah navigasi browser back/forward via Alt+Left atau Alt+Right
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
      }

      // Ignore if typing in an input or if shortcut modal is open
      if (isShortcutModalOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const keyInputCode: MouseInputCode = `key:${e.code}`;
      const charInputCode: MouseInputCode = `key:${e.key}`;

      // Default Space key or custom key for flip
      if (e.code === "Space" || (mouseConfig.enabled && (mouseConfig.bindings.flip === keyInputCode || mouseConfig.bindings.flip === charInputCode))) {
        e.preventDefault();
        if (!isFlipped) setIsFlipped(true);
        return;
      }
      
      if (isFlipped) {
        // Again
        if (e.key === "1" || (mouseConfig.enabled && (mouseConfig.bindings.again === keyInputCode || mouseConfig.bindings.again === charInputCode))) {
          e.preventDefault();
          handleRate(Rating.Again);
          return;
        }
        // Hard
        if (e.key === "2" || (mouseConfig.enabled && (mouseConfig.bindings.hard === keyInputCode || mouseConfig.bindings.hard === charInputCode))) {
          e.preventDefault();
          handleRate(Rating.Hard);
          return;
        }
        // Good
        if (e.key === "3" || (mouseConfig.enabled && (mouseConfig.bindings.good === keyInputCode || mouseConfig.bindings.good === charInputCode))) {
          e.preventDefault();
          handleRate(Rating.Good);
          return;
        }
        // Easy
        if (e.key === "4" || (mouseConfig.enabled && (mouseConfig.bindings.easy === keyInputCode || mouseConfig.bindings.easy === charInputCode))) {
          e.preventDefault();
          handleRate(Rating.Easy);
          return;
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleRate, isShortcutModalOpen, mouseConfig]);

  // Mouse & Wheel shortcuts listener
  useEffect(() => {
    if (!mouseConfig.enabled || isShortcutModalOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Jangan trigger jika klik tombol UI, input, link, atau widget
      if (target?.closest("button, input, textarea, a, [role='button'], .mouse-shortcut-widget")) {
        return;
      }

      let inputCode: MouseInputCode | null = null;
      if (e.button === 0) inputCode = "mouse:left";
      else if (e.button === 1) inputCode = "mouse:middle";
      else if (e.button === 2) inputCode = "mouse:right";
      else if (e.button === 3) inputCode = "mouse:back";
      else if (e.button === 4) inputCode = "mouse:forward";

      if (!inputCode) return;

      // Cegah default browser pada middle click & side buttons (autoscroll / browser back)
      if (e.button === 1 || e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.button === 2 && mouseConfig.preventContextMenu) {
        e.preventDefault();
      }

      // Action: Balik Kartu (Flip)
      if (!isFlipped && mouseConfig.bindings.flip === inputCode) {
        e.preventDefault();
        setIsFlipped(true);
        return;
      }

      // Action: Rating respon (saat kartu sudah dibalik)
      if (isFlipped) {
        if (mouseConfig.bindings.again === inputCode) {
          e.preventDefault();
          handleRate(Rating.Again);
          return;
        }
        if (mouseConfig.bindings.hard === inputCode) {
          e.preventDefault();
          handleRate(Rating.Hard);
          return;
        }
        if (mouseConfig.bindings.good === inputCode) {
          e.preventDefault();
          handleRate(Rating.Good);
          return;
        }
        if (mouseConfig.bindings.easy === inputCode) {
          e.preventDefault();
          handleRate(Rating.Easy);
          return;
        }
      }
    };

    // Mencegah browser back / forward navigasi yang dieksekusi browser saat tombol samping dilepas (mouseup/auxclick)
    const handlePreventBrowserNav = (e: MouseEvent | PointerEvent) => {
      if (e.button === 3 || e.button === 4 || e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      // Izinkan scroll jika user sedang membaca isi contoh yang panjang
      if (target?.closest(".custom-scrollbar, pre, code")) return;

      const now = Date.now();
      if (now - lastWheelTriggerRef.current < 250) {
        e.preventDefault();
        return;
      }

      const inputCode: MouseInputCode = e.deltaY < 0 ? "mouse:wheelup" : "mouse:wheeldown";

      if (!isFlipped && mouseConfig.bindings.flip === inputCode) {
        e.preventDefault();
        lastWheelTriggerRef.current = now;
        setIsFlipped(true);
        return;
      }

      if (isFlipped) {
        if (mouseConfig.bindings.easy === inputCode) {
          e.preventDefault();
          lastWheelTriggerRef.current = now;
          handleRate(Rating.Easy);
          return;
        }
        if (mouseConfig.bindings.good === inputCode) {
          e.preventDefault();
          lastWheelTriggerRef.current = now;
          handleRate(Rating.Good);
          return;
        }
        if (mouseConfig.bindings.hard === inputCode) {
          e.preventDefault();
          lastWheelTriggerRef.current = now;
          handleRate(Rating.Hard);
          return;
        }
        if (mouseConfig.bindings.again === inputCode) {
          e.preventDefault();
          lastWheelTriggerRef.current = now;
          handleRate(Rating.Again);
          return;
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (
        mouseConfig.preventContextMenu ||
        Object.values(mouseConfig.bindings).includes("mouse:right")
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mouseup", handlePreventBrowserNav, { capture: true });
    window.addEventListener("auxclick", handlePreventBrowserNav, { capture: true });
    window.addEventListener("pointerup", handlePreventBrowserNav, { capture: true });
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("mouseup", handlePreventBrowserNav, { capture: true });
      window.removeEventListener("auxclick", handlePreventBrowserNav, { capture: true });
      window.removeEventListener("pointerup", handlePreventBrowserNav, { capture: true });
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [mouseConfig, isFlipped, handleRate, isShortcutModalOpen]);

  if (isLoading || !config) {
    return <div className="flex items-center justify-center h-[60vh] font-bold">Memuat kartu...</div>;
  }

  if (currentIndex >= cards.length) {
    const struggledList = Array.from(struggledCardsRef.current.values());
    
    const handleRelearn = () => {
      // Multiply by 2x
      const newCards: ReviewCard[] = [];
      for (const item of struggledList) {
        newCards.push(item);
        newCards.push(item);
      }
      setCards(shuffleArray(newCards));
      setCurrentIndex(0);
      struggledCardsRef.current = new Map();
      setStruggledCards(new Map());
      setStats({ learned: 0, rev: 0 });
      setCardStartTime(Date.now());
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-bold mb-4">Selesai! 🎉</h2>
        <p className="text-[var(--color-text-muted)] mb-8 text-center max-w-md">
          {config?.isBatchEnabled && config?.batchSize && config.batchSize > 0
            ? `Batch sesi ini (${cards.length} kartu) telah selesai direview.`
            : "Anda telah mereview semua kartu yang dijadwalkan hari ini."}
        </p>
        
        {struggledList.length > 0 && (
          <div className="w-full bg-[var(--color-bg-card)] p-6 rounded-[var(--radius-sm)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[4px_4px_0px_var(--color-shadow-main)] mb-8">
            <h3 className="text-xl font-bold mb-4 border-b-2 border-dashed border-[var(--color-border-main)] pb-2 text-center md:text-left">Kartu yang Perlu Diulang ({struggledList.length})</h3>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2 mb-6">
              {struggledList.map((item, idx) => {
                const c = item.card as any;
                const jp = c.title || c.kanji || c.kana;
                return (
                  <div key={idx} className="flex flex-col bg-[var(--color-bg-nav)] p-3 rounded border-[length:var(--bw-sm)] border-[var(--color-border-main)]">
                    <span className="font-bold text-lg jp-text">{renderKanjiWithFadedKana(jp)}</span>
                    <span className="text-sm text-[var(--color-text-muted)]">{c.meaning}</span>
                  </div>
                );
              })}
            </div>
            <Button variant="primary" className="w-full py-6 text-lg font-bold shadow-[2px_2px_0px_var(--color-shadow-main)]" onClick={handleRelearn}>
              Ulangi Kartu Ini (2x)
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          {config?.isBatchEnabled && config?.batchSize && config.batchSize > 0 && (
            <Button 
              variant="primary" 
              className="flex-1 py-4 text-base font-extrabold shadow-[2px_2px_0px_var(--color-shadow-main)]" 
              onClick={() => loadSessionCards()}
            >
              Batch Berikutnya 🎲
            </Button>
          )}
          <Button variant="default" className="flex-1 py-4 text-base font-bold" onClick={() => navigate("/flashcard/setup")}>
            Kembali ke Setup
          </Button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex].card;
  const isKanjiData = "onyomi" in card;
  const isBunpou = "formula_template" in card;
  const studyMode = config.studyMode;
  const data4 = ("data4" in card ? (card as any).data4 : null) as string | undefined | null;

  // Calculate remaining new cards (cards ahead that haven't been seen)
  const remaining = cards.length - currentIndex;
  const newRemaining = remaining - stats.rev;

  // Determine what to render based on studyMode
  let frontContent = null;
  let backContent = null;

  if (isBunpou) {
    const bunpouCard = card as any;
    if (studyMode === "Reverse") {
      frontContent = (
        <div className="w-full flex flex-col items-center justify-center text-center px-2 py-3">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold leading-snug opacity-90 break-words max-w-2xl">
            {bunpouCard.meaning}
          </div>
        </div>
      );
      backContent = (
        <div className="w-full flex flex-col items-center text-center px-2 py-2">
          <div className="text-2xl sm:text-3xl md:text-5xl jp-text mb-3 font-bold text-[var(--color-accent)] leading-tight">
            {renderKanjiWithFadedKana(bunpouCard.title)}
          </div>
          <div className="text-base sm:text-lg md:text-xl text-[var(--color-text-main)] mb-5 font-mono bg-[var(--color-bg-nav)] px-4 py-2.5 rounded-xl border-[length:var(--bw-sm)] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] whitespace-pre-wrap max-w-2xl break-words">
            {bunpouCard.formula_template}
          </div>
          
          {bunpouCard.ui_notes && (
             <div className="text-xs sm:text-sm md:text-base text-[var(--color-text-muted)] mb-5 italic border-l-4 border-[var(--color-accent)] pl-3 text-left max-w-2xl whitespace-pre-wrap leading-relaxed">
               {bunpouCard.ui_notes}
             </div>
          )}

          {bunpouCard.examples && bunpouCard.examples.length > 0 && (
            <div className="w-full max-w-2xl text-left space-y-3 mt-1">
              <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Contoh:</h4>
              <div className="space-y-2.5">
                {bunpouCard.examples.map((ex: any, i: number) => (
                  <div key={i} className="text-xs sm:text-sm md:text-base bg-[var(--color-bg-nav)] p-3 rounded-xl border-[length:var(--bw-sm)] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
                    <div className="jp-text font-bold mb-1 text-[var(--color-text-main)] leading-normal">{ex.jp}</div>
                    <div className="opacity-80 text-[var(--color-text-muted)] leading-relaxed">{ex.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Standard
      frontContent = (
        <div className="w-full flex flex-col items-center justify-center text-center px-2 py-3">
          <div className="text-2xl sm:text-3xl md:text-5xl jp-text mb-5 font-bold leading-tight">
            {renderKanjiWithFadedKana(bunpouCard.title)}
          </div>
          <div className="text-base sm:text-lg md:text-xl text-[var(--color-text-main)] font-mono bg-[var(--color-bg-nav)] px-4 py-2.5 rounded-xl border-[length:var(--bw-sm)] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] whitespace-pre-wrap max-w-2xl break-words">
            {bunpouCard.formula_template}
          </div>
        </div>
      );
      backContent = (
        <div className="w-full flex flex-col items-center text-center px-2 py-2">
          <div className="w-full mb-4 pb-3 border-b-2 border-dashed border-[var(--color-border-main)]/30">
            <div className="text-lg sm:text-xl md:text-2xl font-bold mb-2 leading-snug opacity-90">
              {bunpouCard.meaning}
            </div>
            {bunpouCard.ui_notes && (
              <div className="text-xs sm:text-sm md:text-base text-[var(--color-text-muted)] italic border-l-4 border-[var(--color-accent)] pl-3 text-left max-w-2xl mx-auto whitespace-pre-wrap leading-relaxed mt-2">
                {bunpouCard.ui_notes}
              </div>
            )}
          </div>
          {bunpouCard.examples && bunpouCard.examples.length > 0 && (
            <div className="w-full max-w-2xl text-left space-y-3">
              <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Contoh:</h4>
              <div className="space-y-2.5">
                {bunpouCard.examples.map((ex: any, i: number) => (
                  <div key={i} className="text-xs sm:text-sm md:text-base bg-[var(--color-bg-nav)] p-3 rounded-xl border-[length:var(--bw-sm)] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
                    <div className="jp-text font-bold mb-1 text-[var(--color-text-main)] leading-normal">{ex.jp}</div>
                    <div className="opacity-80 text-[var(--color-text-muted)] leading-relaxed">{ex.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  } else if (studyMode === "Reverse") {
    const meaningText = card.meaning || "";
    const jpText = (card.kanji && card.kanji.trim()) || ("kana" in card && card.kana ? card.kana.trim() : "");
    const rawSubJp = isKanjiData ? (card as any).onyomi : ("kana" in card ? card.kana : "");
    const subJp = rawSubJp && rawSubJp.trim() !== jpText.trim() ? rawSubJp.trim() : "";
    frontContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className={`${getMeaningFontSizeClass(meaningText)} font-bold leading-snug opacity-90 break-words max-w-2xl px-2`}>
          {meaningText}
        </div>
        {renderData4(data4)}
      </div>
    );
    backContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className={`${getJpFontSizeClass(jpText)} jp-text mb-3 text-center break-words max-w-full px-2`}>
          {renderKanjiWithFadedKana(jpText)}
        </div>
        {subJp && (
          <div className={`${getSecondaryJpFontSizeClass(subJp)} text-[var(--color-text-muted)] mb-2 text-center opacity-75 break-words max-w-full px-2`}>
            {subJp}
          </div>
        )}
      </div>
    );
  } else if (studyMode === "Kanji") {
    const jpText = (card.kanji && card.kanji.trim()) || ("kana" in card && card.kana ? card.kana.trim() : "");
    const rawSubJp = "kana" in card ? card.kana : (card as any).onyomi;
    const subJp = rawSubJp && rawSubJp.trim() !== jpText.trim() ? rawSubJp.trim() : "";
    const meaningText = card.meaning || "";
    frontContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className={`${getJpFontSizeClass(jpText)} jp-text text-center break-words max-w-full px-2`}>
          {renderKanjiWithFadedKana(jpText)}
        </div>
      </div>
    );
    backContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        {subJp && (
          <div className={`${getSecondaryJpFontSizeClass(subJp)} jp-text font-normal mb-3 text-center opacity-75 break-words max-w-full px-2`}>
            {subJp}
          </div>
        )}
        <div className={`${getMeaningFontSizeClass(meaningText)} text-[var(--color-text-main)] mb-1 text-center font-semibold opacity-90 break-words max-w-2xl px-2`}>
          {meaningText}
        </div>
        {renderData4(data4)}
      </div>
    );
  } else if (studyMode === "Mix") {
    const jpText = (card.kanji && card.kanji.trim()) ? card.kanji.trim() : ("kana" in card && card.kana ? card.kana.trim() : "");
    const rawSubKana = card.kanji && "kana" in card ? card.kana : "";
    const subKana = rawSubKana && rawSubKana.trim() !== jpText.trim() ? rawSubKana.trim() : "";
    const meaningText = card.meaning || "";
    frontContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className={`${getJpFontSizeClass(jpText)} jp-text text-center break-words max-w-full px-2`}>
          {renderKanjiWithFadedKana(jpText)}
        </div>
      </div>
    );
    backContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        {subKana && (
          <div className={`${getSecondaryJpFontSizeClass(subKana)} jp-text font-normal mb-3 text-center opacity-75 break-words max-w-full px-2`}>
            {subKana}
          </div>
        )}
        <div className={`${getMeaningFontSizeClass(meaningText)} text-[var(--color-text-main)] mb-1 text-center font-semibold opacity-90 break-words max-w-2xl px-2`}>
          {meaningText}
        </div>
        {renderData4(data4)}
      </div>
    );
  } else if (studyMode === "Audio") {
    const jpText = (card.kanji && card.kanji.trim()) || ("kana" in card && card.kana ? card.kana.trim() : "");
    const meaningText = card.meaning || "";
    frontContent = (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--color-accent)] rounded-full flex items-center justify-center shadow-[4px_4px_0px_var(--color-shadow-main)] mb-4 md:mb-6 animate-pulse">
          <span className="text-3xl md:text-4xl">🔊</span>
        </div>
        <p className="font-bold opacity-80 text-sm md:text-base">Dengarkan Audio</p>
      </div>
    );
    backContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className={`${getJpFontSizeClass(jpText)} jp-text mb-3 text-center break-words max-w-full px-2`}>
          {renderKanjiWithFadedKana(jpText)}
        </div>
        <div className={`${getMeaningFontSizeClass(meaningText)} text-[var(--color-text-main)] mb-1 text-center font-semibold opacity-90 break-words max-w-2xl px-2`}>
          {meaningText}
        </div>
        {renderData4(data4)}
      </div>
    );
  } else {
    // Standard Mode (JP -> ID)
    const jpText = (card.kanji && card.kanji.trim()) || ("kana" in card && card.kana ? card.kana.trim() : "");
    const rawSubKana = card.kanji && "kana" in card ? card.kana : "";
    const subKana = rawSubKana && rawSubKana.trim() !== jpText.trim() ? rawSubKana.trim() : "";
    const meaningText = card.meaning || "";
    frontContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className={`${getJpFontSizeClass(jpText)} jp-text text-center break-words max-w-full px-2`}>
          {renderKanjiWithFadedKana(jpText)}
        </div>
        {subKana && (
          <div className={`${getSecondaryJpFontSizeClass(subKana)} text-[var(--color-text-muted)] jp-text font-normal text-center opacity-75 break-words max-w-full px-2`}>
            {subKana}
          </div>
        )}
      </div>
    );
    backContent = (
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className={`${getMeaningFontSizeClass(meaningText)} font-bold mb-2 text-center leading-snug opacity-90 break-words max-w-2xl px-2`}>
          {meaningText}
        </div>
        {"romaji" in card && card.romaji && (
          <div className="text-xs sm:text-sm md:text-base text-[var(--color-text-muted)] text-center font-mono opacity-65 mb-1.5 break-words">
            {card.romaji}
          </div>
        )}
        {renderData4(data4)}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 flex flex-col items-center -mt-4 sm:-mt-6 pb-6">
      {/* Stats Header */}
      <div className="w-full max-w-[840px] flex justify-between items-center mb-2.5 sm:mb-3 font-semibold text-sm px-1">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => navigate("/flashcard/setup")}
            className="flex items-center justify-center p-2 rounded-full bg-[var(--color-bg-nav)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-main)] transition-colors border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[0px_0px_0px_var(--color-shadow-main)] mr-1 md:mr-2"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <span className="text-[var(--color-fsrs-good)] font-bold text-xs sm:text-sm">New: {newRemaining > 0 ? newRemaining : 0}</span>
          <span className="text-[var(--color-fsrs-hard)] font-bold text-xs sm:text-sm">Learn: {stats.learned}</span>
          <span className="text-[var(--color-fsrs-again)] font-bold text-xs sm:text-sm">Rev: {stats.rev}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Pengaturan Shortcut Mouse di Header (hanya untuk PC/desktop) */}
          <button
            onClick={() => setIsShortcutModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-bg-nav)] hover:bg-[var(--color-accent)] hover:text-[var(--color-btn-text)] text-xs font-bold border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] transition-colors active:translate-y-[1px] active:translate-x-[1px]"
            title="Pengaturan Shortcut Mouse"
          >
            <Mouse className="w-3.5 h-3.5" />
            <span
              className={`w-2 h-2 rounded-full ${
                mouseConfig.enabled ? "bg-green-500 animate-pulse" : "bg-red-400"
              }`}
            />
            <span>Shortcut</span>
          </button>

          <span 
            className="text-[var(--color-text-muted)] bg-[var(--color-bg-nav)] px-2.5 py-1 rounded-full font-mono text-xs border border-[var(--color-border-main)]/20 flex items-center gap-1.5"
            title={config?.isBatchEnabled && config?.batchSize && config.batchSize > 0 ? `Sesi Batch: ${config.batchSize} kartu` : "Sesi Semua Kartu"}
          >
            {config?.isBatchEnabled && config?.batchSize && config.batchSize > 0 && (
              <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase">Batch</span>
            )}
            <span>{currentIndex + 1} / {cards.length}</span>
          </span>
        </div>
      </div>

      {/* Flashcard Area */}
      <div 
        className="relative w-full max-w-[840px] h-[calc(100dvh-220px)] min-h-[340px] max-h-[520px] cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div 
          className="w-full h-full absolute transition-all duration-500"
          style={{ 
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
          }}
        >
          {/* Front */}
          <Card 
            className="absolute inset-0 w-full h-full flex flex-col p-0 bg-[var(--color-bg-card)] rounded-[1.5rem] sm:rounded-[2rem] border-[length:var(--bw-md)] shadow-[3px_3px_0px_var(--color-shadow-main)] overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Badges */}
            <div className="absolute top-3 sm:top-3.5 left-4 right-4 flex justify-between items-center pointer-events-none z-20">
              {!config.hideLabel && 'chapter' in card && card.chapter ? (
                <div className="px-2.5 sm:px-3 py-1 bg-[var(--color-bg-nav)] text-[10px] sm:text-xs font-bold rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] pointer-events-auto">
                  {card.chapter}
                </div>
              ) : <div />}
              {!config.hideLabel && card.level && (
                <div className="px-2.5 sm:px-3 py-1 bg-[var(--color-accent)] text-[var(--color-bg-main)] text-[10px] sm:text-xs font-bold rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] pointer-events-auto">
                  {card.level}
                </div>
              )}
            </div>
            
            {/* Front Scroll Area with Safe Centering */}
            <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center px-4 sm:px-8 pt-12 pb-14">
              <div className="my-auto w-full flex flex-col items-center justify-center">
                {frontContent}
              </div>
            </div>

            {!isFlipped && (
              <div className="absolute bottom-3 sm:bottom-3.5 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold text-[var(--color-text-muted)] animate-pulse bg-[var(--color-bg-nav)] px-3 sm:px-4 py-1.5 rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] pointer-events-none z-20">
                TAP TO FLIP
              </div>
            )}
          </Card>

          {/* Back */}
          <Card 
            className="absolute inset-0 w-full h-full flex flex-col p-0 bg-[var(--color-bg-card)] border-[length:var(--bw-md)] rounded-[1.5rem] sm:rounded-[2rem] shadow-[3px_3px_0px_var(--color-shadow-main)] overflow-hidden"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center px-4 sm:px-8 py-5 sm:py-6">
              <div className="my-auto w-full flex flex-col items-center justify-center">
                {backContent}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`mt-3 sm:mt-4 w-full max-w-[840px] flex gap-2 sm:gap-3 transition-all duration-300 ${isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <button 
          onClick={() => handleRate(Rating.Again)}
          className="flex-1 py-2 sm:py-2.5 md:py-3.5 rounded-[var(--radius-sm)] font-extrabold text-sm sm:text-base md:text-xl border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] sm:shadow-[3px_3px_0px_var(--color-shadow-main)] transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0px_var(--color-shadow-main)] bg-[#FF7B72] text-[#111]"
        >
          AGAIN <span className="block text-[10px] sm:text-xs font-bold opacity-80 mt-0.5">3x</span>
        </button>
        <button 
          onClick={() => handleRate(Rating.Hard)}
          className="flex-1 py-2 sm:py-2.5 md:py-3.5 rounded-[var(--radius-sm)] font-extrabold text-sm sm:text-base md:text-xl border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] sm:shadow-[3px_3px_0px_var(--color-shadow-main)] transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0px_var(--color-shadow-main)] bg-[#F0A07B] text-[#111]"
        >
          HARD <span className="block text-[10px] sm:text-xs font-bold opacity-80 mt-0.5">2x</span>
        </button>
        <button 
          onClick={() => handleRate(Rating.Good)}
          className="flex-1 py-2 sm:py-2.5 md:py-3.5 rounded-[var(--radius-sm)] font-extrabold text-sm sm:text-base md:text-xl border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] sm:shadow-[3px_3px_0px_var(--color-shadow-main)] transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0px_var(--color-shadow-main)] bg-[#79BFF8] text-[#111]"
        >
          GOOD <span className="block text-[10px] sm:text-xs font-bold opacity-80 mt-0.5">1x</span>
        </button>
        <button 
          onClick={() => handleRate(Rating.Easy)}
          className="flex-1 py-2 sm:py-2.5 md:py-3.5 rounded-[var(--radius-sm)] font-extrabold text-sm sm:text-base md:text-xl border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] sm:shadow-[3px_3px_0px_var(--color-shadow-main)] transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0px_var(--color-shadow-main)] bg-[#7CE38B] text-[#111]"
        >
          EASY <span className="block text-[10px] sm:text-xs font-bold opacity-80 mt-0.5">✓</span>
        </button>
      </div>

      {/* Mouse Shortcut Floating Widget (bisa diminimize / dihide) */}
      <MouseShortcutWidget
        config={mouseConfig}
        onToggleEnabled={() => {
          const next = { ...mouseConfig, enabled: !mouseConfig.enabled };
          setMouseConfig(next);
          saveMouseShortcutConfig(next);
        }}
        onOpenSettings={() => setIsShortcutModalOpen(true)}
      />

      {/* Mouse Shortcut Settings Modal (Manual Mapping) */}
      <MouseShortcutModal
        isOpen={isShortcutModalOpen}
        onClose={() => setIsShortcutModalOpen(false)}
        config={mouseConfig}
        onChangeConfig={(newCfg) => setMouseConfig(newCfg)}
      />
    </div>
  );
}
