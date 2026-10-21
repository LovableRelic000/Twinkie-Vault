package com.twinkievault.game;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.*;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.WindowManager;
import java.util.Random;

/**
 * 100% Native Wear OS Game Activity for Samsung Galaxy Watch 4 Classic
 * Features:
 * - Starting Screen with Difficulty Selection (Easy, Normal, Hard)
 * - Persistent High Scores via SharedPreferences
 * - Proper Level Timer Scaling (vaults always start with full baseline time)
 * - Hardware rotary bezel dispatch, haptic feedback, and procedural audio
 */
public class WatchMainActivity extends Activity implements SafeDialView.DialListener {

    private SafeDialView dialView;
    private SoundManager soundManager;
    private Vibrator vibrator;
    private SharedPreferences prefs;

    // Difficulty & Level Settings
    private SafeDialView.Difficulty currentDifficulty = SafeDialView.Difficulty.NORMAL;
    private int level = 1;
    private int[] targets = new int[3];
    private boolean[] directionsCW = { true, false, true };
    private boolean[] unlocked = { false, false, false };
    private int currentTumblerIndex = 0;

    private float timeLeft = 35f;
    private float totalTime = 35f;
    private boolean isDemoMode = false;

    private int safesCracked = 0;
    private int twinkiesCollected = 0;
    private int wrongDirectionStreak = 0;

    private Handler timerHandler = new Handler(Looper.getMainLooper());
    private Runnable timerRunnable;

    private Handler holdHandler = new Handler(Looper.getMainLooper());
    private Runnable holdRunnable;
    private long holdStartTime = 0;
    private boolean isHolding = false;

    private Random random = new Random();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen awake while playing
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        prefs = getSharedPreferences("twinkie_vault_prefs", Context.MODE_PRIVATE);
        soundManager = new SoundManager();
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        dialView = new SafeDialView(this);
        dialView.setDialListener(this);
        setContentView(dialView);

