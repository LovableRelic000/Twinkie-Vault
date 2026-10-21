import React from 'react';
import { TwinkieIcon } from './TwinkieIcon';
import { Trophy, Play, Shield } from 'lucide-react';
import type { Difficulty } from '../types/game';

interface StartScreenProps {
  difficulty: Difficulty;
  highScore: number;
  lifetimeTwinkies: number;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStartGame: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  difficulty,
  highScore,
  lifetimeTwinkies,
  onSelectDifficulty,
  onStartGame,
}) => {
  const difficulties: { id: Difficulty; label: string; time: string; activeClass: string; textClass: string }[] = [
    {
      id: 'easy',
      label: 'EASY',
      time: '45s',
      activeClass: 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      textClass: 'text-emerald-400',
    },
    {
      id: 'normal',
      label: 'NORMAL',
      time: '35s',
      activeClass: 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
      textClass: 'text-amber-400',
    },
    {
      id: 'hard',
      label: 'HARD',
      time: '22s',
      activeClass: 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
      textClass: 'text-rose-400',
    },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-3 bg-black/95 backdrop-blur-md select-none text-center animate-fade-in pointer-events-auto">
      {/* Decorative Bezel Orbit Ring */}
      <div className="absolute inset-2 rounded-full border border-slate-800/80 pointer-events-none" />

      {/* Title */}
      <h1 className="text-[17px] font-black tracking-wider text-amber-400 font-mono drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] mt-2">
        TWINKIE VAULT
      </h1>

      {/* High Score Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 mt-1 bg-amber-950/60 border border-amber-500/40 rounded-full">
        <Trophy className="w-3 h-3 text-amber-300" />
        <span className="text-[10px] font-extrabold text-amber-200 tracking-wider font-mono">
          BEST: {highScore} SAFES
        </span>
      </div>

      {/* Golden Twinkie Mascot Graphic */}
      <div className="my-1.5 relative flex items-center justify-center transform hover:scale-105 transition-transform">
        <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-md" />
        <TwinkieIcon size={58} />
      </div>

      {/* Lifetime Twinkies Badge */}
      <div className="flex items-center gap-1 text-[11px] font-mono font-black text-amber-300 tracking-wider mb-2">
        <span>✨</span>
        <span>{lifetimeTwinkies} LIFETIME TWINKIES</span>
      </div>

      {/* Difficulty Subtitle */}
      <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
        <Shield className="w-2.5 h-2.5 text-slate-500" />
        <span>CHOOSE DIFFICULTY</span>
      </div>

      {/* Difficulty Selector Pills */}
      <div className="flex items-center gap-1.5 mb-3">
        {difficulties.map((diff) => {
          const isSelected = difficulty === diff.id;
          return (
            <button
              key={diff.id}
              onClick={() => onSelectDifficulty(diff.id)}
              className={`px-2.5 py-1 rounded-md border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                isSelected
                  ? diff.activeClass
                  : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <div>{diff.label}</div>
              <div className="text-[8px] opacity-75 font-normal">{diff.time}</div>
            </button>
          );
        })}
      </div>

      {/* Start Button */}
      <button
        onClick={onStartGame}
        className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 text-slate-950 font-black text-xs font-mono rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>START CRACKING</span>
      </button>

      {/* Bezel rotation tip */}
      <span className="text-[8.5px] font-mono text-slate-500 mt-2">
        ↻ Rotate bezel to select difficulty
      </span>
    </div>
  );
};
