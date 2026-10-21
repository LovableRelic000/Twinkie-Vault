export type SpinDirection = 'CW' | 'CCW';

export interface Tumbler {
  id: number;
  targetNumber: number;
  requiredDirection: SpinDirection;
  isUnlocked: boolean;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export type GameStatus = 'start' | 'ready' | 'playing' | 'cleared' | 'gameover';

export interface GameStats {
  safesCracked: number;
  twinkiesCollected: number;
  highScore: number;
  cleanCracks: number;
}

export interface RotaryDialState {
  currentPosition: number; // 0 to 23
  rotationAngle: number;   // Smooth or discrete degrees for SVG transform
  lastDirection: SpinDirection | null;
  wrongDirectionStreak: number;
}
