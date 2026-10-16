import React from 'react';

interface TimerRingProps {
  timeLeft: number;
  totalTime: number;
  tensionLevel: 'none' | 'warm' | 'aligned';
}

export const TimerRing: React.FC<TimerRingProps> = ({
  timeLeft,
  totalTime,
  tensionLevel,
}) => {
  const size = 396;
  const center = size / 2;
  const radius = 132;
  const circumference = 2 * Math.PI * radius;

  const ratio = Math.max(0, Math.min(1, timeLeft / totalTime));
  const strokeDashoffset = circumference * (1 - ratio);

  // Dynamic color selection based on remaining time ratio
  const getTimerColor = () => {
    if (ratio > 0.45) return '#10B981'; // Emerald
    if (ratio > 0.20) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const timerColor = getTimerColor();
  const isUrgent = ratio <= 0.2 && timeLeft > 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1E293B"
          strokeWidth="3.5"
          opacity="0.4"
        />

        {/* Dynamic Depleting Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={timerColor}
          strokeWidth={isUrgent ? '4.5' : '3.5'}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset 200ms linear, stroke 400ms ease',
            filter: isUrgent ? 'drop-shadow(0 0 4px #EF4444)' : undefined,
          }}
          className={isUrgent ? 'animate-pulse' : ''}
        />

        {/* Tension Proximity Pulse Arc */}
        {tensionLevel !== 'none' && (
          <circle
            cx={center}
            cy={center}
            r={radius - 6}
            fill="none"
            stroke={tensionLevel === 'aligned' ? '#06B6D4' : '#F59E0B'}
            strokeWidth="2"
            strokeDasharray="6 8"
            opacity={tensionLevel === 'aligned' ? '0.9' : '0.6'}
            transform={`rotate(-90 ${center} ${center})`}
            className="animate-spin-slow"
          />
        )}
      </svg>
    </div>
  );
};
