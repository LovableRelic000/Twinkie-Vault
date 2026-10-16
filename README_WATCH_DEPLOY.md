# TwinkieVault — Samsung Galaxy Watch 4 Classic Deployment & Sideloading Guide

> **TwinkieVault** is a precision circular smartwatch micro-game built with **React 19 + TypeScript + Vite**, powered by **Capacitor 8** and optimized specifically for the **Samsung Galaxy Watch 4 Classic** (42mm `396x396px` and 46mm `450x450px` Super AMOLED circular display).

---

## 1. Hardware Specifications & OS Matrix

| Specification | Target Details |
|---|---|
| **Device Model** | Samsung Galaxy Watch 4 Classic (SM-R880 / SM-R890) |
| **Display** | Circular Super AMOLED (`396x396` px @ 330ppi or `450x450` px @ 330ppi) |
| **Processor** | Exynos W920 Dual-Core 1.18 GHz Cortex-A55, Mali-G68 GPU |
| **RAM / Storage** | 1.5 GB RAM, 16 GB Internal Storage |
| **Physical Input** | 24-Detent Mechanical Rotating Bezel (15° per physical detent click) |
| **Supported OS** | Wear OS 3.0 (Android 11 / API 30) through Wear OS 6 (Android 16 / API 36) |
| **Capacitor Android** | `minSdkVersion = 28`, `compileSdkVersion = 34`, `targetSdkVersion = 34` |

---

## 2. Rotary Input Pipeline Architecture

The Galaxy Watch 4 Classic has a physical rotating bezel with **24 mechanical detents per 360° turn** (15° per click). TwinkieVault implements a 3-layer redundant input system:

1. **Hardware Bezel / DOM Mouse Wheel (`wheel` event)**:
   - Listens to non-passive `wheel` events (`deltaY`).
   - Clamped with a `45ms` debounce threshold to prevent Android WebView scroll acceleration from skipping numbers.
2. **Native Wear OS Hardware Bridge (`MainActivity.java` / `MainActivity.kt`)**:
   - Captures `dispatchGenericMotionEvent(MotionEvent event)` for `MotionEvent.ACTION_SCROLL` on `MotionEvent.AXIS_SCROLL`.
   - Evaluates a synthetic DOM event: `window.dispatchEvent(new CustomEvent('watch-bezel', { detail: { direction } }))` directly into the Chromium WebView, ensuring 100% native compatibility across older Wear OS 3/4 builds.
3. **Circular Touch-Drag Fallback (`useRotaryDial.ts`)**:
   - Calculates polar angle relative to screen center via `Math.atan2(y - centerY, x - centerX)`.
   - Accumulates angular rotation; every `15°` increments (+1 CW) or decrements (-1 CCW) the dial.

---

## 3. Drop-in Native Bezel Bridge

### Kotlin Implementation (`MainActivity.kt`)
File location: `android/app/src/main/java/com/twinkievault/game/MainActivity.kt` (or see `android-snippets/MainActivity.kt`)

```kotlin
package com.twinkievault.game

import android.os.Bundle
import android.view.MotionEvent
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }

    override fun dispatchGenericMotionEvent(event: MotionEvent): Boolean {
        // Wear OS Physical Rotary Bezel Hardware Dispatch
        if (event.action == MotionEvent.ACTION_SCROLL) {
            val delta = -event.getAxisValue(MotionEvent.AXIS_SCROLL)
            if (delta != 0f) {
                val direction = if (delta > 0) 1 else -1
                bridge?.webView?.post {
                    bridge?.webView?.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('watch-bezel', { detail: { direction: $direction } }));",
                        null
                    )
                }
                return true
            }
        }
        return super.dispatchGenericMotionEvent(event)
    }
}
```

### Java Implementation (`MainActivity.java`)
Currently configured and active in `android/app/src/main/java/com/twinkievault/game/MainActivity.java`:

```java
package com.twinkievault.game;

import android.os.Bundle;
import android.view.MotionEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_SCROLL) {
            float delta = -event.getAxisValue(MotionEvent.AXIS_SCROLL);
            if (delta != 0) {
                final int direction = delta > 0 ? 1 : -1;
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().post(() -> {
                        getBridge().getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('watch-bezel', { detail: { direction: " + direction + " } }));",
                            null
                        );
                    });
                    return true;
                }
            }
        }
        return super.dispatchGenericMotionEvent(event);
    }
}
```

