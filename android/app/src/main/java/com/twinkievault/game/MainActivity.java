package com.twinkievault.game;

import android.os.Bundle;
import android.view.InputDevice;
import android.view.MotionEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent event) {
        // Wear OS Rotary Bezel / Rotary Input Hardware Hook
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
