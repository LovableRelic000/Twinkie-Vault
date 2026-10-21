# 🧁 TwinkieVault — Smartwatch Safe-Cracker Micro-Game

[![Galaxy Watch 4 Classic Compatible](https://img.shields.io/badge/Wear%20OS-3.0%20to%206.0-green.svg)](https://developer.android.com/wear)
[![Platform](https://img.shields.io/badge/Platform-Wear%20OS%20%7C%20Web%20Simulator-amber.svg)]()
[![Hardware](https://img.shields.io/badge/Hardware-Rotary%20Bezel%20(24--notch)-blue.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

> A precision safe-cracking micro-game tailored specifically for circular smartwatches like the **Samsung Galaxy Watch 4 Classic** and desktop web browsers. Spin the physical rotating bezel, feel the micro-haptic tension, align the directional tumblers, and crack the vault to loot golden Twinkies!

---

## 🌟 Highlights & Features

- **Hardware Rotary Bezel Integration**: Native 24-notch mechanical bezel input (`15°` per detent) with hardware-accelerated 60fps rendering and 45ms debouncing.
- **Directional Tumbler Logic**: Realistic safe-cracker combinations (`↻ CW`, `↺ CCW`, `↻ CW`) with wrong-direction resistance warnings.
- **Dynamic Haptic Feedback**:
  - `10ms` micro-ticks on normal detents.
  - `25ms` warm proximity rumble within ±1-2 numbers of the target.
  - `80ms` heavy gate clunk when dead-centered on the combination target.
  - Double-pulse latching pulse `[40ms, 50ms, 90ms]` upon locking a tumbler.
- **Procedural PCM Audio**: Pure synthetic mechanical audio engine via Android `AudioTrack` and Web Audio API — metallic clicks, resonant gate clunk, and vault latching.
- **Dedicated Start Screen & Difficulty Modes**:
  - **Easy**: 45s timer, 2-notch proximity zone.
  - **Normal**: 35s timer, 2-notch proximity zone.
  - **Hard**: 22s timer, strict 1-notch proximity zone for master safe-crackers.
  - Bezel-controlled difficulty cycling directly from the start screen.
- **Persistent Stats**: Tracks high scores per difficulty and cumulative **Lifetime Twinkies** via `SharedPreferences` (watch) and `localStorage` (web).
- **Physical & On-Screen Back Controls**:
  - Intercepts the Galaxy Watch's bottom hardware button (`KEYCODE_BACK`) to stop sessions cleanly without terminating the app.
  - Top-left on-screen back button (`❮`) and bottom `❮ QUIT SESSION` pill for touch control.
- **Zero WebView Dependency on Wear OS**: Built with a 100% native Android Canvas architecture (`SafeDialView.java`) to bypass Wear OS firmware WebView stripping while maintaining pure AMOLED black (`#000000`) battery optimization.
- **Interactive Desktop Browser Simulator**: Full Samsung Galaxy Watch 4 Classic chassis frame for testing in any modern desktop browser.

---

## 🎮 How to Play

1. **Select Difficulty**: Tap `EASY`, `NORMAL`, or `HARD` (or rotate the bezel) on the Start Screen.
2. **Start Cracking**: Tap `START CRACKING ▶`.
3. **Inspect the Direction**: Look at the center indicator (`↻ SPIN CW` or `↺ SPIN CCW`).
4. **Spin the Bezel**: Rotate the bezel in the indicated direction. As you approach the secret target, you will feel the haptic "warm zone" rumble.
5. **Lock the Tumbler**: When perfectly aligned on the target number, hold for 600ms (or tap the center hub) to lock the pin.
6. **Loot the Vault**: Crack all 3 tumblers before the countdown ring expires to score +3 Golden Twinkies and advance to the next safe!

---

## 🛠️ Project Architecture

```
TwinkieVault/
├── android/                             # Native Android / Wear OS Project
│   └── app/src/main/java/com/twinkievault/game/
│       ├── WatchMainActivity.java       # Native Activity handling bezel, haptics, lifecycle
│       ├── SafeDialView.java            # Hardware-accelerated 60fps Canvas safe dial
│       └── SoundManager.java            # Procedural PCM audio synthesizer
├── src/                                 # Web / Desktop Simulator (React + TypeScript + Vite)
│   ├── components/
│   │   ├── DesktopFrame.tsx             # Galaxy Watch 4 Classic chassis simulator
│   │   ├── WatchDial.tsx                # SVG 24-notch circular dial
│   │   ├── TimerRing.tsx                # Dynamic circular countdown timer
│   │   ├── CenterHub.tsx                # Tumbler pins & center readout
│   │   ├── StartScreen.tsx              # Difficulty & lifetime stats menu
│   │   ├── VaultCelebrationModal.tsx    # Confetti & victory loot modal
│   │   └── GameOverModal.tsx            # Lockdown & score summary modal
│   ├── hooks/useRotaryDial.ts           # Unified rotary bezel, wheel & drag handler
│   ├── utils/audio.ts                   # Web Audio synthesizer
│   └── utils/haptics.ts                 # Vibration & Capacitor haptics engine
└── capacitor.config.ts                  # Capacitor configuration
```

---

## 🚀 Getting Started

### 1. Web Simulator (Desktop Browser)

```bash
# Clone the repository
git clone https://github.com/LovableRelic000/Twinkie-Vault.git
cd Twinkie-Vault

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` to test with mouse scroll wheel (or touch drag) simulating the physical rotary bezel.

---

### 2. Building & Installing on Samsung Galaxy Watch 4 Classic

#### Prerequisites
- Samsung Galaxy Watch 4 Classic connected to the same Wi-Fi network.
- **Developer Options** enabled on the watch:
  1. Settings → About Watch → Software info → Tap **Software version** 7 times.
  2. Settings → Developer options → Enable **ADB debugging** and **Wireless debugging**.
  3. Note the IP address and Port under Wireless debugging (e.g., `10.0.0.28:41899`).

#### Compile & Deploy APK
```bash
# Compile native debug APK
./android/gradlew.bat -p android assembleDebug

# Connect via Wireless ADB
adb connect <WATCH_IP>:<WATCH_PORT>

# Install onto the watch
adb -s <WATCH_IP>:<WATCH_PORT> install -r ./android/app/build/outputs/apk/debug/app-debug.apk

# Launch the game
adb -s <WATCH_IP>:<WATCH_PORT> shell am start -n com.twinkievault.game/.WatchMainActivity
```

---

## 📄 License

MIT License. Crafted with precision for circular Wear OS smartwatches.
