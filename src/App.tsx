import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameStatus, SpinDirection, Tumbler } from './types/game';
import {
  generateCombination,
  generateStartingPosition,
  getShortestDistance,
} from './utils/gameLogic';
import { sound } from './utils/audio';
import { haptics } from './utils/haptics';
import { useRotaryDial } from './hooks/useRotaryDial';
import { WatchDial } from './components/WatchDial';
import { TimerRing } from './components/TimerRing';
import { CenterHub } from './components/CenterHub';
import { ClassroomHUD } from './components/ClassroomHUD';
import { VaultCelebrationModal } from './components/VaultCelebrationModal';
import { GameOverModal } from './components/GameOverModal';
import { DesktopFrame } from './components/DesktopFrame';
import { Volume2, VolumeX, Vibrate } from 'lucide-react';

export default function App() {
  // Game State
  const [level, setLevel] = useState<number>(1);
  const [tumblers, setTumblers] = useState<Tumbler[]>(() => generateCombination());
  const [currentTumblerIndex, setCurrentTumblerIndex] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [totalTime, setTotalTime] = useState<number>(35);

  // Stats & Scoring
  const [safesCracked, setSafesCracked] = useState<number>(0);
  const [twinkiesCollected, setTwinkiesCollected] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('twinkie_vault_high_score') || 0);
  });

  // Settings & HUD
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [isHapticEnabled, setIsHapticEnabled] = useState<boolean>(() => haptics.isEnabled());
  const [isWatchViewport, setIsWatchViewport] = useState<boolean>(false);

  // Feedback State
  const [tensionLevel, setTensionLevel] = useState<'none' | 'warm' | 'aligned'>('none');
  const [wrongDirectionWarning, setWrongDirectionWarning] = useState<boolean>(false);
  const [wrongStreak, setWrongStreak] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  // Hold Timer Reference
  const holdStartTimeRef = useRef<number | null>(null);
  const holdAnimRef = useRef<number | null>(null);

  // Double-tap tracking for Classroom Demo HUD on top status bar
  const lastTopTapTimeRef = useRef<number>(0);

  const currentTumbler = tumblers[currentTumblerIndex];

  // Screen size check for auto watch mode
  useEffect(() => {
    const checkViewport = () => {
      setIsWatchViewport(window.innerWidth <= 480);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  /**
   * Lock in the currently aligned tumbler
   */
  const lockCurrentTumbler = useCallback(() => {
    if (!currentTumbler || currentTumbler.isUnlocked || gameStatus !== 'playing') {
      return;
    }

    sound.playTumblerLock();
    haptics.tumblerLock();

    // Mark current tumbler as unlocked
    const updated = [...tumblers];
    updated[currentTumblerIndex].isUnlocked = true;
    setTumblers(updated);

    // Reset hold
    setHoldProgress(0);
    holdStartTimeRef.current = null;
    if (holdAnimRef.current) cancelAnimationFrame(holdAnimRef.current);

    if (currentTumblerIndex >= 2) {
      // ALL 3 TUMBLERS CRACKED! VAULT OPENED!
      sound.playVaultOpen();
      haptics.vaultUnlocked();
      setGameStatus('cleared');

      setSafesCracked((prev) => {
        const next = prev + 1;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('twinkie_vault_high_score', String(next));
        }
        return next;
      });
      setTwinkiesCollected((prev) => prev + 3);
      setTimeLeft((prev) => Math.min(60, prev + 15));
      setTotalTime((prev) => prev + 15);
    } else {
      // Advance to next tumbler
      setCurrentTumblerIndex((prev) => prev + 1);
      setTensionLevel('none');
    }
  }, [currentTumbler, currentTumblerIndex, gameStatus, tumblers, highScore]);

  /**
   * Rotary Dial Tick Handler
   */
  const handleTick = useCallback(
    (newPos: number, direction: SpinDirection) => {
      if (gameStatus !== 'playing' || !currentTumbler) return;

      const requiredDir = currentTumbler.requiredDirection;

      // Check Direction correctness
      if (direction !== requiredDir) {
        const nextStreak = wrongStreak + 1;
        setWrongStreak(nextStreak);

        if (nextStreak > 2) {
          setWrongDirectionWarning(true);
          sound.playErrorBuzz();
          haptics.errorBuzz();
        } else {
          sound.playTick();
          haptics.tick();
        }

        // Cancel any hold progress
        setHoldProgress(0);
        holdStartTimeRef.current = null;
        if (holdAnimRef.current) cancelAnimationFrame(holdAnimRef.current);
        setTensionLevel('none');
        return;
      }

      // Valid direction: reset wrong streak & warning
      setWrongStreak(0);
      setWrongDirectionWarning(false);

      // Check Gate Alignment or Proximity
      const target = currentTumbler.targetNumber;
      if (newPos === target) {
        // EXACT GATE ALIGNMENT!
        setTensionLevel('aligned');
        sound.playGateClunk();
        haptics.gateAligned();

        // Start 600ms Hold countdown
        holdStartTimeRef.current = performance.now();
        const startHoldLoop = () => {
          if (!holdStartTimeRef.current) return;
          const elapsed = performance.now() - holdStartTimeRef.current;
          const progress = Math.min(1, elapsed / 600);
          setHoldProgress(progress);

          if (progress >= 1) {
            lockCurrentTumbler();
          } else {
            holdAnimRef.current = requestAnimationFrame(startHoldLoop);
          }
        };
        if (holdAnimRef.current) cancelAnimationFrame(holdAnimRef.current);
        holdAnimRef.current = requestAnimationFrame(startHoldLoop);
      } else {
        // Not on target: cancel any ongoing hold
        setHoldProgress(0);
        holdStartTimeRef.current = null;
        if (holdAnimRef.current) cancelAnimationFrame(holdAnimRef.current);

        const dist = getShortestDistance(newPos, target);
        if (dist <= 2) {
          // PROXIMITY / WARM ZONE
          setTensionLevel('warm');
          sound.playWarmZone();
          haptics.warm();
        } else {
          // NORMAL DETENT STEP
          setTensionLevel('none');
          sound.playTick();
          haptics.tick();
        }
      }
    },
    [currentTumbler, gameStatus, lockCurrentTumbler, wrongStreak]
  );

  // Initialize unified rotary dial hook
  const {
    position,
    rotationAngle,
    step,
    setPosition,
    dialRef,
    pointerHandlers,
  } = useRotaryDial({
    initialPosition: generateStartingPosition(tumblers[0].targetNumber),
    onTick: handleTick,
    disabled: gameStatus !== 'playing',
  });

  /**
   * Tap Center Hub Handler: locks tumbler if aligned, or resumes
   */
  const handleTapCenter = useCallback(() => {
    if (gameStatus !== 'playing') return;
    if (tensionLevel === 'aligned') {
      lockCurrentTumbler();
    }
  }, [gameStatus, tensionLevel, lockCurrentTumbler]);

  /**
   * Countdown Timer Loop
   */
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer);
          setGameStatus('gameover');
          sound.playGameOver();
          haptics.errorBuzz();
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameStatus]);

  /**
   * Start Next Level
   */
  const handleNextLevel = () => {
    const nextLevel = level + 1;
    setLevel(nextLevel);
    const newTumblers = generateCombination();
    setTumblers(newTumblers);
    setCurrentTumblerIndex(0);
    setPosition(generateStartingPosition(newTumblers[0].targetNumber));
    setTensionLevel('none');
    setWrongStreak(0);
    setWrongDirectionWarning(false);
    setHoldProgress(0);
    setGameStatus('playing');
  };

  /**
   * Restart Game after Game Over
   */
  const handleRestart = () => {
    setLevel(1);
    setSafesCracked(0);
    setTwinkiesCollected(0);
    const newTumblers = generateCombination();
    setTumblers(newTumblers);
    setCurrentTumblerIndex(0);
    setPosition(generateStartingPosition(newTumblers[0].targetNumber));
    setTimeLeft(35);
    setTotalTime(35);
    setTensionLevel('none');
    setWrongStreak(0);
    setWrongDirectionWarning(false);
    setHoldProgress(0);
    setGameStatus('playing');
  };

  /**
   * Double-tap top status bar to toggle Classroom Demo HUD
   */
  const handleTopStatusBarClick = () => {
    const now = performance.now();
    if (now - lastTopTapTimeRef.current < 400) {
      setIsDemoMode((prev) => !prev);
    }
    lastTopTapTimeRef.current = now;
  };

  const toggleMute = () => {
    setIsMuted(sound.toggleMute());
  };

  const toggleHaptics = () => {
    setIsHapticEnabled(haptics.toggle());
  };

  // INNER CIRCULAR WATCH VIEWPORT CONTENT
  const watchContent = (
    <div
      ref={dialRef}
      {...pointerHandlers}
      className="relative w-full h-full bg-black select-none touch-none overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
      style={{
        clipPath: 'circle(50% at 50% 50%)',
        WebkitClipPath: 'circle(50% at 50% 50%)',
      }}
    >
      {/* TOP INVISIBLE HIT AREA FOR CLASSROOM DOUBLE-TAP */}
      <div
        onClick={handleTopStatusBarClick}
        className="absolute top-0 left-0 right-0 h-14 z-20 cursor-pointer pointer-events-auto"
        title="Double-tap to toggle Classroom Demo HUD"
      />

      {/* LAYER 1: ROTATING SAFE DIAL WITH 24 NOTCHES */}
      <WatchDial
        rotationAngle={rotationAngle}
        currentPosition={position}
        tensionLevel={tensionLevel}
      />

      {/* LAYER 2: CIRCULAR COUNTDOWN TIMER & TENSION ARC */}
      <TimerRing
        timeLeft={timeLeft}
        totalTime={totalTime}
        tensionLevel={tensionLevel}
      />

      {/* LAYER 3: CENTER HUB & TUMBLER READOUT */}
      <CenterHub
        currentPosition={position}
        currentTumbler={currentTumbler}
        currentTumblerIndex={currentTumblerIndex}
        tumblers={tumblers}
        tensionLevel={tensionLevel}
        holdProgress={holdProgress}
        wrongDirectionWarning={wrongDirectionWarning}
        level={level}
        onTapCenter={handleTapCenter}
        gameStatus={gameStatus}
        timeLeft={timeLeft}
      />

      {/* CLASSROOM DEMO HUD (SUBTLE COMBINATION HINT) */}
      <ClassroomHUD
        tumblers={tumblers}
        currentTumblerIndex={currentTumblerIndex}
        isVisible={isDemoMode}
        onToggle={() => setIsDemoMode((prev) => !prev)}
      />

      {/* LEVEL CLEARED / VAULT OPEN CELEBRATION MODAL */}
      {gameStatus === 'cleared' && (
        <VaultCelebrationModal
          level={level}
          bonusTime={15}
          twinkiesAwarded={3}
          onNextLevel={handleNextLevel}
        />
      )}

      {/* GAME OVER / LOCKDOWN MODAL */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          safesCracked={safesCracked}
          twinkiesCollected={twinkiesCollected}
          highScore={highScore}
          onRestart={handleRestart}
        />
      )}

      {/* WATCH QUICK FLOATING AUDIO/HAPTIC INDICATORS */}
      <div className="absolute top-2 right-12 z-20 flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity pointer-events-auto">
        <button
          onClick={toggleMute}
          className="p-1 rounded-full text-slate-400 hover:text-white"
        >
          {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-amber-400" />}
        </button>
        <button
          onClick={toggleHaptics}
          className="p-1 rounded-full text-slate-400 hover:text-white"
        >
          <Vibrate className={`w-3 h-3 ${isHapticEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
        </button>
      </div>
    </div>
  );

  // If running on actual watch / small screen, render edge-to-edge
  if (isWatchViewport) {
    return (
      <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="w-[396px] h-[396px] max-w-full max-h-full aspect-square relative">
          {watchContent}
        </div>
      </div>
    );
  }

  // Otherwise on desktop/tablet, wrap inside Galaxy Watch 4 Classic chassis
  return (
    <DesktopFrame
      onStepCW={() => step('CW')}
      onStepCCW={() => step('CCW')}
      isMuted={isMuted}
      onToggleMute={toggleMute}
      isHapticEnabled={isHapticEnabled}
      onToggleHaptics={toggleHaptics}
      isDemoMode={isDemoMode}
      onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
      onTapCenter={handleTapCenter}
    >
      {watchContent}
    </DesktopFrame>
  );
}
