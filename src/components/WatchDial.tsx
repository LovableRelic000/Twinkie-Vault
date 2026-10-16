import React, { useMemo } from 'react';
import { TOTAL_NOTCHES, STEP_DEGREES } from '../utils/gameLogic';

interface WatchDialProps {
  rotationAngle: number;
  currentPosition: number;
  tensionLevel: 'none' | 'warm' | 'aligned';
}

export const WatchDial: React.FC<WatchDialProps> = ({
  rotationAngle,
  tensionLevel,
}) => {
  const size = 396;
  const center = size / 2;
  const outerRadius = 190;
  const tickOuterRadius = 186;
  const tickInnerMajor = 166;
  const tickInnerMinor = 173;
  const textRadius = 152;

  // Generate the 24 notches around 360 degrees (every 15 degrees)
  const notches = useMemo(() => {
    return Array.from({ length: TOTAL_NOTCHES }, (_, i) => {
      const angleDeg = i * STEP_DEGREES;
      const angleRad = (angleDeg - 90) * (Math.PI / 180);
      const isMajor = i % 3 === 0; // 0, 3, 6, 9, 12, 15, 18, 21

      const x1 = center + tickOuterRadius * Math.cos(angleRad);
      const y1 = center + tickOuterRadius * Math.sin(angleRad);
      const x2 = center + (isMajor ? tickInnerMajor : tickInnerMinor) * Math.cos(angleRad);
      const y2 = center + (isMajor ? tickInnerMinor : tickInnerMinor) * Math.sin(angleRad);

      const tx = center + textRadius * Math.cos(angleRad);
      const ty = center + textRadius * Math.sin(angleRad);

      return {
        number: i,
        angleDeg,
        isMajor,
        x1,
        y1,
        x2,
        y2,
        tx,
        ty,
        label: i < 10 ? `0${i}` : `${i}`,
      };
    });
  }, [center]);

  // Generate knurled teeth around the perimeter
  const knurls = useMemo(() => {
    const totalKnurls = 72; // 3 teeth per 15-deg detent
    const knurlStep = 360 / totalKnurls;
    return Array.from({ length: totalKnurls }, (_, k) => {
      const ang = (k * knurlStep - 90) * (Math.PI / 180);
      const x1 = center + (outerRadius + 3) * Math.cos(ang);
      const y1 = center + (outerRadius + 3) * Math.sin(ang);
      const x2 = center + (outerRadius - 2) * Math.cos(ang);
      const y2 = center + (outerRadius - 2) * Math.sin(ang);
      return { x1, y1, x2, y2, id: k };
    });
  }, [center]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Vault metallic radial gradient */}
          <radialGradient id="dialSteel" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B0F19" />
            <stop offset="70%" stopColor="#111827" />
            <stop offset="92%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>

          {/* Knurled bezel ring gradient */}
          <linearGradient id="bezelEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Crimson glow for 12 o'clock needle */}
          <filter id="crimsonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#EF4444" floodOpacity="0.85" />
          </filter>

          {/* Gate aligned tension glow */}
          <filter id="gateGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#10B981" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* ROTATING DIAL ASSEMBLY */}
        <g
          style={{
            transform: `rotate(${rotationAngle}deg)`,
            transformOrigin: `${center}px ${center}px`,
            transition: 'transform 85ms cubic-bezier(0.1, 0.9, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          {/* Dial Base Plate */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="url(#dialSteel)"
            stroke="url(#bezelEdge)"
            strokeWidth="3.5"
          />

          {/* Outer Knurls (Machined Grips) */}
          {knurls.map((k) => (
            <line
              key={k.id}
              x1={k.x1}
              y1={k.y1}
              x2={k.x2}
              y2={k.y2}
              stroke="#64748B"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
          ))}

          {/* Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={tickInnerMajor - 4}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* 24 Notches & Tabular Numbers */}
          {notches.map((n) => (
            <g key={n.number}>
              {/* Tick Mark */}
              <line
                x1={n.x1}
                y1={n.y1}
                x2={n.x2}
                y2={n.y2}
                stroke={n.isMajor ? '#E2E8F0' : '#64748B'}
                strokeWidth={n.isMajor ? '2.5' : '1.5'}
                strokeLinecap="round"
              />

              {/* Number Label */}
              <text
                x={n.tx}
                y={n.ty}
                fill={n.isMajor ? '#F8FAFC' : '#94A3B8'}
                fontSize={n.isMajor ? '13' : '10'}
                fontWeight={n.isMajor ? '800' : '600'}
                fontFamily="'JetBrains Mono', 'Roboto Mono', ui-monospace, monospace"
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${n.angleDeg}, ${n.tx}, ${n.ty})`}
                opacity={n.isMajor ? 1 : 0.75}
              >
                {n.label}
              </text>
            </g>
          ))}
        </g>

        {/* STATIC 12 O'CLOCK CRIMSON NOTCH (FIXED TARGET NEEDLE) */}
        <g filter="url(#crimsonGlow)">
          {/* Triangular needle pointing downward toward the active dial number */}
          <polygon
            points={`${center - 7},6 ${center + 7},6 ${center},22`}
            fill="#EF4444"
          />
          <line
            x1={center}
            y1={5}
            x2={center}
            y2={25}
            stroke="#FEE2E2"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* TENSION PROXIMITY RING GLOW (Visual feedback) */}
        {tensionLevel !== 'none' && (
          <circle
            cx={center}
            cy={center}
            r={outerRadius - 6}
            fill="none"
            stroke={tensionLevel === 'aligned' ? '#10B981' : '#F59E0B'}
            strokeWidth={tensionLevel === 'aligned' ? '4' : '2.5'}
            strokeOpacity={tensionLevel === 'aligned' ? '0.85' : '0.55'}
            strokeDasharray={tensionLevel === 'aligned' ? 'none' : '4 6'}
            className={tensionLevel === 'aligned' ? 'animate-pulse' : ''}
          />
        )}
      </svg>
    </div>
  );
};
