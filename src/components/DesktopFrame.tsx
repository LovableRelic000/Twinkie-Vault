import React from 'react';
import { RotateCw, RotateCcw, Volume2, VolumeX, Vibrate, Eye, HelpCircle } from 'lucide-react';

interface DesktopFrameProps {
  children: React.ReactNode;
  onStepCW: () => void;
  onStepCCW: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isHapticEnabled: boolean;
  onToggleHaptics: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onTapCenter: () => void;
}

export const DesktopFrame: React.FC<DesktopFrameProps> = ({
  children,
  onStepCW,
  onStepCCW,
  isMuted,
  onToggleMute,
  isHapticEnabled,
  onToggleHaptics,
  isDemoMode,
  onToggleDemoMode,
  onTapCenter,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#080B10] text-slate-100 flex flex-col items-center justify-center p-3 lg:p-6 overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* HEADER / DESKTOP TITLE BAR */}
      <header className="mb-4 text-center hidden md:flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <h1 className="text-xl lg:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 font-mono">
            TWINKIEVAULT
          </h1>
          <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700 rounded text-[10px] font-mono text-slate-300">
            GALAXY WATCH 4 CLASSIC
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-md font-mono">
          Physical Bezel + Wheel + Circular Drag Safe-Cracker Simulator
        </p>
      </header>

      {/* MAIN HARDWARE SIMULATOR SECTION */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 my-auto">
        {/* LEFT DESKTOP CONTROLS (CCW TEST BUTTON & SHORTCUTS) */}
        <div className="hidden lg:flex flex-col items-center gap-4 w-44">
          <button
            onClick={onStepCCW}
            className="w-full px-4 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 rounded-xl flex items-center justify-between gap-2 shadow-lg transition-all active:scale-95 group cursor-pointer"
            title="Rotate Dial Counter-Clockwise (Left Arrow / Wheel Down)"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-cyan-400 group-hover:-rotate-45 transition-transform" />
              <span className="text-xs font-mono font-bold text-slate-200">-1 CCW</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400">
              ← / ↓
            </kbd>
          </button>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[11px] font-mono text-slate-400 space-y-2">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rotary Inputs</span>
            </div>
            <p className="text-[10.5px] leading-relaxed">
              • <strong>Mouse Wheel:</strong> Scroll over watch<br />
              • <strong>Circular Drag:</strong> Touch & drag around dial<br />
              • <strong>Center Hub:</strong> Click to lock aligned pin
            </p>
          </div>
        </div>

        {/* CENTER: GALAXY WATCH 4 CLASSIC CHASSIS (STAINLESS STEEL & BEZEL) */}
        <div className="relative flex items-center justify-center">
          {/* Top Strap Lug */}
          <div className="absolute -top-6 w-36 h-8 bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-xl border-t border-x border-slate-700/60 shadow-md z-0" />

          {/* Bottom Strap Lug */}
          <div className="absolute -bottom-6 w-36 h-8 bg-gradient-to-t from-slate-800 to-slate-900 rounded-b-xl border-b border-x border-slate-700/60 shadow-md z-0" />

          {/* Watch 4 Classic Outer Case (Fluted Stainless Steel / Black Titanium) */}
          <div className="relative w-[430px] h-[430px] rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-black p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.05)] border-2 border-slate-600/70 flex items-center justify-center z-10">
            {/* Physical Mechanical Rotating Bezel Ring */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-1 flex items-center justify-center border border-slate-700/80 shadow-inner">
              {/* Outer Bezel Ridge Serrations */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 6px rgba(0,0,0,0.8), 0 0 4px rgba(255,255,255,0.1)',
                }}
              />

              {/* Physical Bezel 15-Minute Etchings */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[8px] font-mono font-black text-slate-400 select-none">
                <span className="absolute top-1 text-red-500">▼</span>
                <span className="absolute right-2.5">15</span>
                <span className="absolute bottom-1.5">30</span>
                <span className="absolute left-2.5">45</span>
              </div>

              {/* EXACT 396x396 CIRCULAR SUPER AMOLED VIEWPORT */}
              <div
                id="watch-screen"
                className="relative w-[396px] h-[396px] rounded-full overflow-hidden bg-black shadow-2xl flex items-center justify-center z-10"
                style={{
                  clipPath: 'circle(50% at 50% 50%)',
                  WebkitClipPath: 'circle(50% at 50% 50%)',
                }}
              >
                {children}
              </div>
            </div>

            {/* Hardware Side Button 1 (Home / Power Key with Red Accent Ring) */}
            <button
              onClick={onTapCenter}
              className="absolute -right-3.5 top-[145px] w-3 h-10 bg-slate-800 hover:bg-slate-700 border-y border-r border-slate-600 rounded-r-md shadow-md flex items-center justify-center active:translate-x-0.5 transition-all cursor-pointer group"
              title="Physical Hardware Home Button (Lock / Tap Center)"
            >
              <div className="w-1.5 h-6 rounded-full bg-red-600 group-hover:bg-red-500 transition-colors" />
            </button>

            {/* Hardware Side Button 2 (Back Key) */}
            <button
              onClick={onStepCW}
              className="absolute -right-3.5 top-[255px] w-3 h-10 bg-slate-800 hover:bg-slate-700 border-y border-r border-slate-600 rounded-r-md shadow-md active:translate-x-0.5 transition-all cursor-pointer"
              title="Physical Hardware Back Button (Step CW)"
            />
          </div>
        </div>

        {/* RIGHT DESKTOP CONTROLS (CW TEST BUTTON & SETTINGS) */}
        <div className="hidden lg:flex flex-col items-center gap-4 w-44">
          <button
            onClick={onStepCW}
            className="w-full px-4 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 rounded-xl flex items-center justify-between gap-2 shadow-lg transition-all active:scale-95 group cursor-pointer"
            title="Rotate Dial Clockwise (Right Arrow / Wheel Up)"
          >
            <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400">
              → / ↑
            </kbd>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-200">+1 CW</span>
              <RotateCw className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            </div>
          </button>

          {/* Quick Toolbar (Audio, Haptic, Classroom Demo) */}
          <div className="w-full p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
            <span className="text-[11px] font-mono font-bold text-slate-300 block mb-1">
              Presenter Options
            </span>

            {/* Demo HUD Toggle */}
            <button
              onClick={onToggleDemoMode}
              className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer ${
                isDemoMode
                  ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-200 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Demo HUD</span>
              </span>
              <span className="text-[10px]">{isDemoMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={onToggleMute}
              className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer ${
                !isMuted
                  ? 'bg-slate-800 text-amber-300 font-semibold'
                  : 'bg-slate-950 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Sound Synth</span>
              </span>
              <span className="text-[10px]">{!isMuted ? 'ON' : 'MUTED'}</span>
            </button>

            {/* Haptics Toggle */}
            <button
              onClick={onToggleHaptics}
              className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer ${
                isHapticEnabled
                  ? 'bg-slate-800 text-emerald-300 font-semibold'
                  : 'bg-slate-950 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Vibrate className="w-3.5 h-3.5" />
                <span>Haptics</span>
              </span>
              <span className="text-[10px]">{isHapticEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE / WATCH TEST CONTROLS (Displayed only when viewport <= 1024px) */}
      <div className="flex lg:hidden items-center justify-center gap-2 mt-4 z-20">
        <button
          onClick={onStepCCW}
          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-1 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>-1 CCW</span>
        </button>

        <button
          onClick={onToggleDemoMode}
          className={`px-3 py-1.5 border rounded-lg text-xs font-mono flex items-center gap-1 active:scale-95 ${
            isDemoMode
              ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Demo</span>
        </button>

        <button
          onClick={onStepCW}
          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 flex items-center gap-1 active:scale-95"
        >
          <span>+1 CW</span>
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
