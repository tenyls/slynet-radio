package com.slynet.radio;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.OptIn;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Metadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.audio.AudioProcessor;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.DefaultRenderersFactory;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.audio.AudioSink;
import androidx.media3.exoplayer.audio.DefaultAudioSink;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.extractor.metadata.icy.IcyInfo;

/**
 * Нативный плеер радио (Media3 / ExoPlayer) — им управляет приложение через SlyNetNativePlugin.
 * Плюсы против плеера WebView: http-станции, эквалайзер и визуализация (SlyNetDsp),
 * настраиваемый буфер от обрывов, автопереподключение, название песни прямо из потока (ICY).
 */
@OptIn(markerClass = UnstableApi.class)
public class SlyNetPlayer {
    public interface Listener {
        void onState(String state, String message);

        void onTitle(String title);

        void onViz(float[] bars);
    }

    private static SlyNetPlayer inst;

    static synchronized SlyNetPlayer get(Context c) {
        if (inst == null) inst = new SlyNetPlayer(c.getApplicationContext());
        return inst;
    }

    private final Context ctx;
    private final Handler main = new Handler(Looper.getMainLooper());
    final SlyNetDsp dsp = new SlyNetDsp();
    private ExoPlayer player;
    private volatile Listener listener;
    private String url = "";
    private int bufferMs = 2500;
    private float volume = 1f;
    private boolean wantPlay = false;
    private boolean startedOnce = false;
    private int retries = 0;
    private String lastState = "";

    private SlyNetPlayer(Context c) {
        ctx = c;
        dsp.vizListener = bars -> {
            Listener l = listener;
            if (l != null) l.onViz(bars);
        };
    }

    void setListener(@Nullable Listener l) {
        listener = l;
    }

    void run(Runnable r) {
        if (Looper.myLooper() == Looper.getMainLooper()) r.run();
        else main.post(r);
    }

