// Central reactive store for Patient Cognitive Skill Matrix (mElo)
export interface CognitiveSkillMatrix {
  visualMemory: number;     // Smriti Mandir (ICF b1560)
  auditoryRhythm: number;   // Dhwani Tarang (ICF b1670)
  sustainedFocus: number;   // Dhyaan Kendra (ICF b1641)
  routineRecall: number;    // Dainik Dinlipi (ICF b1440)
  overallRating: number;
  lastUpdated?: string;
  lastGameUpdated?: string;
}

const STORAGE_KEY = 'smriti_melo_matrix';

const DEFAULT_MATRIX: CognitiveSkillMatrix = {
  visualMemory: 640,
  auditoryRhythm: 620,
  sustainedFocus: 610,
  routineRecall: 650,
  overallRating: 630,
};

export const meloStore = {
  getMatrix(): CognitiveSkillMatrix {
    if (typeof window === 'undefined') return DEFAULT_MATRIX;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MATRIX));
        return DEFAULT_MATRIX;
      }
      const parsed = JSON.parse(stored);
      return {
        visualMemory: Number(parsed.visualMemory) || DEFAULT_MATRIX.visualMemory,
        auditoryRhythm: Number(parsed.auditoryRhythm) || DEFAULT_MATRIX.auditoryRhythm,
        sustainedFocus: Number(parsed.sustainedFocus) || DEFAULT_MATRIX.sustainedFocus,
        routineRecall: Number(parsed.routineRecall) || DEFAULT_MATRIX.routineRecall,
        overallRating: Number(parsed.overallRating) || DEFAULT_MATRIX.overallRating,
        lastUpdated: parsed.lastUpdated,
        lastGameUpdated: parsed.lastGameUpdated,
      };
    } catch {
      return DEFAULT_MATRIX;
    }
  },

  updateDomain(
    domain: 'visualMemory' | 'auditoryRhythm' | 'sustainedFocus' | 'routineRecall',
    score: number
  ): CognitiveSkillMatrix {
    const current = this.getMatrix();
    // Clamp score within reasonable mElo bounds
    const clampedScore = Math.max(100, Math.min(1500, Math.round(score)));
    
    const updated: CognitiveSkillMatrix = {
      ...current,
      [domain]: clampedScore,
      lastUpdated: new Date().toISOString(),
      lastGameUpdated: domain,
    };
    
    updated.overallRating = Math.round(
      (updated.visualMemory + updated.auditoryRhythm + updated.sustainedFocus + updated.routineRecall) / 4
    );

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('melo_matrix_updated', { detail: updated }));
      } catch (e) {
        console.warn('Failed to persist melo matrix:', e);
      }
    }
    return updated;
  },

  updateFromGame(gameId: string, rating: number): CognitiveSkillMatrix {
    const clean = (gameId || '').toLowerCase().replace(/[\s_-]+/g, '');
    let domain: 'visualMemory' | 'auditoryRhythm' | 'sustainedFocus' | 'routineRecall' = 'visualMemory';
    
    if (clean.includes('dhwani')) {
      domain = 'auditoryRhythm';
    } else if (clean.includes('dhyaan')) {
      domain = 'sustainedFocus';
    } else if (clean.includes('dinlipi')) {
      domain = 'routineRecall';
    } else {
      domain = 'visualMemory';
    }

    return this.updateDomain(domain, rating);
  },

  reset(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MATRIX));
        window.dispatchEvent(new CustomEvent('melo_matrix_updated', { detail: DEFAULT_MATRIX }));
      } catch {}
    }
  }
};
