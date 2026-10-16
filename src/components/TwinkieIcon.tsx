import React from 'react';

interface TwinkieIconProps {
  className?: string;
  size?: number;
}

export const TwinkieIcon: React.FC<TwinkieIconProps> = ({
  className = '',
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={size * 0.52}
      viewBox="0 0 100 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Golden Twinkie"
    >
      <defs>
        {/* Golden sponge cake gradient */}
        <linearGradient id="twinkieCrust" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="25%" stopColor="#FBBF24" />
          <stop offset="65%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Golden highlight */}
        <linearGradient id="spongeHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FDE047" stopOpacity="0.2" />
        </linearGradient>

        {/* Cream filling */}
        <radialGradient id="creamFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </radialGradient>
      </defs>

      {/* Sponge Cake Oblong Body */}
      <rect
        x="2"
        y="6"
        width="96"
        height="40"
        rx="20"
        fill="url(#twinkieCrust)"
        stroke="#B45309"
        strokeWidth="2.5"
      />

      {/* Golden Top Shimmer */}
      <ellipse
        cx="50"
        cy="15"
        rx="36"
        ry="6"
        fill="url(#spongeHighlight)"
      />

      {/* 3 Classic Cream Injection Ports on Bottom */}
      <circle cx="28" cy="36" r="4.5" fill="url(#creamFill)" stroke="#D97706" strokeWidth="1" />
      <circle cx="50" cy="36" r="4.5" fill="url(#creamFill)" stroke="#D97706" strokeWidth="1" />
      <circle cx="72" cy="36" r="4.5" fill="url(#creamFill)" stroke="#D97706" strokeWidth="1" />

      {/* Cream swirl dots */}
      <circle cx="28" cy="35" r="1.5" fill="#FFFFFF" />
      <circle cx="50" cy="35" r="1.5" fill="#FFFFFF" />
      <circle cx="72" cy="35" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};