    private void ensure() {
        if (player != null) return;
        DefaultRenderersFactory rf = new DefaultRenderersFactory(ctx) {
            @Nullable
            @Override
            protected AudioSink buildAudioSink(@NonNull Context context, boolean enableFloatOutput, boolean enableAudioTrackPlaybackParams) {
                return new DefaultAudioSink.Builder(context).setAudioProcessors(new AudioProcessor[] { dsp }).build();
            }
        };
        int min = Math.max(15000, bufferMs);
        DefaultLoadControl lc = new DefaultLoadControl.Builder()
            .setBufferDurationsMs(min, Math.max(50000, min), bufferMs, bufferMs)
            .build();
        DefaultHttpDataSource.Factory http = new DefaultHttpDataSource.Factory()
            .setUserAgent("SlyNetRadio/1.0 (Android)")
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(10000)
            .setReadTimeoutMs(20000);
        player = new ExoPlayer.Builder(ctx, rf)
            .setLoadControl(lc)
            .setMediaSourceFactory(new DefaultMediaSourceFactory(http))
            .build();
        player.setAudioAttributes(
            new AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MUSIC).build(),
            true // сам уступает звук звонку/навигатору и возвращается
        );
        player.setHandleAudioBecomingNoisy(true); // выдернули наушники — пауза
        player.setWakeMode(C.WAKE_MODE_NETWORK); // экран выключен — сеть и процессор не засыпают
        player.setVolume(volume);
        player.addListener(new Player.Listener() {
            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                if (isPlaying) {
                    startedOnce = true;
                    retries = 0;
                }
                emitState();
            }

            @Override
            public void onPlaybackStateChanged(int s) {
                // Живой эфир «закончился» — сервер оборвал поток: переподключаемся
                if (s == Player.STATE_ENDED && wantPlay) {
                    reconnect("ended");
                    return;
                }
                emitState();
            }

            @Override
            public void onPlayWhenReadyChanged(boolean playWhenReady, int reason) {
                if (!playWhenReady && reason != Player.PLAY_WHEN_READY_CHANGE_REASON_USER_REQUEST) wantPlay = false;
                emitState();
            }

            @Override
            public void onPlayerError(@NonNull PlaybackException e) {
                // Уже играло и оборвалось — тихо переподключаемся (до 6 раз). Не стартовало — ошибка: приложение проверит станцию.
                if (startedOnce && wantPlay && retries < 6) {
                    reconnect(e.getErrorCodeName());
                    return;
                }
                wantPlay = false;
                emit("error", e.getErrorCodeName());
            }

            @Override
            public void onMetadata(@NonNull Metadata md) {
                for (int i = 0; i < md.length(); i++) {
                    Metadata.Entry en = md.get(i);
                    if (en instanceof IcyInfo && ((IcyInfo) en).title != null) {
                        Listener l = listener;
                        if (l != null) l.onTitle(((IcyInfo) en).title);
                    }
                }
            }
        });
    }

    private void reconnect(String why) {
        retries++;
        emit("buffering", "reconnect:" + why);
        final String u = url;
        main.postDelayed(() -> {
            if (!wantPlay || player == null || !u.equals(url)) return;
            player.setMediaItem(MediaItem.fromUri(url));
            player.prepare();
            player.play();
        }, Math.min(8000, 1500L * retries));
    }

    private void emitState() {
        if (player == null) return;
        int s = player.getPlaybackState();
        String st;
        if (player.isPlaying()) st = "playing";
        else if (!player.getPlayWhenReady()) st = "paused";
        else if (s == Player.STATE_BUFFERING || s == Player.STATE_IDLE) st = "buffering";
        else if (player.getPlaybackSuppressionReason() != Player.PLAYBACK_SUPPRESSION_REASON_NONE) st = "paused";
        else st = "buffering";
        emit(st, "");
    }

    private void emit(String st, String msg) {
        if (st.equals(lastState) && msg.isEmpty()) return;
        lastState = st;
        Listener l = listener;
        if (l != null) l.onState(st, msg);
    }

    // ---------- команды из приложения ----------
    void load(String u) {
        run(() -> {
            ensure();
            url = u == null ? "" : u;
            retries = 0;
            startedOnce = false;
            lastState = "";
            if (url.isEmpty()) {
                player.stop();
                player.clearMediaItems();
                return;
            }
            player.setMediaItem(MediaItem.fromUri(url));
            player.prepare();
        });
    }

    void play() {
        run(() -> {
            ensure();
            if (url.isEmpty()) return;
            wantPlay = true;
            if (player.getPlaybackState() == Player.STATE_IDLE || player.getPlaybackState() == Player.STATE_ENDED) {
                player.setMediaItem(MediaItem.fromUri(url));
                player.prepare();
            }
            player.play();
        });
    }

    void pause() {
        run(() -> {
            wantPlay = false;
            if (player != null) player.pause();
        });
    }

    void stop() {
        run(() -> {
            wantPlay = false;
            if (player != null) {
                player.stop();
                player.clearMediaItems();
            }
        });
    }

    void setVolume(float v) {
        run(() -> {
            volume = Math.max(0f, Math.min(1f, v));
            if (player != null) player.setVolume(volume);
        });
    }

    void setEq(boolean enabled, float[] g, float bass) {
        for (int i = 0; i < SlyNetDsp.FREQS.length && i < g.length; i++) dsp.gains[i] = Math.max(-12f, Math.min(12f, g[i]));
        dsp.bassDb = Math.max(0f, Math.min(12f, bass));
        dsp.eqEnabled = enabled;
        dsp.dirty = true;
    }

    void setViz(boolean on) {
        dsp.vizEnabled = on;
    }

    /** Буфер (мс) перед стартом и после «заикания». Меняется пересозданием плеера, эфир продолжается. */
    void setBuffer(int ms) {
        run(() -> {
            int v = Math.max(500, Math.min(15000, ms));
            if (v == bufferMs) return;
            bufferMs = v;
            if (player == null) return;
            boolean was = wantPlay;
            player.release();
            player = null;
            lastState = "";
            if (!url.isEmpty()) {
                ensure();
                player.setMediaItem(MediaItem.fromUri(url));
                player.prepare();
                if (was) player.play();
            }
        });
    }
}
