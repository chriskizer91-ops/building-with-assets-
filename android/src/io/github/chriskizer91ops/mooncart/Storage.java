package io.github.chriskizer91ops.mooncart;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.AssetManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.security.SecureRandom;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

/**
 * Everything Mooncart keeps on the phone, inside the app's own private storage:
 *   files/text/    library.json and settings.json
 *   files/blobs/   games the player added (one file each, named by a random id)
 *   files/thumbs/  pictures for the cartridge labels
 * Built-in games are read straight out of the app (assets/collection/).
 */
final class Storage {
    static final Charset UTF8 = Charset.forName("UTF-8");
    static final Charset LATIN1 = Charset.forName("ISO-8859-1");
    private static final Pattern TEXT_NAME = Pattern.compile("[a-z0-9._-]+\\.json", Pattern.CASE_INSENSITIVE);
    private static final Pattern BLOB_ID = Pattern.compile("[a-f0-9]{8,64}");
    private static final Pattern THUMB_NAME = Pattern.compile("[A-Za-z0-9._-]{1,80}");
    private static final Pattern TITLE = Pattern.compile("<title[^>]*>([\\s\\S]*?)</title>", Pattern.CASE_INSENSITIVE);
    private static final Pattern HTML_NAME = Pattern.compile(".*\\.(html?|xhtml)$", Pattern.CASE_INSENSITIVE);

    private final Context ctx;
    private final AssetManager assets;
    final File text, blobs, thumbs;

    Storage(Context ctx) {
        this.ctx = ctx;
        this.assets = ctx.getAssets();
        File base = ctx.getFilesDir();
        text = new File(base, "text");
        blobs = new File(base, "blobs");
        thumbs = new File(base, "thumbs");
        text.mkdirs();
        blobs.mkdirs();
        thumbs.mkdirs();
    }

    // ------------------------------------------------------------------ small text files

    String readText(String name) {
        if (name == null || !TEXT_NAME.matcher(name).matches()) return null;
        File f = new File(text, name);
        if (!f.isFile()) return null;
        try (InputStream in = new FileInputStream(f)) {
            return new String(readAll(in, 64 * 1024 * 1024), UTF8);
        } catch (IOException e) {
            return null;
        }
    }

    boolean writeText(String name, String value) {
        if (name == null || value == null || !TEXT_NAME.matcher(name).matches()) return false;
        return writeAtomically(new File(text, name), value.getBytes(UTF8));
    }

    private static boolean writeAtomically(File f, byte[] data) {
        File tmp = new File(f.getPath() + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(data);
            out.getFD().sync();
        } catch (IOException e) {
            tmp.delete();
            return false;
        }
        return tmp.renameTo(f);
    }

    // ------------------------------------------------------------------ games

    /** The built-in collection's list of games, or an empty one. */
    String collection() {
        try (InputStream in = assets.open("collection/collection.json")) {
            return new String(readAll(in, 32 * 1024 * 1024), UTF8);
        } catch (IOException e) {
            return "{\"games\":[]}";
        }
    }

    /** Opens a game's file: "builtin:path" lives in the app, "user:id" in private storage. */
    InputStream open(String src) throws IOException {
        if (src == null) throw new IOException("no source");
        if (src.startsWith("builtin:")) {
            String p = safePath(src.substring(8));
            if (p == null) throw new IOException("bad path");
            return assets.open("collection/" + p);
        }
        if (src.startsWith("user:")) {
            File f = blob(src.substring(5));
            if (f == null || !f.isFile()) throw new IOException("missing");
            return new FileInputStream(f);
        }
        throw new IOException("unknown source");
    }

    /** A file sitting next to a built-in game (for games made of several files). */
    InputStream openBeside(String src, String rel) throws IOException {
        if (src == null || !src.startsWith("builtin:")) throw new IOException("not found");
        String base = src.substring(8);
        int slash = base.lastIndexOf('/');
        String dir = slash >= 0 ? base.substring(0, slash + 1) : "";
        String p = safePath(dir + rel);
        if (p == null) throw new IOException("bad path");
        return assets.open("collection/" + p);
    }

