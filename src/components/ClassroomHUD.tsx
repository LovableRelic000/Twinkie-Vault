import React from 'react';
import type { Tumbler } from '../types/game';
import { Eye } from 'lucide-react';

interface ClassroomHUDProps {
  tumblers: Tumbler[];
  currentTumblerIndex: number;
  isVisible: boolean;
  onToggle: () => void;
}

export const ClassroomHUD: React.FC<ClassroomHUDProps> = ({
  tumblers,
  currentTumblerIndex,
  isVisible,
  onToggle,
}) => {
  if (!isVisible) return null;

  return (
    <div
      onClick={onToggle}
      className="absolute bottom-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/90 border border-cyan-500/80 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.4)] backdrop-blur-sm pointer-events-auto cursor-pointer animate-fade-in"
      title="Classroom Demo HUD (Target Combination Revealed)"
    >
      <Eye className="w-3 h-3 text-cyan-400" />
      <span className="text-[9px] font-mono font-bold text-cyan-300">DEMO:</span>
      <div className="flex items-center gap-1 text-[9.5px] font-mono font-bold">
        {tumblers.map((t, idx) => {
          const isTarget = idx === currentTumblerIndex && !t.isUnlocked;
          const isDone = t.isUnlocked;
          const numStr = t.targetNumber < 10 ? `0${t.targetNumber}` : `${t.targetNumber}`;

          return (
            <span
              key={t.id}
              className={`px-1 py-0.2 rounded transition-colors ${
                isDone
                  ? 'text-amber-400 line-through opacity-60'
                  : isTarget
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400 font-extrabold shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                  : 'text-slate-400'
              }`}
            >
              {t.requiredDirection === 'CW' ? '↻' : '↺'}
              {numStr}
            </span>
          );
        })}
      </div>
    </div>
  );
};
