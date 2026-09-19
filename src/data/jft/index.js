// Helper untuk memuat dan mengelola data batch simulasi JFT
const batchModules = import.meta.glob('/src/data/jft/batch-*.json', { eager: true });

/**
 * Mengambil semua batch simulasi JFT yang tersedia
 * Diurutkan berdasarkan ID atau urutan file
 */
export function getAllBatches() {
  const batches = [];

  for (const path in batchModules) {
    const mod = batchModules[path];
    const data = mod?.default || mod;
    
    // Support either flat questions array OR sections array
    let allQuestions = [];
    if (data && Array.isArray(data.questions)) {
      allQuestions = data.questions;
    } else if (data && Array.isArray(data.sections)) {
      data.sections.forEach(sec => {
        if (Array.isArray(sec.questions)) {
          allQuestions = allQuestions.concat(sec.questions);
        }
      });
    }

    if (data && data.id && allQuestions.length > 0) {
      batches.push({
        id: data.id,
        title: data.title || `Simulasi JFT (${data.id})`,
        description: data.description || 'Latihan simulasi ujian JFT-Basic.',
        timeLimitMinutes: typeof data.timeLimitMinutes === 'number' ? data.timeLimitMinutes : (typeof data.durationMinutes === 'number' ? data.durationMinutes : 60),
        passingScorePercent: typeof data.passingScorePercent === 'number' ? data.passingScorePercent : (typeof data.passingScore === 'number' ? data.passingScore : 60),
        questionCount: allQuestions.length,
        filePath: path
      });
    }
  }

  // Urutkan berdasarkan id secara alami (misal batch-01, batch-02)
  return batches.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/**
 * Mengambil data lengkap satu batch berdasarkan batchId
 */
export function getBatchById(batchId) {
  for (const path in batchModules) {
    const mod = batchModules[path];
    const data = mod?.default || mod;
    if (data && data.id === batchId) {
      // Normalize sections into flat questions array for the page engine
      if (!data.questions && Array.isArray(data.sections)) {
        const flatQuestions = [];
        data.sections.forEach(sec => {
          if (Array.isArray(sec.questions)) {
            sec.questions.forEach(q => {
              flatQuestions.push({
                ...q,
                category: q.category || sec.title
              });
            });
          }
        });
        data.questions = flatQuestions;
        data.timeLimitMinutes = data.timeLimitMinutes || data.durationMinutes || 60;
        data.passingScorePercent = data.passingScorePercent || data.passingScore || 60;
      }
      return data;
    }
  }
  return null;
}
