export const TUTORIAL_STORAGE_KEYS = {
  STEP: 'drum-machine-tutorial-step',
  ACTIVE: 'drum-machine-tutorial-active',
  COMPLETED: 'drum-machine-tutorial-completed',
  SKIPPED: 'drum-machine-tutorial-skipped',
} as const;

export function saveTutorialStep(step: number): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEYS.STEP, String(step));
  } catch {
    // Silently fail if localStorage is unavailable or quota exceeded
  }
}

export function loadTutorialStep(): number {
  try {
    const value = localStorage.getItem(TUTORIAL_STORAGE_KEYS.STEP);
    if (value === null) return 0;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  } catch {
    return 0;
  }
}

export function saveTutorialActive(active: boolean): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEYS.ACTIVE, String(active));
  } catch {
    // Silently fail
  }
}

export function loadTutorialActive(): boolean {
  try {
    const value = localStorage.getItem(TUTORIAL_STORAGE_KEYS.ACTIVE);
    return value === 'true';
  } catch {
    return false;
  }
}

export function saveTutorialCompleted(completed: boolean): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEYS.COMPLETED, String(completed));
  } catch {
    // Silently fail
  }
}

export function loadTutorialCompleted(): boolean {
  try {
    const value = localStorage.getItem(TUTORIAL_STORAGE_KEYS.COMPLETED);
    return value === 'true';
  } catch {
    return false;
  }
}

export function saveTutorialSkipped(skipped: boolean): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEYS.SKIPPED, String(skipped));
  } catch {
    // Silently fail
  }
}

export function loadTutorialSkipped(): boolean {
  try {
    const value = localStorage.getItem(TUTORIAL_STORAGE_KEYS.SKIPPED);
    return value === 'true';
  } catch {
    return false;
  }
}

export function clearTutorialState(): void {
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.STEP);
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.ACTIVE);
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.COMPLETED);
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.SKIPPED);
  } catch {
    // Silently fail
  }
}
