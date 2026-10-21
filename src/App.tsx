import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameStatus, SpinDirection, Tumbler, Difficulty } from './types/game';
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
import { StartScreen } from './components/StartScreen';
import { Volume2, VolumeX, Vibrate } from 'lucide-react';

const DIFFICULTY_CONFIG: Record<Difficulty, { baseTime: number; proximityDistance: number }> = {
  easy: { baseTime: 45, proximityDistance: 2 },
  normal: { baseTime: 35, proximityDistance: 2 },
  hard: { baseTime: 22, proximityDistance: 1 },
};

export default function App() {
  // Difficulty & Start State
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [gameStatus, setGameStatus] = useState<GameStatus>('start');

  const getStoredHighScore = useCallback((diff: Difficulty) => {
    const val = localStorage.getItem(`twinkie_vault_high_score_${diff}`);
    if (val !== null) return Number(val);
    if (diff === 'normal') {
      return Number(localStorage.getItem('twinkie_vault_high_score') || 0);
    }
    return 0;
  }, []);

  const [highScore, setHighScore] = useState<number>(() => getStoredHighScore('normal'));

  // Game State
  const [level, setLevel] = useState<number>(1);
  const [tumblers, setTumblers] = useState<Tumbler[]>(() => generateCombination());
  const [currentTumblerIndex, setCurrentTumblerIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [totalTime, setTotalTime] = useState<number>(35);

  // Stats & Scoring
  const [safesCracked, setSafesCracked] = useState<number>(0);
  const [twinkiesCollected, setTwinkiesCollected] = useState<number>(0);
  const [lifetimeTwinkies, setLifetimeTwinkies] = useState<number>(() => {
    return Number(localStorage.getItem('twinkie_vault_lifetime_twinkies') || 0);
  });

  // Helper to detect if running on smartwatch or small screen
  const isWatchEnvironment = () => {
    if (typeof window === 'undefined') return true;
    if ((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) {
      return true;
    }
    return window.innerWidth <= 550;
  };

  // Settings & HUD
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [isHapticEnabled, setIsHapticEnabled] = useState<boolean>(() => haptics.isEnabled());
  const [isWatchViewport, setIsWatchViewport] = useState<boolean>(isWatchEnvironment);

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
      setIsWatchViewport(isWatchEnvironment());
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  /**
   * Back / Stop Session Handler
   */
  const handleBackToStart = useCallback(() => {
    sound.playTick();
    haptics.tick();
    setGameStatus('start');
    setTensionLevel('none');
    setWrongStreak(0);
    setWrongDirectionWarning(false);
    setHoldProgress(0);
  }, []);

  // Listen to Escape / Backspace keys to stop session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (gameStatus !== 'start') {
          handleBackToStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleBackToStart]);

  /**
   * Difficulty selection handler
   */
  const handleSelectDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setHighScore(getStoredHighScore(diff));
    sound.playTick();
    haptics.tick();
  }, [getStoredHighScore]);

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
          localStorage.setItem(`twinkie_vault_high_score_${difficulty}`, String(next));
          localStorage.setItem('twinkie_vault_high_score', String(next));
        }
        return next;
      });
      setTwinkiesCollected((prev) => prev + 3);
      setLifetimeTwinkies((prev) => {
        const next = prev + 3;
        localStorage.setItem('twinkie_vault_lifetime_twinkies', String(next));
        return next;
      });
    } else {
      // Advance to next tumbler
      setCurrentTumblerIndex((prev) => prev + 1);
      setTensionLevel('none');
    }
  }, [currentTumbler, currentTumblerIndex, gameStatus, tumblers, highScore, difficulty]);

  /**
   * Rotary Dial Tick Handler
   */
  const handleTick = useCallback(
    (newPos: number, direction: SpinDirection) => {
      // If on Start Screen, rotating bezel switches difficulty mode!
      if (gameStatus === 'start') {
        const diffList: Difficulty[] = ['easy', 'normal', 'hard'];
        const curIdx = diffList.indexOf(difficulty);
        const nextIdx = direction === 'CW' ? (curIdx + 1) % 3 : (curIdx - 1 + 3) % 3;
        handleSelectDifficulty(diffList[nextIdx]);
        return;
      }

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

      // Reset wrong streak on valid spin
      setWrongStreak(0);
      setWrongDirectionWarning(false);

      const target = currentTumbler.targetNumber;

      // EXACT GATE ALIGNMENT!
      if (newPos === target) {
        setTensionLevel('aligned');
        sound.playGateClunk();
        haptics.gateAligned();

        // Start 600ms Radial Hold-To-Lock progress animation
        holdStartTimeRef.current = performance.now();

        const animateHold = (now: number) => {
          if (!holdStartTimeRef.current) return;
          const elapsed = now - holdStartTimeRef.current;
          const progress = Math.min(1, elapsed / 600);
          setHoldProgress(progress);

          if (progress >= 1) {
            lockCurrentTumbler();
          } else {
            holdAnimRef.current = requestAnimationFrame(animateHold);
          }
        };

        if (holdAnimRef.current) cancelAnimationFrame(holdAnimRef.current);
        holdAnimRef.current = requestAnimationFrame(animateHold);
      } else {
        // Not on target: cancel any ongoing hold
        setHoldProgress(0);
        holdStartTimeRef.current = null;
        if (holdAnimRef.current) cancelAnimationFrame(holdAnimRef.current);

        const dist = getShortestDistance(newPos, target);
        const proximityThreshold = DIFFICULTY_CONFIG[difficulty].proximityDistance;

        if (dist <= proximityThreshold) {
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
    [currentTumbler, gameStatus, lockCurrentTumbler, wrongStreak, difficulty, handleSelectDifficulty]
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
    disabled: gameStatus !== 'playing' && gameStatus !== 'start',
  });

  /**
   * Start New Game from Start Screen
   */
  const handleStartGame = () => {
    const base = DIFFICULTY_CONFIG[difficulty].baseTime;
    setTimeLeft(base);
    setTotalTime(base);
    setLevel(1);
    setSafesCracked(0);
    setTwinkiesCollected(0);
    const newTumblers = generateCombination();
    setTumblers(newTumblers);
    setCurrentTumblerIndex(0);
    setPosition(generateStartingPosition(newTumblers[0].targetNumber));
    setTensionLevel('none');
    setWrongStreak(0);
    setWrongDirectionWarning(false);
    setHoldProgress(0);
    sound.playTick();
    haptics.tick();
    setGameStatus('playing');
  };

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
   * Start Next Level: Vaults always start with full baseline time!
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

    // Level timer bugfix: Fresh full countdown timer per vault!
    const base = DIFFICULTY_CONFIG[difficulty].baseTime;
    setTimeLeft(base);
    setTotalTime(base);

    setGameStatus('playing');
  };

  /**
   * Restart Game after Game Over: returns to Start Screen
   */
  const handleRestart = () => {
    setGameStatus('start');
    setTensionLevel('none');
    setWrongStreak(0);
    setWrongDirectionWarning(false);
    setHoldProgress(0);
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

      {/* IN-GAME BACK / STOP SESSION BUTTONS */}
      {gameStatus === 'playing' && (
        <>
          {/* Top-Left Circular Back Button */}
          <button
            onClick={handleBackToStart}
            className="absolute top-8 left-8 z-25 w-7 h-7 rounded-full bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold shadow-lg transition-transform active:scale-90 cursor-pointer pointer-events-auto"
            title="Stop Session / Back to Menu"
          >
            ❮
          </button>

          {/* Bottom Quit Session Pill (if Demo Mode is off) */}
          {!isDemoMode && (
            <button
              onClick={handleBackToStart}
              className="absolute bottom-6 z-25 px-3 py-0.5 rounded-full bg-slate-950/80 border border-slate-800/80 hover:bg-slate-900 text-[9.5px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
            >
              <span>❮</span>
              <span>QUIT SESSION</span>
            </button>
          )}
        </>
      )}

      {/* START SCREEN WITH DIFFICULTY, LIFETIME TWINKIES & HIGH SCORE */}
      {gameStatus === 'start' && (
        <StartScreen
          difficulty={difficulty}
          highScore={highScore}
          lifetimeTwinkies={lifetimeTwinkies}
          onSelectDifficulty={handleSelectDifficulty}
          onStartGame={handleStartGame}
        />
      )}

      {/* LEVEL CLEARED / VAULT OPEN CELEBRATION MODAL */}
      {gameStatus === 'cleared' && (
        <VaultCelebrationModal
          level={level}
          bonusTime={DIFFICULTY_CONFIG[difficulty].baseTime}
          twinkiesAwarded={3}
          lifetimeTwinkies={lifetimeTwinkies}
          onNextLevel={handleNextLevel}
        />
      )}

      {/* GAME OVER / LOCKDOWN MODAL */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          safesCracked={safesCracked}
          twinkiesCollected={twinkiesCollected}
          lifetimeTwinkies={lifetimeTwinkies}
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
      <div
        className="fixed inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center select-none"
        style={{ width: '100vw', height: '100vh', backgroundColor: '#000000' }}
      >
        <div className="relative w-full h-full max-w-[450px] max-h-[450px] aspect-square flex items-center justify-center">
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
