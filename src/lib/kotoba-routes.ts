import { KOTOBA_SOURCES } from "./data-loader";

export interface KotobaRouteInfo {
  isChapterView: boolean;
  chapterId: string | null;
  activeTab: "minna" | "irodori" | "n3";
  sourceId: string | null;
  isNotFound: boolean;
}

/**
 * Normalizes an incoming source URL slug to its internal source id in KOTOBA_SOURCES.
 * E.g. "irodoria2-2", "irodori-a2-2", "irodori_a2_2" -> "irodori_a2_2"
 */
export function normalizeSourceSlug(rawSlug: string): string | null {
  const s = rawSlug.toLowerCase().trim();

  // Irodori A1
  if (
    s === "irodoria1" ||
    s === "irodori-a1" ||
    s === "irodori_a1" ||
    s === "ir-a1" ||
    s === "ir_a1" ||
    s === "a1"
  ) {
    return "irodori_a1";
  }

  // Irodori A2-1
  if (
    s === "irodoria2-1" ||
    s === "irodori-a2-1" ||
    s === "irodori_a2_1" ||
    s === "irodoria21" ||
    s === "ir-a2-1" ||
    s === "ir_a2_1" ||
    s === "a2-1" ||
    s === "a21"
  ) {
    return "irodori_a2_1";
  }

  // Irodori A2-2
  if (
    s === "irodoria2-2" ||
    s === "irodori-a2-2" ||
    s === "irodori_a2_2" ||
    s === "irodoria22" ||
    s === "ir-a2-2" ||
    s === "ir_a2_2" ||
    s === "a2-2" ||
    s === "a22"
  ) {
    return "irodori_a2_2";
  }

  // Minna
  if (
    s === "minna" ||
    s === "minna-no-nihongo" ||
    s === "minnano-nihongo" ||
    s === "minna_no_nihongo" ||
    s === "mnh"
  ) {
    return "minna";
  }

  // Sou N3
  if (
    s === "n3" ||
    s === "sou-n3" ||
    s === "soun3" ||
    s === "sou_n3" ||
    s === "soumatome-n3" ||
    s === "jlpt-n3" ||
    s === "n3-migrated"
  ) {
    return "n3";
  }

  return null;
}

/**
 * Returns canonical source URL slug for a given source id.
 * E.g. "irodori_a2_2" -> "irodoria2-2"
 */
export function getKotobaSourceSlug(sourceId: string): string {
  switch (sourceId) {
    case "irodori_a1":
      return "irodoria1";
    case "irodori_a2_1":
      return "irodoria2-1";
    case "irodori_a2_2":
      return "irodoria2-2";
    case "minna":
      return "minna";
    case "n3":
      return "n3";
    default:
      return sourceId;
  }
}

/**
 * Maps a source id or tab slug to the main UI tab ("minna" | "irodori" | "n3").
 */
export function getKotobaTab(sourceOrTab: string): "minna" | "irodori" | "n3" {
  const s = sourceOrTab.toLowerCase().trim();
  if (s.startsWith("irodori") || s.startsWith("ir_") || s.startsWith("ir-") || s === "a1" || s.startsWith("a2")) {
    return "irodori";
  }
  if (s === "n3" || s.includes("n3")) {
    return "n3";
  }
  return "minna";
}

/**
 * Generates the canonical URL for a chapter id (e.g. "ir_a2_2_06" -> "/kotoba/irodoria2-2/6").
 */
export function getKotobaChapterUrl(chapterId: string): string {
  for (const source of KOTOBA_SOURCES) {
    const ch = source.chapters.find((c) => c.id === chapterId);
    if (ch) {
      const sourceSlug = getKotobaSourceSlug(source.id);
      const match = ch.id.match(/(\d+)$/);
      const num = match ? parseInt(match[1], 10) : parseInt(ch.label.replace(/\D/g, ""), 10);
      return `/kotoba/${sourceSlug}/${num}`;
    }
  }
  return "/kotoba";
}

/**
 * Resolves the router parameters into chapter and tab state.
 */
export function resolveKotobaRoute(
  sourceParam?: string,
  chapterParam?: string,
  queryTabParam?: string | null
): KotobaRouteInfo {
  // If no sourceParam was given at all (e.g. "/kotoba" or "/kotoba?tab=irodori")
  if (!sourceParam) {
    const tab = queryTabParam ? getKotobaTab(queryTabParam) : "minna";
    return {
      isChapterView: false,
      chapterId: null,
      activeTab: tab,
      sourceId: null,
      isNotFound: false,
    };
  }

  // If sourceParam is provided but NO chapterParam (e.g. "/kotoba/irodori", "/kotoba/minna", "/kotoba/irodoria2-2")
  if (!chapterParam) {
    const tab = getKotobaTab(sourceParam);
    return {
      isChapterView: false,
      chapterId: null,
      activeTab: tab,
      sourceId: normalizeSourceSlug(sourceParam),
      isNotFound: false,
    };
  }

  // Both sourceParam and chapterParam are present (e.g. "/kotoba/irodoria2-2/6")
  const sourceId = normalizeSourceSlug(sourceParam);
  if (!sourceId) {
    return {
      isChapterView: true,
      chapterId: null,
      activeTab: getKotobaTab(sourceParam),
      sourceId: null,
      isNotFound: true,
    };
  }

  const cleanNum = parseInt(chapterParam.replace(/\D/g, ""), 10);
  if (isNaN(cleanNum)) {
    return {
      isChapterView: true,
      chapterId: null,
      activeTab: getKotobaTab(sourceId),
      sourceId,
      isNotFound: true,
    };
  }

  const pad = String(cleanNum).padStart(2, "0");
  const source = KOTOBA_SOURCES.find((s) => s.id === sourceId);

  if (!source) {
    return {
      isChapterView: true,
      chapterId: null,
      activeTab: getKotobaTab(sourceId),
      sourceId,
      isNotFound: true,
    };
  }

  const chapter = source.chapters.find((ch) => {
    if (ch.id.endsWith(`_${pad}`)) return true;
    const labelNum = parseInt(ch.label.replace(/\D/g, ""), 10);
    return labelNum === cleanNum;
  });

  if (!chapter) {
    return {
      isChapterView: true,
      chapterId: null,
      activeTab: getKotobaTab(sourceId),
      sourceId,
      isNotFound: true,
    };
  }

  return {
    isChapterView: true,
    chapterId: chapter.id,
    activeTab: getKotobaTab(sourceId),
    sourceId,
    isNotFound: false,
  };
}
