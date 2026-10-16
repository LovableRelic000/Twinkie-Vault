import type { Tumbler, SpinDirection } from '../types/game';

export const TOTAL_NOTCHES = 24;
export const STEP_DEGREES = 360 / TOTAL_NOTCHES; // 15 degrees per click

/**
 * Calculates the shortest circular distance between two dial positions (0 to 23).
 * Return value is between 0 and 12.
 */
export function getShortestDistance(posA: number, posB: number): number {
  const diff = Math.abs(posA - posB);
  return Math.min(diff, TOTAL_NOTCHES - diff);
}

/**
 * Calculates the directional distance from current to target when moving in `dir`.
 * Returns a value from 0 to 23.
 * 0 means current === target.
 */
export function getDirectionalDistance(current: number, target: number, dir: SpinDirection): number {
  if (dir === 'CW') {
    return (target - current + TOTAL_NOTCHES) % TOTAL_NOTCHES;
  } else {
    return (current - target + TOTAL_NOTCHES) % TOTAL_NOTCHES;
  }
}

/**
 * Generates a valid 3-tumbler combination where consecutive numbers
 * are at least 4 steps apart circularly.
 * - Tumbler 1: CW
 * - Tumbler 2: CCW
 * - Tumbler 3: CW
 */
export function generateCombination(): Tumbler[] {
  // Random integer in [0, TOTAL_NOTCHES - 1]
  const randomNum = () => Math.floor(Math.random() * TOTAL_NOTCHES);

  const t1 = randomNum();

  // Find t2 at least 4 notches away from t1
  let t2 = randomNum();
  while (getShortestDistance(t1, t2) < 4) {
    t2 = randomNum();
  }

  // Find t3 at least 4 notches away from t2
  let t3 = randomNum();
  while (getShortestDistance(t2, t3) < 4) {
    t3 = randomNum();
  }

  return [
    {
      id: 0,
      targetNumber: t1,
      requiredDirection: 'CW',
      isUnlocked: false,
    },
    {
      id: 1,
      targetNumber: t2,
      requiredDirection: 'CCW',
      isUnlocked: false,
    },
    {
      id: 2,
      targetNumber: t3,
      requiredDirection: 'CW',
      isUnlocked: false,
    },
  ];
}

/**
 * Selects an initial dial position that isn't already sitting on T1.
 */
export function generateStartingPosition(target: number): number {
  let start = Math.floor(Math.random() * TOTAL_NOTCHES);
  while (getShortestDistance(start, target) < 4) {
    start = (start + 5) % TOTAL_NOTCHES;
  }
  return start;
}