        // Show start screen initially
        showStartScreen();
    }

    private void showStartScreen() {
        stopTimer();
        cancelHold();
        int hs = getHighScore(currentDifficulty);
        dialView.setHighScore(hs);
        dialView.setLifetimeTwinkies(getLifetimeTwinkies());
        dialView.setDifficulty(currentDifficulty);
        dialView.setGameState(SafeDialView.GameState.START_SCREEN, safesCracked, twinkiesCollected);
    }

    private float getBaseTimeForDifficulty(SafeDialView.Difficulty diff) {
        switch (diff) {
            case EASY: return 45f;
            case HARD: return 22f;
            case NORMAL:
            default: return 35f;
        }
    }

    private int getWarmProximityDistance(SafeDialView.Difficulty diff) {
        return (diff == SafeDialView.Difficulty.HARD) ? 1 : 2;
    }

    private int getHighScore(SafeDialView.Difficulty diff) {
        return prefs.getInt("high_score_" + diff.name(), 0);
    }

    private int getLifetimeTwinkies() {
        return prefs.getInt("lifetime_twinkies", 0);
    }

    private void addLifetimeTwinkies(int count) {
        int updated = getLifetimeTwinkies() + count;
        prefs.edit().putInt("lifetime_twinkies", updated).apply();
        dialView.setLifetimeTwinkies(updated);
    }

    private void saveHighScore(SafeDialView.Difficulty diff, int score) {
        int currentBest = getHighScore(diff);
        if (score > currentBest) {
            prefs.edit().putInt("high_score_" + diff.name(), score).apply();
            dialView.setHighScore(score);
        }
    }

    @Override
    public void onStartGameTap() {
        vibrate(30);
        soundManager.playTick();
        startNewGame();
    }

    @Override
    public void onDifficultySelect(SafeDialView.Difficulty diff) {
        this.currentDifficulty = diff;
        vibrate(20);
        soundManager.playTick();
        dialView.setHighScore(getHighScore(diff));
    }

    private void startNewGame() {
        level = 1;
        safesCracked = 0;
        twinkiesCollected = 0;
        setupLevel();
        startTimer();
    }

    private void setupLevel() {
        // Generate 3 combination targets at least 4 notches apart circularly
        targets[0] = random.nextInt(24);

        int t2 = random.nextInt(24);
        while (getCircularDistance(targets[0], t2) < 4) {
            t2 = random.nextInt(24);
        }
        targets[1] = t2;

        int t3 = random.nextInt(24);
        while (getCircularDistance(targets[1], t3) < 4) {
            t3 = random.nextInt(24);
        }
        targets[2] = t3;

        unlocked[0] = false;
        unlocked[1] = false;
        unlocked[2] = false;
        currentTumblerIndex = 0;
        wrongDirectionStreak = 0;
        cancelHold();

        // Fresh Level Timer based on Difficulty!
        totalTime = getBaseTimeForDifficulty(currentDifficulty);
        timeLeft = totalTime;

        // Pick a starting position away from Target 0
        int startPos = (targets[0] + 7) % 24;
        dialView.setPosition(startPos, false);
        dialView.setTension(SafeDialView.Tension.NONE, false);
        dialView.setGameState(SafeDialView.GameState.PLAYING, safesCracked, twinkiesCollected);
        updateView();
    }

    private int getCircularDistance(int a, int b) {
        int diff = Math.abs(a - b);
        return Math.min(diff, 24 - diff);
    }

    private void startTimer() {
        stopTimer();
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                timeLeft -= 0.1f;
                if (timeLeft <= 0) {
                    timeLeft = 0;
                    onGameOver();
                    return;
                }
                updateView();
                timerHandler.postDelayed(this, 100);
            }
        };
        timerHandler.postDelayed(timerRunnable, 100);
    }

    private void stopTimer() {
        if (timerRunnable != null) {
            timerHandler.removeCallbacks(timerRunnable);
        }
    }

    private void updateView() {
        dialView.updateGameData(level, currentTumblerIndex, targets, directionsCW, unlocked, timeLeft, totalTime, isDemoMode);
    }

    // =========================================================================
    // DIAL STEP & GAMEPLAY LOGIC
    // =========================================================================
    @Override
    public void onDialStep(int newPosition, boolean isClockwise) {
        boolean requiredDir = directionsCW[currentTumblerIndex];
        int target = targets[currentTumblerIndex];

        // Check if spinning in the wrong direction
        if (isClockwise != requiredDir) {
            wrongDirectionStreak++;
            cancelHold();
            if (wrongDirectionStreak > 2) {
                dialView.setTension(SafeDialView.Tension.NONE, true);
                soundManager.playErrorBuzz();
                vibratePattern(new long[]{ 0, 60, 40, 60 });
            } else {
                soundManager.playTick();
                vibrate(10);
            }
            return;
        }

        // Correct direction
        wrongDirectionStreak = 0;

        if (newPosition == target) {
            // EXACT GATE ALIGNMENT!
            dialView.setTension(SafeDialView.Tension.ALIGNED, false);
            soundManager.playGateClunk();
            vibrate(80); // Heavy 80ms thud
            startHoldCountdown();
        } else {
            cancelHold();
            int dist = getCircularDistance(newPosition, target);
            if (dist <= getWarmProximityDistance(currentDifficulty)) {
                // WARM PROXIMITY ZONE
                dialView.setTension(SafeDialView.Tension.WARM, false);
                vibrate(25);
            } else {
                dialView.setTension(SafeDialView.Tension.NONE, false);
                soundManager.playTick();
                vibrate(10);
            }
        }
    }

    private void startHoldCountdown() {
        cancelHold();
        isHolding = true;
        holdStartTime = SystemClock.uptimeMillis();
        holdRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isHolding) return;
                long elapsed = SystemClock.uptimeMillis() - holdStartTime;
                float progress = Math.min(1f, elapsed / 600f);
                dialView.setHoldProgress(progress);

                if (progress >= 1f) {
                    lockCurrentTumbler();
                } else {
                    holdHandler.postDelayed(this, 16);
                }
            }
        };
        holdHandler.post(holdRunnable);
    }

    private void cancelHold() {
        isHolding = false;
        dialView.setHoldProgress(0f);
        if (holdRunnable != null) {
            holdHandler.removeCallbacks(holdRunnable);
        }
    }

    @Override
    public void onCenterTap() {
        if (isHolding || dialView != null) {
            lockCurrentTumbler();
        }
    }

    private void lockCurrentTumbler() {
        cancelHold();
        soundManager.playTumblerLock();
        vibratePattern(new long[]{ 0, 40, 50, 90 }); // Double-pulse latch haptic

        unlocked[currentTumblerIndex] = true;

        if (currentTumblerIndex >= 2) {
            // ALL 3 TUMBLERS SOLVED! VAULT OPENED!
            stopTimer();
            soundManager.playVaultOpen();
            vibratePattern(new long[]{ 0, 100, 50, 100, 50, 200 }); // Celebration haptic

            safesCracked++;
            twinkiesCollected += 3;
            addLifetimeTwinkies(3);
            saveHighScore(currentDifficulty, safesCracked);

            dialView.setGameState(SafeDialView.GameState.CLEARED, safesCracked, twinkiesCollected);
        } else {
            currentTumblerIndex++;
            dialView.setTension(SafeDialView.Tension.NONE, false);
        }
        updateView();
    }

    private void onGameOver() {
        cancelHold();
        stopTimer();
        soundManager.playErrorBuzz();
        vibratePattern(new long[]{ 0, 60, 40, 60 });
        saveHighScore(currentDifficulty, safesCracked);
        dialView.setGameState(SafeDialView.GameState.GAMEOVER, safesCracked, twinkiesCollected);
    }

    @Override
    public void onNextLevelTap() {
        level++;
        setupLevel();
        startTimer();
    }

    @Override
    public void onRetryTap() {
        showStartScreen();
    }

    @Override
    public void onBackTap() {
        vibrate(25);
        soundManager.playTick();
        showStartScreen();
    }

    @Override
    public void onTopDoubleTap() {
        isDemoMode = !isDemoMode;
        vibrate(30);
        updateView();
    }

    // =========================================================================
    // HARDWARE BACK BUTTON INTERCEPT (Stops session instead of killing app)
    // =========================================================================
    @Override
    public void onBackPressed() {
        if (dialView != null && dialView.getGameState() != SafeDialView.GameState.START_SCREEN) {
            vibrate(25);
            soundManager.playTick();
            showStartScreen();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (dialView != null && dialView.getGameState() != SafeDialView.GameState.START_SCREEN) {
                vibrate(25);
                soundManager.playTick();
                showStartScreen();
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    // =========================================================================
    // NATIVE ROTARY BEZEL EVENT DISPATCH
    // =========================================================================
    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent event) {
        if (dialView != null && dialView.onGenericMotionEvent(event)) {
            return true;
        }
        return super.dispatchGenericMotionEvent(event);
    }

    // =========================================================================
    // HAPTIC ENGINE
    // =========================================================================
    private void vibrate(long ms) {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            vibrator.vibrate(ms);
        }
    }

    private void vibratePattern(long[] timings) {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, -1));
        } else {
            vibrator.vibrate(timings, -1);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopTimer();
        cancelHold();
        if (soundManager != null) {
            soundManager.release();
        }
    }
}