    File blob(String id) {
        if (id == null || !BLOB_ID.matcher(id).matches()) return null;
        return new File(blobs, id);
    }

    boolean deleteBlob(String id) {
        File f = blob(id);
        return f != null && (!f.exists() || f.delete());
    }

    boolean writeBlob(String id, String html) {
        File f = blob(id);
        return f != null && html != null && writeAtomically(f, html.getBytes(UTF8));
    }

    File thumb(String name) {
        if (name == null || !THUMB_NAME.matcher(name).matches()) return null;
        return new File(thumbs, name);
    }

    static String newId() {
        byte[] b = new byte[8];
        new SecureRandom().nextBytes(b);
        StringBuilder s = new StringBuilder();
        for (byte x : b) s.append(String.format(Locale.ROOT, "%02x", x & 0xff));
        return s.toString();
    }

    /** Copies a file the player picked into storage. Returns {blob, name, size, title} or null. */
    JSONObject importUri(Uri uri, String dir) {
        ContentResolver cr = ctx.getContentResolver();
        String name = displayName(uri);
        if (name == null) name = "game.html";
        if (!HTML_NAME.matcher(name).matches()) return null;
        String id = newId();
        File f = new File(blobs, id);
        byte[] head = new byte[2 * 1024 * 1024];
        int headLen = 0;
        long size = 0;
        try (InputStream in = cr.openInputStream(uri); OutputStream out = new FileOutputStream(f)) {
            if (in == null) return null;
            byte[] buf = new byte[256 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                if (headLen < head.length) {
                    int k = Math.min(n, head.length - headLen);
                    System.arraycopy(buf, 0, head, headLen, k);
                    headLen += k;
                }
                size += n;
            }
        } catch (Exception e) {
            f.delete();
            return null;
        }
        try {
            JSONObject o = new JSONObject();
            o.put("blob", id);
            o.put("name", name);
            o.put("size", size);
            o.put("title", titleOf(head, headLen));
            if (dir != null && !dir.isEmpty()) o.put("dir", dir);
            return o;
        } catch (Exception e) {
            return null;
        }
    }

    /** Copies every .html file under a folder the player picked (keeping its sub-folders). */
    JSONArray importTree(Uri tree) {
        JSONArray out = new JSONArray();
        String rootDoc = DocumentsContract.getTreeDocumentId(tree);
        String rootName = docName(tree, rootDoc);
        walk(tree, rootDoc, "", out, 0);
        // every game remembers the picked folder's name so the library can recreate it
        for (int i = 0; i < out.length(); i++) {
            try { out.getJSONObject(i).put("root", rootName == null ? "Folder" : rootName); } catch (Exception ignored) { }
        }
        return out;
    }

