import { useState, useEffect, useRef, useCallback } from 'react';
import type { SpinDirection } from '../types/game';
import { TOTAL_NOTCHES, STEP_DEGREES } from '../utils/gameLogic';

interface UseRotaryDialOptions {
  initialPosition?: number;
  onTick?: (newPosition: number, direction: SpinDirection) => void;
  disabled?: boolean;
}

export function useRotaryDial({
  initialPosition = 0,
  onTick,
  disabled = false,
}: UseRotaryDialOptions) {
  const [position, setPositionState] = useState<number>(initialPosition);
  const [rotationAngle, setRotationAngle] = useState<number>(-initialPosition * STEP_DEGREES);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // References to keep event handlers fresh without re-subscribing
  const posRef = useRef<number>(initialPosition);
  posRef.current = position;

  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  // 45ms debounce cooldown tracking
  const lastWheelTimeRef = useRef<number>(0);
  const lastBezelTimeRef = useRef<number>(0);

  // Pointer drag tracking
  const dialRef = useRef<HTMLDivElement | null>(null);
  const lastPointerAngleRef = useRef<number | null>(null);
  const accumulatedPointerAngleRef = useRef<number>(0);

  /**
   * Internal step trigger: increments (+1 CW) or decrements (-1 CCW)
   */
  const step = useCallback((dir: SpinDirection | number) => {
    if (disabledRef.current) return;

    const direction: SpinDirection =
      typeof dir === 'string' ? dir : dir > 0 ? 'CW' : 'CCW';

    const delta = direction === 'CW' ? 1 : -1;
    const newPos = (posRef.current + delta + TOTAL_NOTCHES) % TOTAL_NOTCHES;

    posRef.current = newPos;
    setPositionState(newPos);

    // Continuous visual rotation: CW spin rotates dial by -15deg so number aligns with top notch
    setRotationAngle((prev) => prev - delta * STEP_DEGREES);

    if (onTickRef.current) {
      onTickRef.current(newPos, direction);
    }
  }, []);

  /**
   * Directly set dial position (e.g. for new level setup)
   */
  const setPosition = useCallback((newPos: number) => {
    const clamped = (newPos % TOTAL_NOTCHES + TOTAL_NOTCHES) % TOTAL_NOTCHES;
    posRef.current = clamped;
    setPositionState(clamped);
    setRotationAngle(-clamped * STEP_DEGREES);
  }, []);

  /**
   * 1. Physical Bezel & Desktop Mouse Wheel Listener
   * Non-passive event with 45ms cooldown to prevent scroll acceleration skipping
   */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Allow wheeling anywhere inside the app or dial
      e.preventDefault();
      if (disabledRef.current) return;

      const now = performance.now();
      if (now - lastWheelTimeRef.current < 45) {
        return;
      }

      // Discrete scroll notch detection
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      if (delta === 0) return;

      lastWheelTimeRef.current = now;
      const direction: SpinDirection = delta > 0 ? 'CW' : 'CCW';
      step(direction);
    };

    // Attach non-passive listener to window
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [step]);

  /**
   * 2. Native Wear OS Bezel Custom Event Listener ('watch-bezel')
   * Dispatched from Android MainActivity.java / MainActivity.kt bridge
   */
  useEffect(() => {
    const handleWatchBezel = (e: Event) => {
      if (disabledRef.current) return;

      const customEvent = e as CustomEvent<{ direction?: number }>;
      const dirVal = customEvent.detail?.direction ?? 1;

      const now = performance.now();
      if (now - lastBezelTimeRef.current < 40) {
        return;
      }
      lastBezelTimeRef.current = now;

      step(dirVal > 0 ? 'CW' : 'CCW');
    };

    window.addEventListener('watch-bezel', handleWatchBezel);
    return () => {
      window.removeEventListener('watch-bezel', handleWatchBezel);
    };
  }, [step]);

  /**
   * 3. Keyboard Arrow Keys Listener (Left/Down = CCW, Right/Up = CW)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabledRef.current) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        step('CW');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        step('CCW');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [step]);

  /**
   * 4. Circular Touch-Drag Fallback Handlers
   * Calculates atan2(y - centerY, x - centerX) with 15deg threshold
   */
  const calculatePointerAngle = (clientX: number, clientY: number): number | null => {
    if (!dialRef.current) return null;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    return rad * (180 / Math.PI); // -180 to 180 degrees
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabledRef.current) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const angle = calculatePointerAngle(e.clientX, e.clientY);
    lastPointerAngleRef.current = angle;
    accumulatedPointerAngleRef.current = 0;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabledRef.current || lastPointerAngleRef.current === null) {
      return;
    }

    const currentAngle = calculatePointerAngle(e.clientX, e.clientY);
    if (currentAngle === null) return;

    let delta = currentAngle - lastPointerAngleRef.current;

    // Normalize boundary crossing (-180 to 180 jump)
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    lastPointerAngleRef.current = currentAngle;
    accumulatedPointerAngleRef.current += delta;

    // Every 15 degrees of accumulated rotation steps the dial by 1 notch
    while (accumulatedPointerAngleRef.current >= STEP_DEGREES) {
      accumulatedPointerAngleRef.current -= STEP_DEGREES;
      step('CW');
    }

    while (accumulatedPointerAngleRef.current <= -STEP_DEGREES) {
      accumulatedPointerAngleRef.current += STEP_DEGREES;
      step('CCW');
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    lastPointerAngleRef.current = null;
    accumulatedPointerAngleRef.current = 0;
    setIsDragging(false);
  };

  return {
    position,
    rotationAngle,
    isDragging,
    step,
    setPosition,
    dialRef,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}
