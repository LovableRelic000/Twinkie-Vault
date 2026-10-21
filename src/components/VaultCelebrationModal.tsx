import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TwinkieIcon } from './TwinkieIcon';
import { Trophy, Clock, ArrowRight } from 'lucide-react';

interface VaultCelebrationModalProps {
  level: number;
  bonusTime: number;
  twinkiesAwarded: number;
  lifetimeTwinkies: number;
  onNextLevel: () => void;
}

export const VaultCelebrationModal: React.FC<VaultCelebrationModalProps> = ({
  level,
  bonusTime,
  twinkiesAwarded,
  lifetimeTwinkies,
  onNextLevel,
}) => {
  useEffect(() => {
    // Launch gold & amber victory confetti burst
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#FBBF24', '#FDE047', '#10B981', '#FFFFFF'],
      disableForReducedMotion: true,
    });
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-black/92 backdrop-blur-sm select-none text-center animate-fade-in">
      {/* Golden Vault Banner */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 border border-amber-500/80 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)] mb-2">
        <Trophy className="w-3.5 h-3.5 text-amber-300" />
        <span className="text-[11px] font-extrabold text-amber-200 tracking-wider uppercase font-mono">
          VAULT {level} CRACKED!
        </span>
      </div>

      {/* Golden Twinkie Loot Graphic */}
      <div className="my-2 relative flex items-center justify-center animate-bounce">
        <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-md" />
        <TwinkieIcon size={84} />
      </div>

      {/* Rewards text */}
      <div className="flex flex-col items-center gap-1 my-1">
        <span className="text-xs font-black text-amber-300 tracking-wide">
          +{twinkiesAwarded} GOLDEN TWINKIES!
        </span>
        <span className="text-[10px] font-mono font-bold text-amber-200">
          ✨ Lifetime: {lifetimeTwinkies} Twinkies
        </span>
        <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
          <Clock className="w-3 h-3" />
          <span>+{bonusTime}s Fresh Vault Timer</span>
        </div>
      </div>

      {/* Next Vault Button */}
      <button
        onClick={onNextLevel}
        className="mt-3 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-xs font-mono rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.7)] transition-all cursor-pointer"
      >
        <span>NEXT VAULT</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
