package io.github.chriskizer91ops.mooncart;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The calls the console's page can make to the phone (web/js/native.js is the other side).
 * Android shows this object to every frame, games included, so each call must carry the
 * secret the console was started with; games never see it.
 */
final class Bridge {
    private final MainActivity act;
    final String secret = Storage.newId() + Storage.newId();

    Bridge(MainActivity act) {
        this.act = act;
    }

    /** Quick calls; the answer comes straight back. */
    @JavascriptInterface
    public String call(String key, String method, String argsJson) {
        if (!secret.equals(key)) return null;
        try {
            JSONArray a = argsJson == null ? new JSONArray() : new JSONArray(argsJson);
            Storage s = act.store;
            switch (method) {
                case "info": return info();
                case "readText": return s.readText(a.optString(0, null));
                case "writeText": return String.valueOf(s.writeText(a.optString(0, null), a.optString(1, null)));
                case "collection": return s.collection();
                case "deleteBlob": return String.valueOf(s.deleteBlob(a.optString(0, null)));
                case "writeBlob": return String.valueOf(s.writeBlob(a.optString(0, null), a.optString(1, null)));
                case "register": act.server.register(a.optString(0, null), a.optString(1, null)); return "true";
                case "key": act.ui(() -> act.sendKey(a.optString(0, ""), a.optBoolean(1))); return "true";
                case "setPlaying": act.ui(() -> act.setPlaying(a.optBoolean(0))); return "true";
                case "setOrientation": act.ui(() -> act.setOrientation(a.optString(0, "landscape"))); return "true";
                case "vibrate": act.vibrate(a.optInt(0, 10)); return "true";
                case "openExternal": act.ui(() -> act.openExternal(a.optString(0, ""))); return "true";
                case "exit": act.ui(act::moveTaskToBackSafely); return "true";
                case "ready": act.ui(act::pageReady); return "true";
                default: return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    /** Slow calls (anything that asks the player to pick a file); the answer arrives later through mooncartResolve(id, json). */
    @JavascriptInterface
    public void callAsync(String key, String method, String argsJson, int id) {
        if (!secret.equals(key)) return;
        try {
            JSONArray a = argsJson == null ? new JSONArray() : new JSONArray(argsJson);
            switch (method) {
                case "pickFiles": act.ui(() -> act.pickFiles(id)); break;
                case "pickFolder": act.ui(() -> act.pickFolder(id)); break;
                case "saveFile": act.ui(() -> act.saveFile(id, a.optString(0, "file"), a.optString(1, "application/octet-stream"), a.optString(2, ""), a.optBoolean(3))); break;
                case "exportBackup": act.ui(() -> act.exportBackup(id, a.optString(0, "{}"))); break;
                case "importBackup": act.ui(() -> act.importBackup(id)); break;
                case "saveApk": act.ui(() -> act.saveApk(id)); break;
                case "captureThumb": act.ui(() -> act.captureThumb(id, a.optString(0, ""), a.optInt(1), a.optInt(2), a.optInt(3), a.optInt(4))); break;
                default: act.resolve(id, null);
            }
        } catch (Exception e) {
            act.resolve(id, null);
        }
    }

    private String info() throws Exception {
        JSONObject o = new JSONObject();
        o.put("platform", "android");
        o.put("android", Build.VERSION.RELEASE);
        o.put("sdk", Build.VERSION.SDK_INT);
        o.put("model", (Build.MANUFACTURER + " " + Build.MODEL).trim());
        try {
            PackageInfo me = act.getPackageManager().getPackageInfo(act.getPackageName(), 0);
            o.put("version", me.versionName);
        } catch (Exception ignored) { }
        if (Build.VERSION.SDK_INT >= 26) {
            PackageInfo wv = WebView.getCurrentWebViewPackage();
            if (wv != null) o.put("webview", wv.packageName + " " + wv.versionName);
        }
        o.put("free", act.getFilesDir().getUsableSpace());
        return o.toString();
    }
}
