package com.twinkievault.game;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.*;
import android.os.SystemClock;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.view.animation.DecelerateInterpolator;

/**
 * 100% Native Wear OS 60fps Safe Dial Canvas View
 * Features:
 * - Starting Screen with Difficulty Selection & High Scores
 * - 24-notch rotating mechanical dial (15° per detent)
 * - Fixed 12 o'clock crimson triangular notch
 * - Dynamic circular countdown timer stroke (Emerald -> Amber -> Red)
 * - 3 Tumbler pin indicators (unlocked, active, gold solved)
 * - 600ms radial hold-to-lock sweep progress ring
 * - Hardware rotary bezel handler (AXIS_SCROLL) + circular touch drag
 */
public class SafeDialView extends View {

    public enum Difficulty { EASY, NORMAL, HARD }

    public interface DialListener {
        void onDialStep(int newPosition, boolean isClockwise);
        void onCenterTap();
        void onTopDoubleTap();
        void onNextLevelTap();
        void onRetryTap();
        void onStartGameTap();
        void onDifficultySelect(Difficulty diff);
        void onBackTap();
    }

    private DialListener listener;

    // Dial state
    private int currentPosition = 0;
    private float visualAngle = 0f; // degrees
    private ValueAnimator angleAnimator;

    // Tension & Feedback
    public enum Tension { NONE, WARM, ALIGNED }
    private Tension tensionLevel = Tension.NONE;
    private boolean wrongDirectionWarning = false;
    private float holdProgress = 0f; // 0.0 to 1.0

    // Game display info
    private int level = 1;
    private int currentTumblerIndex = 0;
    private int[] tumblerTargets = { 7, 18, 3 };
    private boolean[] tumblerDirectionsCW = { true, false, true };
    private boolean[] tumblerUnlocked = { false, false, false };

    private float timeLeft = 35f;
    private float totalTime = 35f;
    private boolean isDemoMode = false;

    // Game state overlays
    public enum GameState { START_SCREEN, PLAYING, CLEARED, GAMEOVER }
    private GameState gameState = GameState.START_SCREEN;
    private Difficulty selectedDifficulty = Difficulty.NORMAL;
    private int safesCracked = 0;
    private int twinkiesCollected = 0;
    private int lifetimeTwinkies = 0;
    private int highScore = 0;

    // Paints
    private Paint bgPaint;
    private Paint dialBasePaint;
    private Paint knurlPaint;
    private Paint notchMajorPaint;
    private Paint notchMinorPaint;
    private Paint textMajorPaint;
    private Paint textMinorPaint;
    private Paint needlePaint;
    private Paint needleGlowPaint;
    private Paint timerBgPaint;
    private Paint timerArcPaint;
    private Paint tensionPaint;
    private Paint hubPaint;
    private Paint hubBorderPaint;
    private Paint readoutPaint;
    private Paint promptPaint;
    private Paint holdProgressPaint;
    private Paint overlayBgPaint;
    private Paint bannerPaint;
    private Paint bannerTextPaint;
    private Paint statusTextPaint;

    // Touch & Drag state
    private float lastTouchAngle = 0f;
    private float accumulatedTouchAngle = 0f;
    private boolean isDragging = false;
    private long lastBezelTime = 0;
    private long lastTopTapTime = 0;

    public SafeDialView(Context context) {
        super(context);
        init();
    }

    public SafeDialView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        setFocusable(true);
        setFocusableInTouchMode(true);

        bgPaint = new Paint();
        bgPaint.setColor(Color.BLACK);
        bgPaint.setStyle(Paint.Style.FILL);

        dialBasePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        dialBasePaint.setColor(0xFF0F172A);
        dialBasePaint.setStyle(Paint.Style.FILL);

        knurlPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        knurlPaint.setColor(0xFF64748B);
        knurlPaint.setStrokeWidth(2f);

        notchMajorPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        notchMajorPaint.setColor(0xFFF8FAFC);
        notchMajorPaint.setStrokeWidth(3.5f);
        notchMajorPaint.setStrokeCap(Paint.Cap.ROUND);

        notchMinorPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        notchMinorPaint.setColor(0xFF64748B);
        notchMinorPaint.setStrokeWidth(2f);
        notchMinorPaint.setStrokeCap(Paint.Cap.ROUND);

        textMajorPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textMajorPaint.setColor(0xFFF8FAFC);
        textMajorPaint.setTextSize(18f);
        textMajorPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        textMajorPaint.setTextAlign(Paint.Align.CENTER);

        textMinorPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textMinorPaint.setColor(0xFF94A3B8);
        textMinorPaint.setTextSize(14f);
        textMinorPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL));
        textMinorPaint.setTextAlign(Paint.Align.CENTER);

        needlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        needlePaint.setColor(0xFFEF4444);
        needlePaint.setStyle(Paint.Style.FILL);

        needleGlowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        needleGlowPaint.setColor(0x88EF4444);
        needleGlowPaint.setStyle(Paint.Style.STROKE);
        needleGlowPaint.setStrokeWidth(3f);

        timerBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        timerBgPaint.setColor(0x33334155);
        timerBgPaint.setStyle(Paint.Style.STROKE);
        timerBgPaint.setStrokeWidth(5f);

        timerArcPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        timerArcPaint.setColor(0xFF10B981);
        timerArcPaint.setStyle(Paint.Style.STROKE);
        timerArcPaint.setStrokeWidth(5f);
        timerArcPaint.setStrokeCap(Paint.Cap.ROUND);

        tensionPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        tensionPaint.setStyle(Paint.Style.STROKE);
        tensionPaint.setStrokeWidth(4f);

        hubPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        hubPaint.setColor(0xFF090D16);
        hubPaint.setStyle(Paint.Style.FILL);

        hubBorderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        hubBorderPaint.setStyle(Paint.Style.STROKE);
        hubBorderPaint.setStrokeWidth(3f);
        hubBorderPaint.setColor(0xFF334155);

        readoutPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        readoutPaint.setColor(Color.WHITE);
        readoutPaint.setTextSize(46f);
        readoutPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        readoutPaint.setTextAlign(Paint.Align.CENTER);

        promptPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        promptPaint.setColor(0xFF38BDF8);
        promptPaint.setTextSize(14f);
        promptPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        promptPaint.setTextAlign(Paint.Align.CENTER);

        holdProgressPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        holdProgressPaint.setColor(0xFF10B981);
        holdProgressPaint.setStyle(Paint.Style.STROKE);
        holdProgressPaint.setStrokeWidth(6f);
        holdProgressPaint.setStrokeCap(Paint.Cap.ROUND);

        overlayBgPaint = new Paint();
        overlayBgPaint.setColor(0xF2000000);
        overlayBgPaint.setStyle(Paint.Style.FILL);

        bannerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bannerPaint.setStyle(Paint.Style.FILL);

        bannerTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bannerTextPaint.setColor(Color.WHITE);
        bannerTextPaint.setTextSize(20f);
        bannerTextPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        bannerTextPaint.setTextAlign(Paint.Align.CENTER);

        statusTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        statusTextPaint.setColor(0xFF94A3B8);
        statusTextPaint.setTextSize(14f);
        statusTextPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        statusTextPaint.setTextAlign(Paint.Align.CENTER);
    }

    public void setDialListener(DialListener listener) {
        this.listener = listener;
    }

    public void setPosition(int pos, boolean animate) {
        this.currentPosition = (pos % 24 + 24) % 24;
        int targetAngle = -this.currentPosition * 15;
        if (animate) {
            if (angleAnimator != null && angleAnimator.isRunning()) {
                angleAnimator.cancel();
            }
            angleAnimator = ValueAnimator.ofFloat(visualAngle, targetAngle);
            angleAnimator.setDuration(70);
            angleAnimator.setInterpolator(new DecelerateInterpolator());
            angleAnimator.addUpdateListener(anim -> {
                visualAngle = (float) anim.getAnimatedValue();
                invalidate();
            });
            angleAnimator.start();
        } else {
            visualAngle = targetAngle;
            invalidate();
        }
    }

    public void setTension(Tension tension, boolean wrongDir) {
        this.tensionLevel = tension;
        this.wrongDirectionWarning = wrongDir;
        invalidate();
    }

    public void setHoldProgress(float progress) {
        this.holdProgress = Math.max(0f, Math.min(1f, progress));
        invalidate();
    }

    public void updateGameData(int level, int tumblerIdx, int[] targets, boolean[] directions, boolean[] unlocked, float timeLeft, float totalTime, boolean demo) {
        this.level = level;
        this.currentTumblerIndex = tumblerIdx;
        this.tumblerTargets = targets;
        this.tumblerDirectionsCW = directions;
        this.tumblerUnlocked = unlocked;
        this.timeLeft = timeLeft;
        this.totalTime = totalTime;
        this.isDemoMode = demo;
        invalidate();
    }

    public void setGameState(GameState state, int safesCracked, int twinkiesCollected) {
        this.gameState = state;
        this.safesCracked = safesCracked;
        this.twinkiesCollected = twinkiesCollected;
        invalidate();
    }

    public void setDifficulty(Difficulty diff) {
        this.selectedDifficulty = diff;
        invalidate();
    }

    public Difficulty getDifficulty() {
        return selectedDifficulty;
    }

    public void setHighScore(int score) {
        this.highScore = score;
        invalidate();
    }

    public void setLifetimeTwinkies(int count) {
        this.lifetimeTwinkies = count;
        invalidate();
    }

    public GameState getGameState() {
        return gameState;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int w = getWidth();
        int h = getHeight();
        float cx = w / 2f;
        float cy = h / 2f;
        float radius = Math.min(cx, cy);

        // 1. Pure AMOLED Black Background
        canvas.drawRect(0, 0, w, h, bgPaint);

        // If on START SCREEN, render dedicated start interface
        if (gameState == GameState.START_SCREEN) {
            drawStartScreen(canvas, cx, cy, radius);
            return;
        }

        // 2. Rotating Safe Dial Assembly
        canvas.save();
        canvas.rotate(visualAngle, cx, cy);

        // Dial base disc
        canvas.drawCircle(cx, cy, radius - 4, dialBasePaint);

        // Knurled teeth (72 teeth around the perimeter)
        for (int k = 0; k < 72; k++) {
            float ang = (float) Math.toRadians(k * 5.0 - 90);
            float x1 = cx + (radius - 2) * (float) Math.cos(ang);
            float y1 = cy + (radius - 2) * (float) Math.sin(ang);
            float x2 = cx + (radius - 8) * (float) Math.cos(ang);
            float y2 = cy + (radius - 8) * (float) Math.sin(ang);
            canvas.drawLine(x1, y1, x2, y2, knurlPaint);
        }

        // 24 Notches & Numbers
        for (int i = 0; i < 24; i++) {
            float deg = i * 15f;
            float rad = (float) Math.toRadians(deg - 90);
            boolean isMajor = (i % 3 == 0);

            float rOuter = radius - 10;
            float rInner = isMajor ? radius - 30 : radius - 22;

            float x1 = cx + rOuter * (float) Math.cos(rad);
            float y1 = cy + rOuter * (float) Math.sin(rad);
            float x2 = cx + rInner * (float) Math.cos(rad);
            float y2 = cy + rInner * (float) Math.sin(rad);

            canvas.drawLine(x1, y1, x2, y2, isMajor ? notchMajorPaint : notchMinorPaint);

            // Numbers
            float rText = radius - 44;
            float tx = cx + rText * (float) Math.cos(rad);
            float ty = cy + rText * (float) Math.sin(rad);

            canvas.save();
            canvas.rotate(deg, tx, ty);
            String label = i < 10 ? "0" + i : String.valueOf(i);
            canvas.drawText(label, tx, ty + 6, isMajor ? textMajorPaint : textMinorPaint);
            canvas.restore();
        }

        canvas.restore(); // Restore rotating group

        // 3. Circular Countdown Timer Arc
        float timerRadius = radius - 62;
        RectF timerBounds = new RectF(cx - timerRadius, cy - timerRadius, cx + timerRadius, cy + timerRadius);
        canvas.drawCircle(cx, cy, timerRadius, timerBgPaint);

        float timerRatio = Math.max(0f, Math.min(1f, timeLeft / totalTime));
        if (timerRatio > 0.45f) {
            timerArcPaint.setColor(0xFF10B981); // Emerald
        } else if (timerRatio > 0.20f) {
            timerArcPaint.setColor(0xFFF59E0B); // Amber
        } else {
            timerArcPaint.setColor(0xFFEF4444); // Red
        }
        canvas.drawArc(timerBounds, -90, 360f * timerRatio, false, timerArcPaint);

        // 4. Fixed 12 o'clock Crimson Needle
        Path needle = new Path();
        needle.moveTo(cx - 8, 4);
        needle.lineTo(cx + 8, 4);
        needle.lineTo(cx, 26);
        needle.close();
        canvas.drawPath(needle, needlePaint);
        canvas.drawPath(needle, needleGlowPaint);

        // 5. Tension Glow Ring
        if (tensionLevel != Tension.NONE) {
            tensionPaint.setColor(tensionLevel == Tension.ALIGNED ? 0xFF10B981 : 0xFFF59E0B);
            canvas.drawCircle(cx, cy, timerRadius - 6, tensionPaint);
        }

        // 6. Top: 3 Tumbler Pin Statuses
        float pinY = cy - 82;
        for (int p = 0; p < 3; p++) {
            float px = cx + (p - 1) * 26;
            boolean isSolved = tumblerUnlocked[p];
            boolean isActive = (p == currentTumblerIndex) && !isSolved;

            Paint pinPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            if (isSolved) {
                pinPaint.setColor(0xFFF59E0B); // Gold
                canvas.drawCircle(px, pinY, 9, pinPaint);
                // Checkmark
                Paint checkPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                checkPaint.setColor(Color.BLACK);
                checkPaint.setStrokeWidth(2.5f);
                canvas.drawLine(px - 4, pinY, px - 1, pinY + 3, checkPaint);
                canvas.drawLine(px - 1, pinY + 3, px + 5, pinY - 4, checkPaint);
            } else if (isActive) {
                pinPaint.setColor(0xFF0F172A);
                canvas.drawCircle(px, pinY, 9, pinPaint);
                Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG);
                stroke.setStyle(Paint.Style.STROKE);
                stroke.setStrokeWidth(2.5f);
                stroke.setColor(0xFF38BDF8); // Cyan
                canvas.drawCircle(px, pinY, 9, stroke);

                // Direction glyph
                Paint arrowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                arrowPaint.setColor(0xFF38BDF8);
                arrowPaint.setTextSize(11f);
                arrowPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
                arrowPaint.setTextAlign(Paint.Align.CENTER);
                canvas.drawText(tumblerDirectionsCW[p] ? "↻" : "↺", px, pinY + 4, arrowPaint);
            } else {
                pinPaint.setColor(0xFF1E293B);
                canvas.drawCircle(px, pinY, 7, pinPaint);
            }
        }

        // Timer remaining seconds text below pins
        statusTextPaint.setTextSize(13f);
        statusTextPaint.setColor(0xFF94A3B8);
        canvas.drawText(Math.round(timeLeft) + "s", cx, cy - 64, statusTextPaint);

        // 7. Center Interactive Hub
        float hubRadius = 56;
        if (wrongDirectionWarning) {
            hubBorderPaint.setColor(0xFFEF4444);
            readoutPaint.setColor(0xFFEF4444);
        } else if (tensionLevel == Tension.ALIGNED) {
            hubBorderPaint.setColor(0xFF10B981);
            readoutPaint.setColor(0xFF6EE7B7);
        } else if (tensionLevel == Tension.WARM) {
            hubBorderPaint.setColor(0xFFF59E0B);
            readoutPaint.setColor(0xFFFDE68A);
        } else {
            hubBorderPaint.setColor(0xFF334155);
            readoutPaint.setColor(Color.WHITE);
        }

        canvas.drawCircle(cx, cy, hubRadius, hubPaint);
        canvas.drawCircle(cx, cy, hubRadius, hubBorderPaint);

        // 600ms Hold Sweep Progress Arc
        if (holdProgress > 0) {
            RectF holdBounds = new RectF(cx - hubRadius + 3, cy - hubRadius + 3, cx + hubRadius - 3, cy + hubRadius - 3);
            canvas.drawArc(holdBounds, -90, 360f * holdProgress, false, holdProgressPaint);
        }

        // Center readout digits ("00" to "23")
        String posText = currentPosition < 10 ? "0" + currentPosition : String.valueOf(currentPosition);
        canvas.drawText(posText, cx, cy + 12, readoutPaint);

        // Direction / Action Prompt inside hub
        if (wrongDirectionWarning) {
            promptPaint.setColor(0xFFEF4444);
            canvas.drawText("WRONG WAY", cx, cy + 32, promptPaint);
        } else if (tensionLevel == Tension.ALIGNED) {
            promptPaint.setColor(0xFF10B981);
            canvas.drawText("TAP / HOLD", cx, cy + 32, promptPaint);
        } else {
            promptPaint.setColor(0xFF38BDF8);
            boolean cw = tumblerDirectionsCW[currentTumblerIndex];
            canvas.drawText(cw ? "↻ SPIN CW" : "↺ SPIN CCW", cx, cy + 32, promptPaint);
        }

        // 8. Bottom: Level & Pin count
        statusTextPaint.setTextSize(13f);
        canvas.drawText("LVL " + level, cx - 44, cy + 86, statusTextPaint);
        canvas.drawText("PIN " + (currentTumblerIndex + 1) + "/3", cx + 44, cy + 86, statusTextPaint);

        // 9. Classroom Demo HUD Pill
        if (isDemoMode) {
            Paint demoBg = new Paint(Paint.ANTI_ALIAS_FLAG);
            demoBg.setColor(0xDD083344);
            RectF demoPill = new RectF(cx - 75, cy + 106, cx + 75, cy + 130);
            canvas.drawRoundRect(demoPill, 12, 12, demoBg);

            Paint demoBorder = new Paint(Paint.ANTI_ALIAS_FLAG);
            demoBorder.setStyle(Paint.Style.STROKE);
            demoBorder.setStrokeWidth(1.5f);
            demoBorder.setColor(0xFF06B6D4);
            canvas.drawRoundRect(demoPill, 12, 12, demoBorder);

            Paint demoText = new Paint(Paint.ANTI_ALIAS_FLAG);
            demoText.setColor(0xFF67E8F9);
            demoText.setTextSize(12f);
            demoText.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
            demoText.setTextAlign(Paint.Align.CENTER);

            String demoStr = String.format("%s%02d  %s%02d  %s%02d",
                    tumblerDirectionsCW[0] ? "↻" : "↺", tumblerTargets[0],
                    tumblerDirectionsCW[1] ? "↻" : "↺", tumblerTargets[1],
                    tumblerDirectionsCW[2] ? "↻" : "↺", tumblerTargets[2]);
            canvas.drawText(demoStr, cx, cy + 122, demoText);
        }

        // 9b. On-Screen Back / Stop Session Buttons
        if (gameState == GameState.PLAYING) {
            // Top-Left Circular Back Button
            Paint backBtnBg = new Paint(Paint.ANTI_ALIAS_FLAG);
            backBtnBg.setColor(0xDD1E293B);
            canvas.drawCircle(cx - 96, cy - 88, 17f, backBtnBg);

            Paint backBtnBorder = new Paint(Paint.ANTI_ALIAS_FLAG);
            backBtnBorder.setStyle(Paint.Style.STROKE);
            backBtnBorder.setStrokeWidth(1.5f);
            backBtnBorder.setColor(0xFF475569);
            canvas.drawCircle(cx - 96, cy - 88, 17f, backBtnBorder);

            Paint backBtnText = new Paint(Paint.ANTI_ALIAS_FLAG);
            backBtnText.setColor(0xFFF1F5F9);
            backBtnText.setTextSize(13f);
            backBtnText.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
            backBtnText.setTextAlign(Paint.Align.CENTER);
            canvas.drawText("❮", cx - 96, cy - 83, backBtnText);

            // Subtle Quit Session Pill at Bottom (when demo mode is off)
            if (!isDemoMode) {
                Paint stopPillBg = new Paint(Paint.ANTI_ALIAS_FLAG);
                stopPillBg.setColor(0xBB0F172A);
                RectF stopPill = new RectF(cx - 62, cy + 110, cx + 62, cy + 132);
                canvas.drawRoundRect(stopPill, 11, 11, stopPillBg);

                Paint stopPillBorder = new Paint(Paint.ANTI_ALIAS_FLAG);
                stopPillBorder.setStyle(Paint.Style.STROKE);
                stopPillBorder.setStrokeWidth(1.5f);
                stopPillBorder.setColor(0xFF334155);
                canvas.drawRoundRect(stopPill, 11, 11, stopPillBorder);

                Paint stopPillText = new Paint(Paint.ANTI_ALIAS_FLAG);
                stopPillText.setColor(0xFF94A3B8);
                stopPillText.setTextSize(10f);
                stopPillText.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
                stopPillText.setTextAlign(Paint.Align.CENTER);
                canvas.drawText("❮ QUIT SESSION", cx, cy + 124, stopPillText);
            }
        }

        // 10. GAME OVER / VAULT CRACKED OVERLAYS
        if (gameState == GameState.CLEARED) {
            drawClearedOverlay(canvas, cx, cy);
        } else if (gameState == GameState.GAMEOVER) {
            drawGameOverOverlay(canvas, cx, cy);
        }
    }

    // =========================================================================
    // START SCREEN OVERLAY WITH DIFFICULTY SELECTION & HIGH SCORES
    // =========================================================================
    private void drawStartScreen(Canvas canvas, float cx, float cy, float radius) {
        // Outer decorative bezel track
        Paint trackPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        trackPaint.setStyle(Paint.Style.STROKE);
        trackPaint.setStrokeWidth(2f);
        trackPaint.setColor(0xFF1E293B);
        canvas.drawCircle(cx, cy, radius - 12, trackPaint);

        // Title: "TWINKIE VAULT"
        Paint titlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        titlePaint.setColor(0xFFF59E0B); // Amber Gold
        titlePaint.setTextSize(22f);
        titlePaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        titlePaint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("TWINKIE VAULT", cx, cy - 102, titlePaint);

        // High Score display
        Paint hsPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        hsPaint.setColor(0xFFFCD34D); // Light Gold
        hsPaint.setTextSize(12.5f);
        hsPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        hsPaint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("🏆 BEST: " + highScore + " SAFES", cx, cy - 80, hsPaint);

        // Golden Twinkie Icon
        Paint twinkiePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        twinkiePaint.setColor(0xFFF59E0B);
        RectF twinkie = new RectF(cx - 32, cy - 65, cx + 32, cy - 35);
        canvas.drawRoundRect(twinkie, 15, 15, twinkiePaint);

        Paint creamDot = new Paint(Paint.ANTI_ALIAS_FLAG);
        creamDot.setColor(Color.WHITE);
        canvas.drawCircle(cx - 15, cy - 50, 3f, creamDot);
        canvas.drawCircle(cx, cy - 50, 3f, creamDot);
        canvas.drawCircle(cx + 15, cy - 50, 3f, creamDot);

        // Lifetime Twinkies Badge
        Paint lifetimePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        lifetimePaint.setColor(0xFFFDE68A); // Warm golden text
        lifetimePaint.setTextSize(12f);
        lifetimePaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        lifetimePaint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("✨ " + lifetimeTwinkies + " LIFETIME TWINKIES", cx, cy - 19, lifetimePaint);

        // Difficulty Title
        statusTextPaint.setTextSize(10f);
        statusTextPaint.setColor(0xFF94A3B8);
        canvas.drawText("CHOOSE DIFFICULTY", cx, cy - 2, statusTextPaint);

        // 3 Difficulty Selector Pills
        drawDifficultyPills(canvas, cx, cy + 22);

        // Big "START CRACKING ▶" Button
        Paint startBtnPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        startBtnPaint.setColor(0xFF10B981); // Emerald
        RectF startBtn = new RectF(cx - 78, cy + 54, cx + 78, cy + 96);
        canvas.drawRoundRect(startBtn, 21, 21, startBtnPaint);

        Paint startTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        startTextPaint.setColor(Color.BLACK);
        startTextPaint.setTextSize(15f);
        startTextPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        startTextPaint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("START CRACKING ▶", cx, cy + 81, startTextPaint);

        // Rotary Bezel Tip
        Paint hintPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        hintPaint.setColor(0xFF64748B);
        hintPaint.setTextSize(10.5f);
        hintPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL));
        hintPaint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("↻ Rotate Bezel to Switch Mode", cx, cy + 120, hintPaint);
    }

    private void drawDifficultyPills(Canvas canvas, float cx, float cy) {
        String[] diffLabels = { "EASY", "NORMAL", "HARD" };
        Difficulty[] diffs = { Difficulty.EASY, Difficulty.NORMAL, Difficulty.HARD };

        float pillW = 54f;
        float pillH = 26f;
        float spacing = 6f;
        float startX = cx - (3 * pillW + 2 * spacing) / 2f;

        Paint pillBg = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint pillBorder = new Paint(Paint.ANTI_ALIAS_FLAG);
        pillBorder.setStyle(Paint.Style.STROKE);
        pillBorder.setStrokeWidth(2f);

        Paint pillText = new Paint(Paint.ANTI_ALIAS_FLAG);
        pillText.setTextSize(11.5f);
        pillText.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        pillText.setTextAlign(Paint.Align.CENTER);

        for (int i = 0; i < 3; i++) {
            float px = startX + i * (pillW + spacing);
            RectF pillRect = new RectF(px, cy - pillH / 2f, px + pillW, cy + pillH / 2f);
            boolean isSelected = (selectedDifficulty == diffs[i]);

            if (isSelected) {
                if (diffs[i] == Difficulty.EASY) {
                    pillBg.setColor(0xFF064E3B);
                    pillBorder.setColor(0xFF10B981);
                    pillText.setColor(0xFF6EE7B7);
                } else if (diffs[i] == Difficulty.NORMAL) {
                    pillBg.setColor(0xFF451A03);
                    pillBorder.setColor(0xFFF59E0B);
                    pillText.setColor(0xFFFDE68A);
                } else {
                    pillBg.setColor(0xFF4C0519);
                    pillBorder.setColor(0xFFEF4444);
                    pillText.setColor(0xFFFCA5A5);
                }
            } else {
                pillBg.setColor(0xFF0F172A);
                pillBorder.setColor(0xFF334155);
                pillText.setColor(0xFF64748B);
            }

            canvas.drawRoundRect(pillRect, 8, 8, pillBg);
            canvas.drawRoundRect(pillRect, 8, 8, pillBorder);
            canvas.drawText(diffLabels[i], px + pillW / 2f, cy + 4, pillText);
        }
    }

    private void drawClearedOverlay(Canvas canvas, float cx, float cy) {
        canvas.drawRect(0, 0, getWidth(), getHeight(), overlayBgPaint);

        bannerPaint.setColor(0xFFF59E0B);
        RectF banner = new RectF(cx - 95, cy - 80, cx + 95, cy - 45);
        canvas.drawRoundRect(banner, 18, 18, bannerPaint);

        bannerTextPaint.setColor(Color.BLACK);
        bannerTextPaint.setTextSize(15f);
        canvas.drawText("VAULT " + level + " CRACKED!", cx, cy - 58, bannerTextPaint);

        // Golden Twinkie Icon
        Paint twinkiePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        twinkiePaint.setColor(0xFFF59E0B);
        RectF twinkie = new RectF(cx - 36, cy - 30, cx + 36, cy + 6);
        canvas.drawRoundRect(twinkie, 16, 16, twinkiePaint);

        Paint creamDot = new Paint(Paint.ANTI_ALIAS_FLAG);
        creamDot.setColor(Color.WHITE);
        canvas.drawCircle(cx - 18, cy - 12, 3.5f, creamDot);
        canvas.drawCircle(cx, cy - 12, 3.5f, creamDot);
        canvas.drawCircle(cx + 18, cy - 12, 3.5f, creamDot);

        // Loot & Bonus text
        statusTextPaint.setTextSize(14f);
        statusTextPaint.setColor(0xFFFCD34D);
        canvas.drawText("+3 GOLDEN TWINKIES!", cx, cy + 22, statusTextPaint);

        statusTextPaint.setTextSize(12f);
        statusTextPaint.setColor(0xFFFDE68A);
        canvas.drawText("✨ Lifetime: " + lifetimeTwinkies + " Twinkies", cx, cy + 39, statusTextPaint);

        statusTextPaint.setTextSize(12f);
        statusTextPaint.setColor(0xFF34D399);
        canvas.drawText("Fresh Timer Ready", cx, cy + 54, statusTextPaint);

        // Next Button
        Paint btnPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        btnPaint.setColor(0xFF10B981);
        RectF btn = new RectF(cx - 65, cy + 68, cx + 65, cy + 104);
        canvas.drawRoundRect(btn, 18, 18, btnPaint);

        bannerTextPaint.setColor(Color.BLACK);
        bannerTextPaint.setTextSize(14f);
        canvas.drawText("NEXT VAULT →", cx, cy + 90, bannerTextPaint);
    }

    private void drawGameOverOverlay(Canvas canvas, float cx, float cy) {
        canvas.drawRect(0, 0, getWidth(), getHeight(), overlayBgPaint);

        bannerPaint.setColor(0xFFEF4444);
        RectF banner = new RectF(cx - 100, cy - 80, cx + 100, cy - 45);
        canvas.drawRoundRect(banner, 18, 18, bannerPaint);

        bannerTextPaint.setColor(Color.WHITE);
        bannerTextPaint.setTextSize(14f);
        canvas.drawText("VAULT LOCKED DOWN", cx, cy - 58, bannerTextPaint);

        statusTextPaint.setTextSize(14f);
        statusTextPaint.setColor(0xFFE2E8F0);
        canvas.drawText("Safes Cracked: " + safesCracked, cx, cy - 18, statusTextPaint);

        statusTextPaint.setColor(0xFFFCD34D);
        canvas.drawText("Twinkies This Run: +" + twinkiesCollected, cx, cy + 2, statusTextPaint);

        statusTextPaint.setColor(0xFFFBBF24);
        statusTextPaint.setTextSize(12f);
        canvas.drawText("✨ Lifetime Twinkies: " + lifetimeTwinkies, cx, cy + 21, statusTextPaint);

        // Best Record
        statusTextPaint.setColor(0xFF94A3B8);
        statusTextPaint.setTextSize(12f);
        canvas.drawText("Best Record: " + highScore + " Safes", cx, cy + 38, statusTextPaint);

        // Retry Button
        Paint btnPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        btnPaint.setColor(0xFFEF4444);
        RectF btn = new RectF(cx - 65, cy + 54, cx + 65, cy + 92);
        canvas.drawRoundRect(btn, 18, 18, btnPaint);

        bannerTextPaint.setColor(Color.WHITE);
        bannerTextPaint.setTextSize(14f);
        canvas.drawText("MAIN MENU", cx, cy + 77, bannerTextPaint);
    }

    // =========================================================================
    // ROTARY HARDWARE BEZEL (AXIS_SCROLL) INPUT
    // =========================================================================
    @Override
    public boolean onGenericMotionEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_SCROLL) {
            float delta = -event.getAxisValue(MotionEvent.AXIS_SCROLL);
            if (delta != 0) {
                long now = SystemClock.uptimeMillis();
                if (now - lastBezelTime >= 45) {
                    lastBezelTime = now;
                    boolean cw = delta > 0;

                    // If on START SCREEN, rotating bezel switches difficulty!
                    if (gameState == GameState.START_SCREEN) {
                        cycleDifficulty(cw);
                    } else if (gameState == GameState.PLAYING) {
                        stepDial(cw);
                    }
                }
                return true;
            }
        }
        return super.onGenericMotionEvent(event);
    }

    private void cycleDifficulty(boolean forward) {
        int idx = selectedDifficulty.ordinal();
        if (forward) {
            idx = (idx + 1) % 3;
        } else {
            idx = (idx - 1 + 3) % 3;
        }
        selectedDifficulty = Difficulty.values()[idx];
        if (listener != null) {
            listener.onDifficultySelect(selectedDifficulty);
        }
        invalidate();
    }

    private void stepDial(boolean cw) {
        if (gameState != GameState.PLAYING) return;
        int next = (currentPosition + (cw ? 1 : -1) + 24) % 24;
        setPosition(next, true);
        if (listener != null) {
            listener.onDialStep(next, cw);
        }
    }

    // =========================================================================
    // TOUCH EVENTS: Circular Drag, Center Hub Tap, and Double-Tap Demo
    // =========================================================================
    @Override
    public boolean onTouchEvent(MotionEvent event) {
        float x = event.getX();
        float y = event.getY();
        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;

        float distFromCenter = (float) Math.hypot(x - cx, y - cy);

        // 1. START SCREEN TOUCHES
        if (gameState == GameState.START_SCREEN) {
            if (event.getAction() == MotionEvent.ACTION_UP) {
                // Check if tapped Start Button: y in [cy + 54, cy + 96]
                if (y >= cy + 50 && y <= cy + 102 && Math.abs(x - cx) <= 85) {
                    if (listener != null) {
                        listener.onStartGameTap();
                    }
                    return true;
                }

                // Check Difficulty Pills: y in [cy + 5, cy + 35]
                if (y >= cy + 4 && y <= cy + 34) {
                    float pillW = 54f;
                    float spacing = 6f;
                    float startX = cx - (3 * pillW + 2 * spacing) / 2f;
                    if (x >= startX && x <= startX + pillW) {
                        selectedDifficulty = Difficulty.EASY;
                        if (listener != null) listener.onDifficultySelect(Difficulty.EASY);
                        invalidate();
                        return true;
                    } else if (x >= startX + pillW + spacing && x <= startX + 2 * pillW + spacing) {
                        selectedDifficulty = Difficulty.NORMAL;
                        if (listener != null) listener.onDifficultySelect(Difficulty.NORMAL);
                        invalidate();
                        return true;
                    } else if (x >= startX + 2 * (pillW + spacing) && x <= startX + 3 * pillW + 2 * spacing) {
                        selectedDifficulty = Difficulty.HARD;
                        if (listener != null) listener.onDifficultySelect(Difficulty.HARD);
                        invalidate();
                        return true;
                    }
                }
            }
            return true;
        }

        // 2. OVERLAY TOUCHES (Cleared / Game Over)
        if (gameState != GameState.PLAYING) {
            if (event.getAction() == MotionEvent.ACTION_UP) {
                if (gameState == GameState.CLEARED && listener != null) {
                    listener.onNextLevelTap();
                } else if (gameState == GameState.GAMEOVER && listener != null) {
                    listener.onRetryTap();
                }
            }
            return true;
        }

        // 3. IN-GAME TOUCHES
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                // Check top-left on-screen Back / Stop Session button: center (cx - 96, cy - 88)
                if (Math.hypot(x - (cx - 96), y - (cy - 88)) <= 28) {
                    if (listener != null) {
                        listener.onBackTap();
                    }
                    return true;
                }

                // Check bottom Quit Session pill: [cx - 65, cx + 65], [cy + 104, cy + 138]
                if (!isDemoMode && y >= cy + 104 && y <= cy + 138 && Math.abs(x - cx) <= 70) {
                    if (listener != null) {
                        listener.onBackTap();
                    }
                    return true;
                }

                // Check double-tap on top area for Classroom Demo HUD
                if (y < cy - 60 && Math.abs(x - cx) < 60) {
                    long now = SystemClock.uptimeMillis();
                    if (now - lastTopTapTime < 400 && listener != null) {
                        listener.onTopDoubleTap();
                    }
                    lastTopTapTime = now;
                    return true;
                }

                // Check center hub tap (within 56px radius)
                if (distFromCenter <= 56) {
                    if (listener != null) {
                        listener.onCenterTap();
                    }
                    return true;
                }

                // Otherwise, circular touch drag
                float rad = (float) Math.atan2(y - cy, x - cx);
                lastTouchAngle = (float) Math.toDegrees(rad);
                accumulatedTouchAngle = 0f;
                isDragging = true;
                return true;

            case MotionEvent.ACTION_MOVE:
                if (isDragging) {
                    float curRad = (float) Math.atan2(y - cy, x - cx);
                    float curDeg = (float) Math.toDegrees(curRad);
                    float delta = curDeg - lastTouchAngle;

                    if (delta > 180f) delta -= 360f;
                    if (delta < -180f) delta += 360f;

                    lastTouchAngle = curDeg;
                    accumulatedTouchAngle += delta;

                    while (accumulatedTouchAngle >= 15f) {
                        accumulatedTouchAngle -= 15f;
                        stepDial(true);
                    }
                    while (accumulatedTouchAngle <= -15f) {
                        accumulatedTouchAngle += 15f;
                        stepDial(false);
                    }
                    return true;
                }
                break;

            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                isDragging = false;
                accumulatedTouchAngle = 0f;
                return true;
        }

        return super.onTouchEvent(event);
    }
}
