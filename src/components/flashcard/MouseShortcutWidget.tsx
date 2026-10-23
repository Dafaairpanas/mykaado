import { useState } from "react";
import { MouseShortcutConfig } from "@/types/shortcuts";
import { getInputLabel } from "@/lib/mouse-shortcuts";
import {
  Mouse,
  Settings,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Power,
} from "lucide-react";

interface MouseShortcutWidgetProps {
  config: MouseShortcutConfig;
  onToggleEnabled: () => void;
  onOpenSettings: () => void;
}

export function MouseShortcutWidget({
  config,
  onToggleEnabled,
  onOpenSettings,
}: MouseShortcutWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(true);

  // Jika user memilih untuk menyembunyikan floating widget sepenuhnya di pengaturan
  if (config.hideFloatingWidget) {
    return null;
  }

  // Mode Minimalis (Hanya icon kecil mengambang di pojok layar agar bebas distraksi - disembunyikan di mobile)
  if (isMinimized) {
    return (
      <div className="hidden md:block fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[3px_3px_0px_var(--color-shadow-main)] transition-all duration-200 active:translate-x-[1px] active:translate-y-[1px] group ${
            config.enabled
              ? "bg-[var(--color-bg-card)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)]"
              : "bg-gray-200 text-gray-500 opacity-70 hover:opacity-100"
          }`}
          title="Buka Menu Shortcut Mouse"
        >
          <Mouse className="w-4 h-4 text-[var(--color-text-main)]" />
          <span
            className={`w-2 h-2 rounded-full ${
              config.enabled ? "bg-green-500 animate-pulse" : "bg-red-400"
            }`}
          />
          <span className="text-xs font-bold">
            Shortcut {config.enabled ? "ON" : "OFF"}
          </span>
        </button>
      </div>
    );
  }

  // Mode Terbuka (Expanded Dock - disembunyikan di mobile)
  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-40 max-w-[280px] bg-[var(--color-bg-card)] border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] rounded-2xl shadow-[4px_4px_0px_var(--color-shadow-main)] p-3.5 animate-in fade-in zoom-in-95 duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-border-main)]/20">
        <div className="flex items-center gap-2">
          <Mouse className="w-4 h-4 text-[var(--color-text-main)]" />
          <span className="text-xs font-extrabold tracking-wide uppercase">
            Shortcut Mouse
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Tombol Minimize / Hide */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-nav)] transition-colors"
            title="Sembunyikan / Minimize agar tidak mengganggu belajar"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Status & Toggle Switch */}
      <div className="flex items-center justify-between mb-3 bg-[var(--color-bg-nav)] p-2 rounded-xl border border-[var(--color-border-main)]/30">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              config.enabled ? "bg-green-500" : "bg-red-400"
            }`}
          />
          <span className="text-xs font-bold">
            {config.enabled ? "Aktif" : "Nonaktif"}
          </span>
        </div>

        <button
          onClick={onToggleEnabled}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-black rounded-lg border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] transition-all shadow-[1px_1px_0px_var(--color-shadow-main)] active:translate-x-[1px] active:translate-y-[1px] ${
            config.enabled
              ? "bg-[var(--color-accent)] text-[var(--color-btn-text)]"
              : "bg-gray-300 text-gray-700"
          }`}
        >
          <Power className="w-3 h-3" />
          <span>{config.enabled ? "TURN OFF" : "TURN ON"}</span>
        </button>
      </div>

      {/* Quick Summary of Bindings */}
      {config.enabled ? (
        <div className="space-y-1 mb-3 text-[11px] font-medium bg-[var(--color-bg-main)] p-2 rounded-lg border border-[var(--color-border-main)]/10 font-mono">
          <div className="flex justify-between items-center text-[var(--color-text-muted)]">
            <span className="font-sans font-bold">Balik Kartu:</span>
            <span className="text-[var(--color-text-main)] truncate max-w-[140px] text-right">
              {getInputLabel(config.bindings.flip)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[var(--color-text-muted)]">
            <span className="font-sans font-bold text-green-600">Easy (✓):</span>
            <span className="text-[var(--color-text-main)] truncate max-w-[140px] text-right">
              {getInputLabel(config.bindings.easy)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[var(--color-text-muted)]">
            <span className="font-sans font-bold text-blue-500">Good (1x):</span>
            <span className="text-[var(--color-text-main)] truncate max-w-[140px] text-right">
              {getInputLabel(config.bindings.good)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[var(--color-text-muted)]">
            <span className="font-sans font-bold text-amber-500">Hard (2x):</span>
            <span className="text-[var(--color-text-main)] truncate max-w-[140px] text-right">
              {getInputLabel(config.bindings.hard)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-[var(--color-text-muted)] italic text-center py-2 mb-2">
          Shortcut sedang dinonaktifkan
        </div>
      )}

      {/* Setting Button & Hide Hint */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[var(--color-bg-nav)] hover:bg-[var(--color-accent)] hover:text-[var(--color-btn-text)] text-xs font-bold rounded-lg border-[length:var(--bw-sm)] border-solid border-[var(--color-border-main)] shadow-[1px_1px_0px_var(--color-shadow-main)] transition-colors active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Atur Mapping Manual</span>
        </button>
      </div>
    </div>
  );
}
