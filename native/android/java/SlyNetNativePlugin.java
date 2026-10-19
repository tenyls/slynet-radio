package com.slynet.radio;

import android.Manifest;
import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Мост между сайтом (JS) и Android: виджет, нативный будильник, данные для Android Auto. */
@CapacitorPlugin(name = "SlyNetNative")
public class SlyNetNativePlugin extends Plugin {
    static final String PREFS = "slynet_native";
    static volatile SlyNetNativePlugin instance;
    private String pendingAction;

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @Override
    public void load() {
        instance = this;
        if (getActivity() != null) stash(getActivity().getIntent());
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) instance = null;
        prefs(getContext()).edit().putBoolean("np_playing", false).apply();
        NowPlayingWidget.updateAll(getContext());
        super.handleOnDestroy();
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        String a = stash(intent);
        if (a != null) {
            JSObject o = new JSObject();
            o.put("action", a);
            notifyListeners("launchAction", o, true);
            pendingAction = null;
        }
    }

    private String stash(Intent i) {
        if (i == null) return null;
        android.net.Uri data = i.getData();
        if (data != null && "slynet".equals(data.getScheme())) {
            String h = data.getQueryParameter("h");
            i.setData(null);
            if (h != null && !h.isEmpty()) {
                pendingAction = "open:" + h;
                return pendingAction;
            }
        }
        String a = i.getStringExtra("slynet_action");
        if (a != null) {
            pendingAction = a;
            i.removeExtra("slynet_action");
        }
        return a;
    }

    /** Сообщить сайту о нажатии кнопки (виджет и т. п.) */
    static void emitRemote(String action) {
        SlyNetNativePlugin p = instance;
        if (p == null) return;
        JSObject o = new JSObject();
        o.put("action", action);
        p.notifyListeners("remote", o);
    }

    @PluginMethod
    public void getLaunchAction(PluginCall call) {
        JSObject o = new JSObject();
        o.put("action", pendingAction);
        pendingAction = null;
        call.resolve(o);
    }

    @PluginMethod
    public void updateNowPlaying(PluginCall call) {
        Boolean playing = call.getBoolean("playing", false);
        prefs(getContext()).edit()
            .putString("np_title", call.getString("title", "SlyNet Radio"))
            .putString("np_subtitle", call.getString("subtitle", ""))
            .putBoolean("np_playing", playing != null && playing)
            .apply();
        NowPlayingWidget.updateAll(getContext());
        call.resolve();
    }

    /** Избранное, недавние и Radio Record — для Android Auto */
    @PluginMethod
    public void saveLibrary(PluginCall call) {
        prefs(getContext()).edit().putString("library", call.getData().toString()).apply();
        call.resolve();
    }

    /** Будильник: {enabled, hour, minute, days:[0..6, 0=вс], url, name, fadeSec} */
    @PluginMethod
    public void setAlarm(PluginCall call) {
        Context c = getContext();
        prefs(c).edit().putString("alarm", call.getData().toString()).apply();
        boolean exact = AlarmScheduler.schedule(c);
        if (Build.VERSION.SDK_INT >= 33 && getActivity() != null
            && ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 7302);
        }
        JSObject o = new JSObject();
        o.put("exact", exact);
        o.put("next", AlarmScheduler.nextTime(c));
        call.resolve(o);
    }

    /** Системное окно «Поделиться» (Telegram, WhatsApp, сообщения…) */
    @PluginMethod
    public void share(PluginCall call) {
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_SUBJECT, call.getString("title", "SlyNet Radio"));
        send.putExtra(Intent.EXTRA_TEXT, call.getString("text", ""));
        Intent chooser = Intent.createChooser(send, "Поделиться");
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("share failed");
        }
    }

    @PluginMethod
    public void stopAlarm(PluginCall call) {
        getContext().stopService(new Intent(getContext(), AlarmService.class));
        call.resolve();
    }

    /** Открыть системную настройку «Будильники и напоминания» (Android 12+), если точные будильники запрещены */
    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31) {
            AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (am != null && !am.canScheduleExactAlarms()) {
                Intent i = new Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                i.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    getContext().startActivity(i);
                } catch (Exception ignored) {}
            }
        }
        call.resolve();
    }
}
