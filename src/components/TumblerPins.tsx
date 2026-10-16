import React from 'react';
import type { Tumbler } from '../types/game';
import { Check, Lock } from 'lucide-react';

interface TumblerPinsProps {
  tumblers: Tumbler[];
  currentTumblerIndex: number;
}

export const TumblerPins: React.FC<TumblerPinsProps> = ({
  tumblers,
  currentTumblerIndex,
}) => {
  return (
    <div className="flex items-center justify-center gap-2.5 z-10">
      {tumblers.map((tumbler, idx) => {
        const isSolved = tumbler.isUnlocked;
        const isActive = idx === currentTumblerIndex && !isSolved;

        return (
          <div
            key={tumbler.id}
            className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
              isSolved
                ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-105'
                : isActive
                ? 'bg-slate-900 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse'
                : 'bg-slate-950/80 border border-slate-700/60 text-slate-500 opacity-60'
            }`}
            title={`Tumbler ${idx + 1} (${tumbler.requiredDirection})`}
          >
            {isSolved ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : isActive ? (
              <span className="text-[11px] font-black leading-none font-mono">
                {tumbler.requiredDirection === 'CW' ? '↻' : '↺'}
              </span>
            ) : (
              <Lock className="w-2.5 h-2.5 opacity-60" />
            )}
          </div>
        );
      })}
    </div>
  );
};
