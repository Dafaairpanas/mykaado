export type FlashcardAction = "flip" | "again" | "hard" | "good" | "easy";

export type MouseInputCode =
  | "mouse:left"
  | "mouse:middle"
  | "mouse:right"
  | "mouse:back"
  | "mouse:forward"
  | "mouse:wheelup"
  | "mouse:wheeldown"
  | "mouse:dblclick"
  | `key:${string}`;

export interface MouseShortcutConfig {
  enabled: boolean;             // Toggle ON/OFF
  preventContextMenu: boolean;  // Cegah klik kanan default browser
  scope: "window" | "card";     // Seluruh layar atau area kartu
  hideFloatingWidget: boolean;  // Sembunyikan floating widget sepenuhnya
  bindings: Record<FlashcardAction, MouseInputCode | null>;
}
