import React from 'react';
import type { Tumbler, GameStatus } from '../types/game';
import { TumblerPins } from './TumblerPins';
import { AlertTriangle, KeySquare } from 'lucide-react';

interface CenterHubProps {
  currentPosition: number;
  currentTumbler: Tumbler | undefined;
  currentTumblerIndex: number;
  tumblers: Tumbler[];
  tensionLevel: 'none' | 'warm' | 'aligned';
  holdProgress: number; // 0.0 to 1.0 (600ms hold)
  wrongDirectionWarning: boolean;
  level: number;
  onTapCenter: () => void;
  gameStatus: GameStatus;
  timeLeft: number;
}

export const CenterHub: React.FC<CenterHubProps> = ({
  currentPosition,
  currentTumbler,
  currentTumblerIndex,
  tumblers,
  tensionLevel,
  holdProgress,
  wrongDirectionWarning,
  level,
  onTapCenter,
  gameStatus,
  timeLeft,
}) => {
  const formattedNumber =
    currentPosition < 10 ? `0${currentPosition}` : `${currentPosition}`;

  const isAligned = tensionLevel === 'aligned';
  const isWarm = tensionLevel === 'warm';

  // Radius for 600ms hold progress ring around center hub
  const hubRadius = 46;
  const hubCircumference = 2 * Math.PI * hubRadius;
  const holdDashoffset = hubCircumference * (1 - Math.min(1, Math.max(0, holdProgress)));

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between py-6 px-4 pointer-events-none select-none z-10">
      {/* TOP: TUMBLER STATUS PINS */}
      <div className="flex flex-col items-center gap-0.5 mt-2">
        <TumblerPins
          tumblers={tumblers}
          currentTumblerIndex={currentTumblerIndex}
        />
        {/* Subtle timer text */}
        <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 mt-1">
          {Math.ceil(timeLeft)}s
        </div>
      </div>

      {/* CENTER: LARGE NUMERIC READOUT & INTERACTIVE HUB */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        {/* Interactive Center Hub Button (Tap-to-Lock or Hold) */}
        <button
          onClick={onTapCenter}
          disabled={gameStatus !== 'playing'}
          className={`relative pointer-events-auto w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-200 outline-none active:scale-95 cursor-pointer ${
            wrongDirectionWarning
              ? 'bg-red-950/90 border-2 border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.8)]'
              : isAligned
              ? 'bg-gradient-to-b from-slate-900 to-emerald-950/80 border-2 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.7)]'
              : isWarm
              ? 'bg-gradient-to-b from-slate-900 to-amber-950/80 border-2 border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.5)]'
              : 'bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-slate-700/70 shadow-[inset_0_2px_8px_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.8)]'
          }`}
          style={{ willChange: 'transform' }}
          aria-label={isAligned ? 'Lock Tumbler' : 'Safe Dial Hub'}
        >
          {/* Radial 600ms Hold Sweep Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none overflow-visible">
            <circle
              cx="56"
              cy="56"
              r={hubRadius}
              fill="none"
              stroke={isAligned ? '#10B981' : '#F59E0B'}
              strokeWidth={isAligned ? '4' : '2'}
              strokeDasharray={hubCircumference}
              strokeDashoffset={holdDashoffset}
              strokeLinecap="round"
              className={holdProgress > 0 ? 'transition-all duration-75' : ''}
              opacity={holdProgress > 0 ? 1 : 0}
            />
          </svg>

          {/* Readout Number */}
          <span
            className={`font-mono text-3xl font-extrabold tracking-tight tabular-nums transition-colors duration-150 ${
              wrongDirectionWarning
                ? 'text-red-400'
                : isAligned
                ? 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                : isWarm
                ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                : 'text-slate-100'
            }`}
          >
            {formattedNumber}
          </span>

          {/* Action prompt inside hub */}
          <div className="mt-0.5 text-center">
            {isAligned ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider text-emerald-300 animate-pulse uppercase">
                <KeySquare className="w-2.5 h-2.5" />
                TAP / HOLD
              </span>
            ) : wrongDirectionWarning ? (
              <span className="inline-flex items-center gap-1 text-[8.5px] font-bold text-red-400 animate-bounce uppercase">
                <AlertTriangle className="w-2.5 h-2.5" />
                WRONG WAY
              </span>
            ) : currentTumbler ? (
              <span className="text-[9.5px] font-bold font-mono tracking-wider text-cyan-400/90 flex items-center justify-center gap-1">
                {currentTumbler.requiredDirection === 'CW' ? '↻ SPIN CW' : '↺ SPIN CCW'}
              </span>
            ) : null}
          </div>
        </button>

        {/* Direction Indicator Pill below Hub */}
        <div className="mt-1.5 flex items-center justify-center">
          {wrongDirectionWarning ? (
            <span className="px-2 py-0.5 bg-red-950/80 border border-red-500/80 rounded-full text-[9px] font-bold text-red-300 tracking-wider animate-pulse">
              REVERSE DIRECTION!
            </span>
          ) : isAligned ? (
            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-400 rounded-full text-[9px] font-extrabold text-emerald-300 tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              GATE ALIGNED
            </span>
          ) : isWarm ? (
            <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-500/60 rounded-full text-[9px] font-semibold text-amber-300 tracking-wider">
              TENSION WARM
            </span>
          ) : null}
        </div>
      </div>

      {/* BOTTOM: LEVEL BADGE & SAFE CRACKING STATUS */}
      <div className="flex items-center justify-between w-full max-w-[210px] mb-2 px-1">
        <span className="px-2 py-0.5 bg-slate-900/90 border border-slate-700/80 rounded-full text-[10px] font-mono font-bold text-slate-300">
          LVL {level}
        </span>

        <span className="text-[10px] font-mono text-slate-400">
          PIN {Math.min(3, currentTumblerIndex + 1)}/3
        </span>
      </div>
    </div>
  );
};
