import React from 'react';
import { TwinkieIcon } from './TwinkieIcon';
import { RotateCcw, ShieldAlert, Award } from 'lucide-react';

interface GameOverModalProps {
  safesCracked: number;
  twinkiesCollected: number;
  highScore: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  safesCracked,
  twinkiesCollected,
  highScore,
  onRestart,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-black/94 backdrop-blur-sm select-none text-center animate-fade-in">
      {/* Lockdown Alert Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-500/80 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)] mb-2">
        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
        <span className="text-[10.5px] font-extrabold text-red-200 tracking-wider uppercase font-mono">
          TIME EXPIRED • LOCKED DOWN
        </span>
      </div>

      {/* Dimmed Twinkie */}
      <div className="my-1.5 opacity-60 grayscale-[40%]">
        <TwinkieIcon size={56} />
      </div>

      {/* Score Summary Grid */}
      <div className="grid grid-cols-2 gap-2 my-2 w-full max-w-[210px] text-left">
        <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col">
          <span className="text-[9px] font-mono text-slate-400 uppercase">Safes Cracked</span>
          <span className="text-base font-extrabold text-white font-mono">{safesCracked}</span>
        </div>
        <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col">
          <span className="text-[9px] font-mono text-amber-400 uppercase">Twinkies</span>
          <span className="text-base font-extrabold text-amber-300 font-mono">+{twinkiesCollected}</span>
        </div>
      </div>

      {/* High score badge */}
      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mb-2">
        <Award className="w-3 h-3 text-amber-400" />
        <span>Best Record: {highScore} Safes</span>
      </div>

      {/* Retry Button */}
      <button
        onClick={onRestart}
        className="mt-1 px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-black text-xs font-mono rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.6)] transition-all cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>RETRY VAULT</span>
      </button>
    </div>
  );
};
