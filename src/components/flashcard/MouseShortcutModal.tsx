import { useState, useEffect, useCallback, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  MouseShortcutConfig,
  FlashcardAction,
  MouseInputCode,
} from "@/types/shortcuts";
import {
  ACTION_DETAILS,
  getInputLabel,
  DEFAULT_MOUSE_SHORTCUTS,
  saveMouseShortcutConfig,
} from "@/lib/mouse-shortcuts";
import {
  Mouse,
  RotateCcw,
  Check,
  X,
  Power,
  ShieldAlert,
  SlidersHorizontal,
  EyeOff,
} from "lucide-react";

interface MouseShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MouseShortcutConfig;
  onChangeConfig: (newConfig: MouseShortcutConfig) => void;
}

export function MouseShortcutModal({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}: MouseShortcutModalProps) {
  const [recordingAction, setRecordingAction] = useState<FlashcardAction | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);

  const updateConfig = useCallback(
    (updater: (prev: MouseShortcutConfig) => MouseShortcutConfig) => {
      const next = updater(config);
      onChangeConfig(next);
      saveMouseShortcutConfig(next);
    },
    [config, onChangeConfig]
  );

  const handleToggleEnabled = () => {
    updateConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleTogglePreventContextMenu = () => {
    updateConfig((prev) => ({
      ...prev,
      preventContextMenu: !prev.preventContextMenu,
    }));
  };

  const handleToggleHideWidget = () => {
    updateConfig((prev) => ({
      ...prev,
      hideFloatingWidget: !prev.hideFloatingWidget,
    }));
  };

  const handleResetDefaults = () => {
    updateConfig(() => DEFAULT_MOUSE_SHORTCUTS);
    setFeedbackMsg("Pengaturan shortcut telah dikembalikan ke default!");
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleClearBinding = (action: FlashcardAction) => {
    updateConfig((prev) => ({
      ...prev,
      bindings: {
        ...prev.bindings,
        [action]: null,
      },
    }));
  };

  // Mencegah navigasi back browser saat menekan tombol samping di dalam modal
  useEffect(() => {
    if (!isOpen) return;
    const preventSideNav = (e: MouseEvent | PointerEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("mouseup", preventSideNav, { capture: true });
    window.addEventListener("auxclick", preventSideNav, { capture: true });
    window.addEventListener("pointerup", preventSideNav, { capture: true });
    return () => {
      window.removeEventListener("mouseup", preventSideNav, { capture: true });
      window.removeEventListener("auxclick", preventSideNav, { capture: true });
      window.removeEventListener("pointerup", preventSideNav, { capture: true });
    };
  }, [isOpen]);

  // Event listener saat sedang "Merekam" tombol mouse/keyboard
  useEffect(() => {
    if (!isOpen || !recordingAction) return;

    const showFeedback = (label: string) => {
      setFeedbackMsg(`Berhasil merekam: ${label}`);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = window.setTimeout(() => {
        setFeedbackMsg(null);
      }, 2500);
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let inputCode: MouseInputCode | null = null;
      if (e.button === 0) inputCode = "mouse:left";
      else if (e.button === 1) inputCode = "mouse:middle";
      else if (e.button === 2) inputCode = "mouse:right";
      else if (e.button === 3) inputCode = "mouse:back";
      else if (e.button === 4) inputCode = "mouse:forward";

      if (inputCode) {
        const action = recordingAction;
        updateConfig((prev) => ({
          ...prev,
          bindings: {
            ...prev.bindings,
            [action]: inputCode,
          },
        }));
        showFeedback(getInputLabel(inputCode));
        setRecordingAction(null);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const inputCode: MouseInputCode =
        e.deltaY < 0 ? "mouse:wheelup" : "mouse:wheeldown";
      const action = recordingAction;

      updateConfig((prev) => ({
        ...prev,
        bindings: {
          ...prev.bindings,
          [action]: inputCode,
        },
      }));
      showFeedback(getInputLabel(inputCode));
      setRecordingAction(null);
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Selalu cegah menu saat sedang merekam agar klik kanan bisa terekam
      e.preventDefault();
      e.stopPropagation();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setRecordingAction(null);
        setFeedbackMsg("Perekaman dibatalkan");
        setTimeout(() => setFeedbackMsg(null), 1500);
        return;
      }

      // Opsional: Rekam key keyboard juga jika ditekan
      e.preventDefault();
      e.stopPropagation();
      const code: MouseInputCode = `key:${e.code}`;
      const action = recordingAction;
      updateConfig((prev) => ({
        ...prev,
        bindings: {
          ...prev.bindings,
          [action]: code,
        },
      }));
      showFeedback(getInputLabel(code));
      setRecordingAction(null);
    };

    const preventSideButtons = (e: MouseEvent | PointerEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mouseup", preventSideButtons, { capture: true });
    window.addEventListener("auxclick", preventSideButtons, { capture: true });
    window.addEventListener("pointerup", preventSideButtons, { capture: true });
    window.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("mouseup", preventSideButtons, { capture: true });
      window.removeEventListener("auxclick", preventSideButtons, { capture: true });
      window.removeEventListener("pointerup", preventSideButtons, { capture: true });
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isOpen, recordingAction, updateConfig]);

  const actionsList: FlashcardAction[] = ["flip", "easy", "good", "hard", "again"];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setRecordingAction(null);
        onClose();
      }}
      title="Custom Shortcut Mouse & Trackpad"
      className="max-w-xl"
    >
      <div className="space-y-6">
        {/* Master Toggle Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-nav)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-full border-[length:var(--bw-sm)] border-[var(--color-border-main)] ${
                config.enabled
                  ? "bg-[var(--color-accent)] text-[var(--color-btn-text)]"
                  : "bg-gray-400 text-white"
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base">
                Shortcut Mouse {config.enabled ? "Aktif" : "Nonaktif"}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {config.enabled
                  ? "Tombol mouse & scroll dapat digunakan untuk merespon kartu"
                  : "Shortcut dimatikan, mouse berfungsi normal seperti biasa"}
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`px-4 py-2 font-bold text-sm rounded-lg border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] transition-all shadow-[2px_2px_0px_var(--color-shadow-main)] active:translate-x-[1px] active:translate-y-[1px] ${
              config.enabled
                ? "bg-[var(--color-accent)] text-[var(--color-btn-text)]"
                : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)]"
            }`}
          >
            {config.enabled ? "AKTIF" : "MATI"}
          </button>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div className="p-3 bg-[var(--color-accent)] text-[var(--color-btn-text)] rounded-lg text-sm font-bold flex items-center gap-2 border-[length:var(--bw-sm)] border-[var(--color-border-main)] animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Recording active banner */}
        {recordingAction && (
          <div className="p-4 bg-amber-300 text-black rounded-xl border-[length:var(--bw-md)] border-dashed border-black animate-pulse flex flex-col items-center justify-center text-center">
            <div className="font-black text-lg mb-1">
              🎙️ Menunggu Input untuk:{" "}
              {ACTION_DETAILS[recordingAction]?.label}
            </div>
            <p className="text-sm font-semibold opacity-90 mb-3">
              Klik tombol mouse apa saja (Kiri, Kanan, Tengah, Samping) atau Scroll Roda Mouse sekarang.
            </p>
            <button
              onClick={() => setRecordingAction(null)}
              className="px-3 py-1 bg-white text-black font-bold text-xs rounded border border-black shadow-[1px_1px_0px_black]"
            >
              Batal (Tekan Esc)
            </button>
          </div>
        )}

        {/* Action Mapping List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-1">
            <span>Aksi Flashcard</span>
            <span>Tombol yang Dipetakan</span>
          </div>

          {actionsList.map((action) => {
            const detail = ACTION_DETAILS[action];
            const currentBinding = config.bindings[action];
            const isRecording = recordingAction === action;

            return (
              <div
                key={action}
                className={`p-3.5 rounded-xl border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isRecording
                    ? "bg-amber-100 ring-2 ring-amber-500 border-amber-600"
                    : "bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-nav)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-black rounded-md border-[length:var(--bw-sm)] border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)] ${detail.colorClass}`}
                  >
                    {detail.badge}
                  </span>
                  <div>
                    <div className="font-bold text-sm text-[var(--color-text-main)]">
                      {detail.label}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {detail.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border-[length:var(--bw-sm)] ${
                      currentBinding
                        ? "bg-[var(--color-bg-nav)] text-[var(--color-text-main)] border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)]"
                        : "bg-red-50 text-red-500 border-red-200"
                    }`}
                  >
                    {getInputLabel(currentBinding)}
                  </div>

                  {/* Tombol Rekam */}
                  <button
                    onClick={() => setRecordingAction(action)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)] active:translate-x-[1px] active:translate-y-[1px] transition-colors ${
                      isRecording
                        ? "bg-amber-400 text-black animate-pulse"
                        : "bg-[var(--color-accent)] text-[var(--color-btn-text)] hover:opacity-90"
                    }`}
                  >
                    {isRecording ? "Merekam..." : "Rekam"}
                  </button>

                  {/* Tombol Clear */}
                  {currentBinding && (
                    <button
                      onClick={() => handleClearBinding(action)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 rounded hover:bg-[var(--color-bg-nav)] transition-colors"
                      title="Hapus shortcut"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Extra Options */}
        <div className="p-4 rounded-xl bg-[var(--color-bg-nav)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Opsi Tambahan</span>
          </div>

          {/* Prevent Context Menu */}
          <label className="flex items-center justify-between cursor-pointer py-1">
            <div className="pr-4">
              <div className="text-sm font-bold text-[var(--color-text-main)]">
                Blokir Menu Klik Kanan Browser
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Mencegah pop-up menu klik kanan browser agar Klik Kanan bisa digunakan lancar untuk merespon kartu.
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.preventContextMenu}
              onChange={handleTogglePreventContextMenu}
              className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
            />
          </label>

          {/* Hide Floating Widget */}
          <label className="flex items-center justify-between cursor-pointer py-1 border-t border-[var(--color-border-main)]/20 pt-2">
            <div className="pr-4">
              <div className="text-sm font-bold text-[var(--color-text-main)]">
                Sembunyikan Widget Mengambang (HUD)
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Hilangkan tombol melayang di layar flashcard agar belajar 100% fokus tanpa gangguan visual (tetap bisa dibuka via ikon mouse di header).
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.hideFloatingWidget}
              onChange={handleToggleHideWidget}
              className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
            />
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-main)]/20">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] px-2 py-1.5 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default</span>
          </button>

          <Button
            onClick={() => {
              setRecordingAction(null);
              onClose();
            }}
            className="px-6 py-2 bg-[var(--color-accent)] text-[var(--color-btn-text)] font-extrabold border-[length:var(--bw-sm)] border-[var(--color-border-main)] shadow-[2px_2px_0px_var(--color-shadow-main)]"
          >
            Selesai
          </Button>
        </div>
      </div>
    </Modal>
  );
}
