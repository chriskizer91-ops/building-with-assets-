package io.github.chriskizer91ops.mooncart;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Base64;
import android.util.Log;
import android.view.InputDevice;
import android.view.KeyCharacterMap;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.PixelCopy;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Mooncart on Android: one full-screen web view showing the console (web/), with games served
 * from inside the app by {@link Server}. This class does the phone-only jobs: file pickers,
 * backups, controllers, the Back button, keeping the screen on, and recovering if a game
 * uses up the memory.
 */
public class MainActivity extends Activity {
    private static final String TAG = "Mooncart";
    private static final int REQ_FILES = 1, REQ_FOLDER = 2, REQ_SAVE = 3, REQ_BACKUP = 4, REQ_RESTORE = 5, REQ_APK = 6, REQ_CHOOSER = 7;

    Storage store;
    Server server;
    Bridge bridge;
    private FrameLayout root;
    private WebView web;
    private View customView;
    private WebChromeClient.CustomViewCallback customCallback;
    private ValueCallback<Uri[]> chooserCallback;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean pageIsReady;
    private final List<String> eventsForLater = new ArrayList<>();
    private int pendingId;
    private String pendingData, pendingMime;
    private boolean pendingBase64;
    private final float[] stick = new float[2];

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        store = new Storage(this);
        server = new Server(getAssets(), store);
        bridge = new Bridge(this);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            w.setAttributes(lp);
        }
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);
        WebView.setWebContentsDebuggingEnabled(true);
        createWebView();
        hideSystemBars();
        handleIntent(getIntent());
    }

    // ------------------------------------------------------------------ the web view

    @SuppressLint("SetJavaScriptEnabled")
    private void createWebView() {
        pageIsReady = false;
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setGeolocationEnabled(false);
        if (Build.VERSION.SDK_INT >= 26) s.setSafeBrowsingEnabled(false);
        s.setUserAgentString(s.getUserAgentString() + " Mooncart/" + versionName());
        web.addJavascriptInterface(bridge, "MooncartNative");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        root.addView(web, 0, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        web.loadUrl("https://" + Server.HOST + "/index.html#k=" + bridge.secret);
        web.requestFocus();
    }

    private class Client extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            return server.handle(req.getUrl());
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            String host = u.getHost() == null ? "" : u.getHost();
            if (host.equals(Server.HOST) || host.endsWith("." + Server.HOST)) return false;
            // a link out of a game: hand it to the phone's browser instead (only works online)
            if (req.hasGesture() || !req.isForMainFrame()) openExternal(u.toString());
            return true;
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            // usually a game that needed more memory than the phone has: start the console again
            Log.w(TAG, "web page stopped (crashed: " + detail.didCrash() + ")");
            root.removeView(view);
            view.destroy();
            if (view == web) {
                createWebView();
                Toast.makeText(MainActivity.this, "The game used up the phone's memory, so Mooncart restarted.", Toast.LENGTH_LONG).show();
            }
            return true;
        }
    }

    private class Chrome extends WebChromeClient {
        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            // a game asked for the whole screen
            if (customView != null) { callback.onCustomViewHidden(); return; }
            customView = view;
            customCallback = callback;
            root.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            hideSystemBars();
        }

        @Override
        public void onHideCustomView() {
            if (customView == null) return;
            root.removeView(customView);
            customView = null;
            if (customCallback != null) customCallback.onCustomViewHidden();
            customCallback = null;
            hideSystemBars();
            web.requestFocus();
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (chooserCallback != null) chooserCallback.onReceiveValue(null);
            chooserCallback = callback;
            Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("*/*");
            if (params != null && params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            try {
                startActivityForResult(i, REQ_CHOOSER);
            } catch (ActivityNotFoundException e) {
                chooserCallback = null;
                return false;
            }
            return true;
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean dialog, boolean gesture, Message msg) {
            // window.open from a game: catch the address and give it to the phone's browser
            WebView probe = new WebView(MainActivity.this);
            probe.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                    openExternal(r.getUrl().toString());
                    v.destroy();
                    return true;
                }
            });
            ((WebView.WebViewTransport) msg.obj).setWebView(probe);
            msg.sendToTarget();
            return true;
        }

        @Override
        public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
            new AlertDialog.Builder(MainActivity.this).setMessage(message)
                .setPositiveButton("OK", (d, w) -> result.confirm())
                .setOnCancelListener(d -> result.confirm()).show();
            return true;
        }

        @Override
        public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
            new AlertDialog.Builder(MainActivity.this).setMessage(message)
                .setPositiveButton("OK", (d, w) -> result.confirm())
                .setNegativeButton("Cancel", (d, w) -> result.cancel())
                .setOnCancelListener(d -> result.cancel()).show();
            return true;
        }

        @Override
        public boolean onJsPrompt(WebView view, String url, String message, String value, JsPromptResult result) {
            EditText input = new EditText(MainActivity.this);
            input.setText(value);
            new AlertDialog.Builder(MainActivity.this).setMessage(message).setView(input)
                .setPositiveButton("OK", (d, w) -> result.confirm(input.getText().toString()))
                .setNegativeButton("Cancel", (d, w) -> result.cancel())
                .setOnCancelListener(d -> result.cancel()).show();
            return true;
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            request.deny(); // no camera or microphone
        }

        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
            callback.invoke(origin, false, false);
        }

        @Override
        public boolean onConsoleMessage(ConsoleMessage m) {
            Log.d(TAG, m.messageLevel() + " " + m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
            return true;
        }

        @Override
        public Bitmap getDefaultVideoPoster() {
            return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
        }
    }

    // ------------------------------------------------------------------ talking to the page

    void ui(Runnable r) { main.post(r); }

    /** Answers a slow call from the page. json is the answer as JSON text, or null. */
    void resolve(int id, String json) {
        main.post(() -> {
            if (web == null) return;
            String arg = json == null ? "null" : JSONObject.quote(json);
            web.evaluateJavascript("window.mooncartResolve && window.mooncartResolve(" + id + "," + arg + ")", null);
        });
    }

    /** Tells the page something happened (a controller button, a file opened from outside). */
    void event(String name, String json) {
        main.post(() -> {
            String js = "window.mooncartEvent && window.mooncartEvent(" + JSONObject.quote(name) + "," + (json == null ? "null" : JSONObject.quote(json)) + ")";
            if (!pageIsReady) { eventsForLater.add(js); return; }
            web.evaluateJavascript(js, null);
        });
    }

    void pageReady() {
        pageIsReady = true;
        for (String js : eventsForLater) web.evaluateJavascript(js, null);
        eventsForLater.clear();
        web.requestFocus();
    }

    // ------------------------------------------------------------------ keys and controllers

    /** Presses or releases a key in the game (the console's buttons on screen). */
    void sendKey(String code, boolean down) {
        int kc = Keys.androidKey(code);
        if (kc == 0 || web == null) return;
        long now = SystemClock.uptimeMillis();
        KeyEvent e = new KeyEvent(now, now, down ? KeyEvent.ACTION_DOWN : KeyEvent.ACTION_UP, kc, 0, 0,
            KeyCharacterMap.VIRTUAL_KEYBOARD, 0, KeyEvent.FLAG_SOFT_KEYBOARD | KeyEvent.FLAG_KEEP_TOUCH_MODE, InputDevice.SOURCE_KEYBOARD);
        if (customView != null) customView.dispatchKeyEvent(e);
        else web.dispatchKeyEvent(e);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int kc = e.getKeyCode();
        boolean down = e.getAction() == KeyEvent.ACTION_DOWN;
        int src = e.getSource();
        boolean fromController = (src & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD
            || (src & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK || KeyEvent.isGamepadButton(kc);
        String btn = fromController ? Keys.padButton(kc) : null;
        if (btn != null) {
            if (e.getRepeatCount() == 0 && (down || e.getAction() == KeyEvent.ACTION_UP)) padEvent(btn, down);
            return true;
        }
        String shortcut = Keys.shortcut(kc);
        if (shortcut != null) {
            if (down && e.getRepeatCount() == 0) event("shortcut", "{\"name\":\"" + shortcut + "\"}");
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent e) {
        // a controller's stick or hat: turn it into d-pad presses
        if ((e.getSource() & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK && e.getAction() == MotionEvent.ACTION_MOVE) {
            float x = e.getAxisValue(MotionEvent.AXIS_HAT_X), y = e.getAxisValue(MotionEvent.AXIS_HAT_Y);
            if (Math.abs(x) < 0.5f) x = e.getAxisValue(MotionEvent.AXIS_X);
            if (Math.abs(y) < 0.5f) y = e.getAxisValue(MotionEvent.AXIS_Y);
            axis(0, x, "left", "right");
            axis(1, y, "up", "down");
            return true;
        }
        return super.dispatchGenericMotionEvent(e);
    }

    private void axis(int i, float v, String neg, String pos) {
        float was = stick[i];
        int before = was < -0.5f ? -1 : was > 0.5f ? 1 : 0;
        int now = v < -0.5f ? -1 : v > 0.5f ? 1 : 0;
        stick[i] = v;
        if (before == now) return;
        if (before != 0) padEvent(before < 0 ? neg : pos, false);
        if (now != 0) padEvent(now < 0 ? neg : pos, true);
    }

    private void padEvent(String btn, boolean down) {
        event("pad", "{\"btn\":\"" + btn + "\",\"down\":" + down + "}");
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (customView != null) { if (customCallback != null) customCallback.onCustomViewHidden(); return; }
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("window.mooncartBack ? String(!!window.mooncartBack()) : 'false'", (r) -> {
            if (r == null || r.contains("false")) moveTaskToBackSafely();
        });
    }

    void moveTaskToBackSafely() {
        if (!moveTaskToBack(true)) finish();
    }

    // ------------------------------------------------------------------ phone settings

    void setPlaying(boolean on) {
        if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    void setOrientation(String mode) {
        int o = "portrait".equals(mode) ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
            : "auto".equals(mode) ? ActivityInfo.SCREEN_ORIENTATION_FULL_USER
            : ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
        if (getRequestedOrientation() != o) setRequestedOrientation(o);
    }

    @SuppressWarnings("deprecation")
    void vibrate(int ms) {
        Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (v == null || !v.hasVibrator()) return;
        int t = Math.max(1, Math.min(ms, 200));
        if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(t, VibrationEffect.DEFAULT_AMPLITUDE));
        else v.vibrate(t);
    }

    void openExternal(String url) {
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception e) {
            Toast.makeText(this, "No web browser on this phone to open that link.", Toast.LENGTH_SHORT).show();
        }
    }

    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 30) {
            w.setDecorFitsSystemWindows(false);
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) hideSystemBars();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) { web.onPause(); web.pauseTimers(); }
        event("pause", null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) { web.onResume(); web.resumeTimers(); }
        hideSystemBars();
        event("resume", null);
    }

    @Override
    protected void onDestroy() {
        if (web != null) { root.removeView(web); web.destroy(); web = null; }
        worker.shutdown();
        super.onDestroy();
    }

    private String versionName() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return "0"; }
    }

    // ------------------------------------------------------------------ files in and out

    void pickFiles(int id) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/html", "application/xhtml+xml", "application/octet-stream", "text/plain"});
        i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        start(i, REQ_FILES, id);
    }

    void pickFolder(int id) {
        start(new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), REQ_FOLDER, id);
    }

    void saveFile(int id, String name, String mime, String data, boolean base64) {
        pendingData = data;
        pendingMime = mime;
        pendingBase64 = base64;
        start(createDocument(mime, name), REQ_SAVE, id);
    }

    void exportBackup(int id, String json) {
        pendingData = json;
        String day = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date());
        start(createDocument("application/zip", "mooncart-backup-" + day + ".zip"), REQ_BACKUP, id);
    }

    void importBackup(int id) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/zip", "application/x-zip-compressed", "application/octet-stream"});
        start(i, REQ_RESTORE, id);
    }

    void saveApk(int id) {
        start(createDocument("application/vnd.android.package-archive", "Mooncart-" + versionName() + ".apk"), REQ_APK, id);
    }

    private static Intent createDocument(String mime, String name) {
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(mime);
        i.putExtra(Intent.EXTRA_TITLE, name);
        return i;
    }

    private void start(Intent i, int req, int id) {
        pendingId = id;
        try {
            startActivityForResult(i, req);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "This phone has no file picker for that.", Toast.LENGTH_LONG).show();
            resolve(id, null);
        }
    }

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        final int id = pendingId;
        final boolean ok = result == RESULT_OK && data != null;
        if (req == REQ_CHOOSER) {
            if (chooserCallback == null) return;
            Uri[] picked = null;
            if (ok) picked = urisOf(data).toArray(new Uri[0]);
            chooserCallback.onReceiveValue(picked);
            chooserCallback = null;
            return;
        }
        if (!ok) {
            pendingData = null;
            resolve(id, req == REQ_FILES || req == REQ_FOLDER ? "[]" : null);
            return;
        }
        switch (req) {
            case REQ_FILES: {
                List<Uri> uris = urisOf(data);
                worker.execute(() -> {
                    JSONArray out = new JSONArray();
                    for (Uri u : uris) { JSONObject o = store.importUri(u, null); if (o != null) out.put(o); }
                    resolve(id, out.toString());
                });
                break;
            }
            case REQ_FOLDER: {
                Uri tree = data.getData();
                worker.execute(() -> resolve(id, tree == null ? "[]" : store.importTree(tree).toString()));
                break;
            }
            case REQ_SAVE: {
                final String payload = pendingData;
                final boolean b64 = pendingBase64;
                pendingData = null;
                worker.execute(() -> {
                    try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                        out.write(b64 ? Base64.decode(payload, Base64.DEFAULT) : payload.getBytes(Storage.UTF8));
                        resolve(id, "true");
                    } catch (Exception e) {
                        resolve(id, "false");
                    }
                });
                break;
            }
            case REQ_BACKUP: {
                final String json = pendingData;
                pendingData = null;
                Toast.makeText(this, "Saving the backup…", Toast.LENGTH_SHORT).show();
                worker.execute(() -> {
                    try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                        store.writeBackup(out, json);
                        resolve(id, "true");
                    } catch (Exception e) {
                        Log.w(TAG, "backup failed", e);
                        resolve(id, "false");
                    }
                });
                break;
            }
            case REQ_RESTORE: {
                worker.execute(() -> {
                    try (InputStream in = getContentResolver().openInputStream(data.getData())) {
                        resolve(id, store.readBackup(in));
                    } catch (Exception e) {
                        Log.w(TAG, "restore failed", e);
                        resolve(id, null);
                    }
                });
                break;
            }
            case REQ_APK: {
                worker.execute(() -> {
                    try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                        Storage.copy(new FileInputStream(getApplicationInfo().sourceDir), out, false);
                        resolve(id, "true");
                    } catch (Exception e) {
                        resolve(id, "false");
                    }
                });
                break;
            }
            default: break;
        }
    }

    private static List<Uri> urisOf(Intent data) {
        List<Uri> out = new ArrayList<>();
        if (data.getClipData() != null) {
            for (int i = 0; i < data.getClipData().getItemCount(); i++) out.add(data.getClipData().getItemAt(i).getUri());
        } else if (data.getData() != null) out.add(data.getData());
        return out;
    }

    // a game opened from a file manager ("Open with Mooncart") or shared to Mooncart
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    @SuppressWarnings("deprecation")
    private void handleIntent(Intent intent) {
        if (intent == null) return;
        // start a game by name: adb shell am start -n <package>/.MainActivity --es launch "Bogmire"
        String launch = intent.getStringExtra("launch");
        if (launch != null) {
            try { event("launch", new JSONObject().put("name", launch).toString()); } catch (Exception ignored) { }
            return;
        }
        Uri u = null;
        if (Intent.ACTION_VIEW.equals(intent.getAction())) u = intent.getData();
        else if (Intent.ACTION_SEND.equals(intent.getAction())) u = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (u == null) return;
        final Uri uri = u;
        worker.execute(() -> {
            JSONObject o = store.importUri(uri, null);
            if (o != null) event("opened", new JSONArray().put(o).toString());
            else ui(() -> Toast.makeText(this, "Mooncart can only open .html games.", Toast.LENGTH_LONG).show());
        });
    }

    // ------------------------------------------------------------------ cartridge pictures

    void captureThumb(int id, String name, int x, int y, int w, int h) {
        File f = store.thumb(name);
        if (Build.VERSION.SDK_INT < 26 || f == null || w < 8 || h < 8 || web == null) { resolve(id, null); return; }
        int[] at = new int[2];
        web.getLocationInWindow(at);
        View decor = getWindow().getDecorView();
        Rect r = new Rect(at[0] + x, at[1] + y, at[0] + x + w, at[1] + y + h);
        if (!r.intersect(0, 0, decor.getWidth(), decor.getHeight())) { resolve(id, null); return; }
        final Bitmap bmp = Bitmap.createBitmap(r.width(), r.height(), Bitmap.Config.ARGB_8888);
        try {
            PixelCopy.request(getWindow(), r, bmp, (res) -> {
                if (res != PixelCopy.SUCCESS) { bmp.recycle(); resolve(id, null); return; }
                worker.execute(() -> {
                    try {
                        int tw = Math.min(480, bmp.getWidth());
                        int th = Math.max(1, Math.round(bmp.getHeight() * (tw / (float) bmp.getWidth())));
                        Bitmap small = Bitmap.createScaledBitmap(bmp, tw, th, true);
                        try (FileOutputStream out = new FileOutputStream(f)) {
                            small.compress(Bitmap.CompressFormat.JPEG, 82, out);
                        }
                        if (small != bmp) small.recycle();
                        bmp.recycle();
                        resolve(id, JSONObject.quote(name));
                    } catch (Exception e) {
                        resolve(id, null);
                    }
                });
            }, main);
        } catch (Exception e) {
            resolve(id, null);
        }
    }
}