    private void walk(Uri tree, String docId, String path, JSONArray out, int depth) {
        if (depth > 8 || out.length() >= 500) return;
        Uri kids = DocumentsContract.buildChildDocumentsUriUsingTree(tree, docId);
        String[] cols = {DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME, DocumentsContract.Document.COLUMN_MIME_TYPE};
        try (Cursor c = ctx.getContentResolver().query(kids, cols, null, null, null)) {
            if (c == null) return;
            while (c.moveToNext()) {
                String id = c.getString(0), name = c.getString(1), mime = c.getString(2);
                if (name == null || name.startsWith(".")) continue;
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) {
                    walk(tree, id, path.isEmpty() ? name : path + "/" + name, out, depth + 1);
                } else if (HTML_NAME.matcher(name).matches()) {
                    JSONObject o = importUri(DocumentsContract.buildDocumentUriUsingTree(tree, id), path);
                    if (o != null) out.put(o);
                }
            }
        } catch (Exception ignored) { }
    }

    private String docName(Uri tree, String docId) {
        Uri u = DocumentsContract.buildDocumentUriUsingTree(tree, docId);
        try (Cursor c = ctx.getContentResolver().query(u, new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception ignored) { }
        return null;
    }

    String displayName(Uri uri) {
        if ("file".equals(uri.getScheme())) return uri.getLastPathSegment();
        try (Cursor c = ctx.getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception ignored) { }
        return uri.getLastPathSegment();
    }

    static String titleOf(byte[] head, int len) {
        String s = new String(head, 0, len, UTF8);
        Matcher m = TITLE.matcher(s);
        if (!m.find()) return "";
        return m.group(1).replace("&amp;", "&").replace("&mdash;", "—").replaceAll("\\s+", " ").trim();
    }

    // ------------------------------------------------------------------ backups

    /** Writes a backup: the library and saves (json), plus every added game and picture. */
    void writeBackup(OutputStream raw, String json) throws Exception {
        Set<String> blobIds = new HashSet<>();
        Set<String> thumbNames = new HashSet<>();
        JSONObject items = new JSONObject(json).optJSONObject("library");
        items = items == null ? null : items.optJSONObject("items");
        if (items != null) {
            JSONArray names = items.names();
            for (int i = 0; names != null && i < names.length(); i++) {
                JSONObject it = items.optJSONObject(names.getString(i));
                if (it == null) continue;
                String src = it.optString("src", "");
                if (src.startsWith("user:")) blobIds.add(src.substring(5));
                String th = it.optString("thumb", "");
                if (!th.isEmpty()) thumbNames.add(th);
            }
        }
        try (ZipOutputStream zip = new ZipOutputStream(raw)) {
            zip.putNextEntry(new ZipEntry("mooncart-backup.json"));
            zip.write(json.getBytes(UTF8));
            zip.closeEntry();
            for (String id : blobIds) {
                File f = blob(id);
                if (f == null || !f.isFile()) continue;
                zip.putNextEntry(new ZipEntry("files/" + id));
                copy(new FileInputStream(f), zip, false);
                zip.closeEntry();
            }
            for (String name : thumbNames) {
                File f = thumb(name);
                if (f == null || !f.isFile()) continue;
                zip.putNextEntry(new ZipEntry("thumbs/" + name));
                copy(new FileInputStream(f), zip, false);
                zip.closeEntry();
            }
        }
    }

    /** Reads a backup: puts its games and pictures back, returns its json (or null). */
    String readBackup(InputStream raw) throws IOException {
        String json = null;
        try (ZipInputStream zip = new ZipInputStream(raw)) {
            ZipEntry e;
            while ((e = zip.getNextEntry()) != null) {
                String n = e.getName();
                if (e.isDirectory()) continue;
                if (n.equals("mooncart-backup.json")) {
                    json = new String(readAll(zip, 256 * 1024 * 1024), UTF8);
                } else if (n.startsWith("files/")) {
                    File f = blob(n.substring(6));
                    if (f != null) writeStream(zip, f);
                } else if (n.startsWith("thumbs/")) {
                    File f = thumb(n.substring(7));
                    if (f != null) writeStream(zip, f);
                }
            }
        }
        return json;
    }

    private static void writeStream(InputStream in, File f) throws IOException {
        File tmp = new File(f.getPath() + ".tmp");
        try (OutputStream out = new FileOutputStream(tmp)) {
            byte[] buf = new byte[256 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        }
        if (!tmp.renameTo(f)) throw new IOException("could not save " + f.getName());
    }

    // ------------------------------------------------------------------ helpers

    static String safePath(String p) {
        if (p == null) return null;
        StringBuilder out = new StringBuilder();
        for (String part : p.split("/")) {
            if (part.isEmpty() || part.equals(".")) continue;
            if (part.equals("..") || part.contains("\\")) return null;
            if (out.length() > 0) out.append('/');
            out.append(part);
        }
        return out.length() == 0 ? null : out.toString();
    }

    static byte[] readAll(InputStream in, int limit) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[64 * 1024];
        int n;
        while ((n = in.read(buf)) > 0) {
            out.write(buf, 0, n);
            if (out.size() > limit) throw new IOException("too big");
        }
        return out.toByteArray();
    }

    static void copy(InputStream in, OutputStream out, boolean closeOut) throws IOException {
        try {
            byte[] buf = new byte[256 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        } finally {
            in.close();
            if (closeOut) out.close();
        }
    }
}