---

## 4. Wear OS Touch Configuration (`styles.xml`)

To prevent circular finger drags around the watch bezel from triggering Wear OS's default "swipe-to-dismiss" gesture and closing the game mid-spin, the window flag is disabled in `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:windowSwipeToDismiss">false</item>
    <item name="android:windowBackground">#000000</item>
</style>
```

---

## 5. Wireless ADB Step-by-Step Sideload Guide

### Step 5.1: Enable Developer Options & Wireless Debugging on Galaxy Watch 4
1. Connect your **Galaxy Watch 4 Classic** and your computer to the **same 2.4 GHz or 5 GHz Wi-Fi network**.
2. On your watch, swipe down and tap **Settings (⚙️)**.
3. Scroll to the bottom and select **About watch** > **Software info**.
4. Tap **Software version** repeatedly **7 times** until you see the toast: *"Developer mode turned on"*.
5. Go back to main **Settings** and tap the new **Developer options** menu.
6. Toggle **ADB debugging** to **ON**.
7. Scroll down to **Wireless debugging** and toggle it to **ON**.
   - Tap **Always allow on this network**.
   - Note down the **IP address and Port** shown on the screen (e.g. `192.168.1.120:41235`).

### Step 5.2: Pair Watch with Computer (One-time)
1. On the watch under **Wireless debugging**, tap **Pair new device**.
2. The watch will display:
   - **Wi-Fi pairing code** (e.g., `482910`)
   - **IP address & Port** (e.g., `192.168.1.120:39845` — *Note: the pairing port is different from the connection port!*)
3. In your terminal on your PC, execute:
   ```bash
   adb pair 192.168.1.120:39845
   # When prompted, enter the 6-digit Wi-Fi pairing code: 482910
   ```
4. Output will confirm: `Successfully paired to 192.168.1.120:39845`.

### Step 5.3: Connect ADB to Watch
Now connect to the main Wireless Debugging port (shown on the previous screen):
```bash
adb connect 192.168.1.120:41235
```
Verify the connection:
```bash
adb devices
# Output should list:
# 192.168.1.120:41235    device
```

### Step 5.4: Build & Sideload the APK
1. Compile the web assets and sync Capacitor:
   ```bash
   npm run build
   npx cap sync android
   ```
2. Build the Debug APK using Gradle:
   ```bash
   cd android
   ./gradlew assembleDebug
   cd ..
   ```
   *(On Windows PowerShell, use `.\android\gradlew.bat -p android assembleDebug`)*
3. Install the APK onto the watch:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. Launch the game directly from terminal:
   ```bash
   adb shell am start -n com.twinkievault.game/.MainActivity
   ```

### Step 5.5: Real-time Debugging & Logs
To monitor touch events, bezel rotary clicks, and Web Audio events in real-time:
```bash
adb logcat -s Capacitor:D TwinkieVault:V Chromium:D
```

---

## 6. Classroom Demo HUD & Presenter Guide

During a live presentation or grading demonstration:
- **Desktop Testing:** Use mouse wheel anywhere, use the left/right on-screen bezel test buttons, or press `ArrowLeft`/`ArrowRight`.
- **Classroom Demo Mode:** Double-tap the top status bar (or toggle the "Demo HUD" switch on desktop).
  - The secret target combination `[↻ T1, ↺ T2, ↻ T3]` will appear in a subtle HUD pill at the bottom.
  - The active tumbler is highlighted in cyan.
  - Demonstrate:
    1. Rotating clockwise toward `T1` triggers an amber tension glow when ±2 notches away.
    2. Hitting `T1` triggers a heavy `80ms` gate clunk.
    3. Holding for `600ms` (or tapping center) locks Pin 1 gold.
    4. Turning counter-clockwise toward `T2` and clockwise toward `T3` opens the vault with celebratory confetti and Golden Twinkie loot!
    5. Turning the wrong way flashes the red direction warning and triggers error haptics.
