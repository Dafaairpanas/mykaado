import { FlashcardAction, MouseInputCode, MouseShortcutConfig } from "@/types/shortcuts";

export const STORAGE_KEY_MOUSE_SHORTCUTS = "mykaado_mouse_shortcuts_config";

export const DEFAULT_MOUSE_SHORTCUTS: MouseShortcutConfig = {
  enabled: true,
  preventContextMenu: true,
  scope: "window",
  hideFloatingWidget: false,
  bindings: {
    flip: "mouse:left",
    again: "mouse:back",
    hard: "mouse:middle",
    good: "mouse:wheeldown",
    easy: "mouse:wheelup",
  },
};

export const ACTION_DETAILS: Record<
  FlashcardAction,
  { label: string; description: string; colorClass: string; badge: string }
> = {
  flip: {
    label: "Balik Kartu (Flip)",
    description: "Membuka bagian belakang flashcard",
    colorClass: "bg-[var(--color-bg-nav)] text-[var(--color-text-main)]",
    badge: "FLIP",
  },
  again: {
    label: "Respon: Again",
    description: "Kartu diulang 3x (belum hafal)",
    colorClass: "bg-[#FF7B72] text-[#111]",
    badge: "3x",
  },
  hard: {
    label: "Respon: Hard",
    description: "Kartu diulang 2x (susah)",
    colorClass: "bg-[#F0A07B] text-[#111]",
    badge: "2x",
  },
  good: {
    label: "Respon: Good",
    description: "Kartu diulang 1x (sudah tahu)",
    colorClass: "bg-[#79BFF8] text-[#111]",
    badge: "1x",
  },
  easy: {
    label: "Respon: Easy",
    description: "Kartu selesai dipelajari (sangat hafal)",
    colorClass: "bg-[#7CE38B] text-[#111]",
    badge: "✓",
  },
};

export function getInputLabel(code: MouseInputCode | null | undefined): string {
  if (!code) return "Tidak Ada (Unmapped)";

  switch (code) {
    case "mouse:left":
      return "🖱️ Klik Kiri (Left Click)";
    case "mouse:right":
      return "🖱️ Klik Kanan (Right Click)";
    case "mouse:middle":
      return "🔘 Klik Tengah (Wheel Click)";
    case "mouse:wheelup":
      return "🔼 Scroll ke Atas (Wheel Up)";
    case "mouse:wheeldown":
      return "🔽 Scroll ke Bawah (Wheel Down)";
    case "mouse:back":
      return "◀️ Tombol Samping (Back / X1)";
    case "mouse:forward":
      return "▶️ Tombol Samping (Forward / X2)";
    case "mouse:dblclick":
      return "⚡ Klik Ganda (Double Click)";
    default:
      if (code.startsWith("key:")) {
        const key = code.replace("key:", "");
        if (key === "Space") return "⌨️ Spacebar";
        return `⌨️ Tombol ${key}`;
      }
      return code;
  }
}

export function loadMouseShortcutConfig(): MouseShortcutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MOUSE_SHORTCUTS);
    if (!raw) return DEFAULT_MOUSE_SHORTCUTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MOUSE_SHORTCUTS,
      ...parsed,
      bindings: {
        ...DEFAULT_MOUSE_SHORTCUTS.bindings,
        ...(parsed.bindings || {}),
      },
    };
  } catch {
    return DEFAULT_MOUSE_SHORTCUTS;
  }
}

export function saveMouseShortcutConfig(config: MouseShortcutConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_MOUSE_SHORTCUTS, JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent("mykaado-mouse-shortcuts-updated", { detail: config })
    );
  } catch (e) {
    console.error("Gagal menyimpan konfigurasi shortcut mouse:", e);
  }
}
