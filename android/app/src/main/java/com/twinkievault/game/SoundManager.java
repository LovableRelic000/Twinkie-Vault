package com.twinkievault.game;

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import java.util.Random;

/**
 * Procedural Audio Synthesizer for Wear OS TwinkieVault
 * Generates low-latency metallic mechanical ticks, gate clunks, and latches
 * in memory without requiring external audio asset files.
 */
public class SoundManager {
    private static final int SAMPLE_RATE = 44100;
    private boolean muted = false;

    private AudioTrack tickTrack;
    private AudioTrack clunkTrack;
    private AudioTrack lockTrack;
    private AudioTrack errorTrack;
    private AudioTrack fanfareTrack;

    public SoundManager() {
        initSounds();
    }

    public void setMuted(boolean mute) {
        this.muted = mute;
    }

    public boolean isMuted() {
        return muted;
    }

    public void toggleMute() {
        this.muted = !this.muted;
    }

    private void initSounds() {
        try {
            tickTrack = createTrack(generateTickPCM());
            clunkTrack = createTrack(generateClunkPCM());
            lockTrack = createTrack(generateLockPCM());
            errorTrack = createTrack(generateErrorPCM());
            fanfareTrack = createTrack(generateFanfarePCM());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private AudioTrack createTrack(short[] pcm) {
        AudioTrack track = new AudioTrack.Builder()
                .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build())
                .setAudioFormat(new AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build())
                .setBufferSizeInBytes(pcm.length * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build();
        track.write(pcm, 0, pcm.length);
        return track;
    }

    private void playTrack(AudioTrack track) {
        if (muted || track == null) return;
        try {
            track.stop();
            track.reloadStaticData();
            track.play();
        } catch (Exception ignored) {}
    }

    public void playTick() {
        playTrack(tickTrack);
    }

    public void playGateClunk() {
        playTrack(clunkTrack);
    }

    public void playTumblerLock() {
        playTrack(lockTrack);
    }

    public void playErrorBuzz() {
        playTrack(errorTrack);
    }

    public void playVaultOpen() {
        playTrack(fanfareTrack);
    }

    public void release() {
        if (tickTrack != null) tickTrack.release();
        if (clunkTrack != null) clunkTrack.release();
        if (lockTrack != null) lockTrack.release();
        if (errorTrack != null) errorTrack.release();
        if (fanfareTrack != null) fanfareTrack.release();
    }

    // 18ms metallic tick with exponential decay
    private short[] generateTickPCM() {
        int samples = (int) (SAMPLE_RATE * 0.018);
        short[] buffer = new short[samples];
        double freq = 3100.0;
        for (int i = 0; i < samples; i++) {
            double t = (double) i / SAMPLE_RATE;
            double env = Math.exp(-t * 220.0);
            double sample = Math.sin(2 * Math.PI * freq * t) * env;
            buffer[i] = (short) (sample * 16000);
        }
        return buffer;
    }

    // 70ms heavy mechanical gate clunk (sub punch + metallic thud)
    private short[] generateClunkPCM() {
        int samples = (int) (SAMPLE_RATE * 0.075);
        short[] buffer = new short[samples];
        for (int i = 0; i < samples; i++) {
            double t = (double) i / SAMPLE_RATE;
            double lowEnv = Math.exp(-t * 60.0);
            double low = Math.sin(2 * Math.PI * 140.0 * t) * lowEnv;

            double metalEnv = Math.exp(-t * 140.0);
            double metal = Math.sin(2 * Math.PI * 1850.0 * t) * metalEnv;

            double combined = (low * 0.65 + metal * 0.35);
            buffer[i] = (short) (Math.max(-1.0, Math.min(1.0, combined)) * 26000);
        }
        return buffer;
    }

    // 120ms double latch ("click... CLACK")
    private short[] generateLockPCM() {
        int samples = (int) (SAMPLE_RATE * 0.14);
        short[] buffer = new short[samples];
        for (int i = 0; i < samples; i++) {
            double t = (double) i / SAMPLE_RATE;
            double sample = 0;
            if (t < 0.035) {
                double env = Math.exp(-t * 180.0);
                sample = Math.sin(2 * Math.PI * 2200.0 * t) * env * 0.5;
            } else if (t > 0.045) {
                double t2 = t - 0.045;
                double env = Math.exp(-t2 * 50.0);
                sample = Math.sin(2 * Math.PI * 210.0 * t2) * env * 0.8;
            }
            buffer[i] = (short) (Math.max(-1.0, Math.min(1.0, sample)) * 28000);
        }
        return buffer;
    }

    // 140ms double error buzz
    private short[] generateErrorPCM() {
        int samples = (int) (SAMPLE_RATE * 0.14);
        short[] buffer = new short[samples];
        for (int i = 0; i < samples; i++) {
            double t = (double) i / SAMPLE_RATE;
            double wave = Math.sin(2 * Math.PI * 95.0 * t) > 0 ? 1.0 : -1.0;
            double env = (t < 0.05 || (t > 0.08 && t < 0.13)) ? 0.6 : 0.0;
            buffer[i] = (short) (wave * env * 18000);
        }
        return buffer;
    }

    // 400ms triumphant golden fanfare chord
    private short[] generateFanfarePCM() {
        int samples = (int) (SAMPLE_RATE * 0.45);
        short[] buffer = new short[samples];
        double[] freqs = { 523.25, 659.25, 783.99, 1046.50 }; // C5, E5, G5, C6
        for (int i = 0; i < samples; i++) {
            double t = (double) i / SAMPLE_RATE;
            double sum = 0;
            for (int f = 0; f < freqs.length; f++) {
                double start = f * 0.06;
                if (t >= start) {
                    double dt = t - start;
                    sum += Math.sin(2 * Math.PI * freqs[f] * dt) * Math.exp(-dt * 6.5) * 0.25;
                }
            }
            buffer[i] = (short) (Math.max(-1.0, Math.min(1.0, sum)) * 26000);
        }
        return buffer;
    }
}
