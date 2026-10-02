package io.github.chriskizer91ops.mooncart;

import android.content.res.AssetManager;
import android.net.Uri;
import android.webkit.WebResourceResponse;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.SequenceInputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Answers every web request the console makes, from inside the phone. Nothing goes to the
 * internet:
 *   https://mooncart.invalid/...          the console itself (assets/web/), game files, pictures
 *   https://<slot>.mooncart.invalid/...   one game, at its own address so it keeps its own saves
 * ".invalid" is a name reserved so it can never belong to a real website.
 */
final class Server {
    static final String HOST = "mooncart.invalid";
    private static final Pattern HEAD = Pattern.compile("<head\\b[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern DOCTYPE = Pattern.compile("<!doctype[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern SLOT = Pattern.compile("[a-z0-9-]{1,63}");
    private static final byte[] HELPER_TAG = "<script src=\"/__mooncart/helper.js\"></script>".getBytes(Storage.LATIN1);
    private static final Map<String, String> MIME = new HashMap<>();
    static {
        String[][] m = {
            {"html", "text/html"}, {"htm", "text/html"}, {"xhtml", "application/xhtml+xml"}, {"js", "text/javascript"}, {"mjs", "text/javascript"},
            {"css", "text/css"}, {"json", "application/json"}, {"txt", "text/plain"}, {"png", "image/png"}, {"jpg", "image/jpeg"},
            {"jpeg", "image/jpeg"}, {"gif", "image/gif"}, {"webp", "image/webp"}, {"svg", "image/svg+xml"}, {"ico", "image/x-icon"},
            {"ttf", "font/ttf"}, {"otf", "font/otf"}, {"woff", "font/woff"}, {"woff2", "font/woff2"}, {"mp3", "audio/mpeg"},
            {"ogg", "audio/ogg"}, {"wav", "audio/wav"}, {"m4a", "audio/mp4"}, {"mp4", "video/mp4"}, {"webm", "video/webm"},
            {"wasm", "application/wasm"}, {"glb", "model/gltf-binary"}, {"gltf", "model/gltf+json"},
        };
        for (String[] e : m) MIME.put(e[0], e[1]);
    }

    private final AssetManager assets;
    private final Storage store;
    /** which file each game address serves: slot -> "builtin:..." or "user:..." */
    private final Map<String, String> slots = new ConcurrentHashMap<>();

    Server(AssetManager assets, Storage store) {
        this.assets = assets;
        this.store = store;
    }

    void register(String slot, String src) {
        if (slot != null && SLOT.matcher(slot).matches() && src != null) slots.put(slot, src);
    }

    WebResourceResponse handle(Uri u) {
        String host = u.getHost();
        if (host == null || !"https".equals(u.getScheme())) return null;
        host = host.toLowerCase(Locale.ROOT);
        try {
            if (host.equals(HOST)) return shell(u);
            if (host.endsWith("." + HOST)) return game(host.substring(0, host.length() - HOST.length() - 1), u);
        } catch (Exception e) {
            return text(500, "Mooncart could not open that: " + e.getMessage());
        }
        return null; // the real internet: only reached when a game asks and the phone is online
    }

    private WebResourceResponse shell(Uri u) throws IOException {
        String path = u.getPath() == null ? "/" : u.getPath();
        if (path.startsWith("/~raw/")) {
            String src = Uri.decode(path.substring(6));
            return ok(mime(src), store.open(src));
        }
        if (path.startsWith("/~thumb/")) {
            File f = store.thumb(Uri.decode(path.substring(8)));
            if (f == null || !f.isFile()) return text(404, "no picture");
            return ok("image/jpeg", new FileInputStream(f));
        }
        String p = path.equals("/") ? "index.html" : Storage.safePath(Uri.decode(path));
        if (p == null) return text(404, "not found");
        return asset("web/" + p);
    }

    private WebResourceResponse game(String slot, Uri u) throws IOException {
        String path = u.getPath() == null ? "/" : Uri.decode(u.getPath());
        if (path.startsWith("/__mooncart/")) {
            String p = Storage.safePath(path.substring(12));
            return p == null ? text(404, "not found") : asset("web/__mooncart/" + p);
        }
        String src = slots.get(slot);
        if (src == null) return text(404, "This game isn't running.");
        String rest = path.length() > 1 ? path.substring(1) : "";
        if (rest.isEmpty() || (!rest.contains("/") && rest.toLowerCase(Locale.ROOT).matches(".*\\.x?html?"))) {
            return ok("text/html", withHelper(store.open(src)));
        }
        try {
            return ok(mime(rest), store.openBeside(src, rest));
        } catch (IOException e) {
            return text(404, "not found");
        }
    }

    private WebResourceResponse asset(String p) {
        try {
            return ok(mime(p), assets.open(p));
        } catch (IOException e) {
            return text(404, "not found");
        }
    }

    /** Adds the console's helper script to the top of a game's page (after <head>, never before the doctype). */
    static InputStream withHelper(InputStream raw) throws IOException {
        BufferedInputStream in = new BufferedInputStream(raw, 65536);
        byte[] head = new byte[65536];
        int n = 0, r;
        while (n < head.length && (r = in.read(head, n, head.length - n)) > 0) n += r;
        String s = new String(head, 0, n, Storage.LATIN1);
        int at;
        Matcher m = HEAD.matcher(s);
        if (m.find()) at = m.end();
        else {
            Matcher d = DOCTYPE.matcher(s);
            at = d.find() ? d.end() : 0;
        }
        return new SequenceInputStream(Collections.enumeration(Arrays.asList(
            new ByteArrayInputStream(head, 0, at),
            new ByteArrayInputStream(HELPER_TAG),
            new ByteArrayInputStream(head, at, n - at),
            in)));
    }

    static String mime(String name) {
        int dot = name.lastIndexOf('.');
        String ext = dot >= 0 ? name.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
        int q = ext.indexOf('?');
        if (q >= 0) ext = ext.substring(0, q);
        String t = MIME.get(ext);
        return t != null ? t : name.startsWith("user:") || name.startsWith("builtin:") ? "text/html" : "application/octet-stream";
    }

    private static WebResourceResponse ok(String mime, InputStream body) {
        Map<String, String> h = new HashMap<>();
        h.put("Cache-Control", "no-store");
        String charset = mime.startsWith("text/") && !mime.equals("text/html") ? "utf-8" : null;
        return new WebResourceResponse(mime, charset, 200, "OK", h, body);
    }

    private static WebResourceResponse text(int code, String msg) {
        Map<String, String> h = new HashMap<>();
        h.put("Cache-Control", "no-store");
        return new WebResourceResponse("text/plain", "utf-8", code, code == 404 ? "Not Found" : "Error", h,
            new ByteArrayInputStream(msg.getBytes(Storage.UTF8)));
    }
}
