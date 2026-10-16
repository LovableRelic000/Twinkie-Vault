package com.twinkievault.game

import android.os.Bundle
import android.view.MotionEvent
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }

    override fun dispatchGenericMotionEvent(event: MotionEvent): Boolean {
        // Wear OS Rotary Bezel / Rotary Input Hardware Hook
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
