package com.mappaterritori.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import java.io.File;

public class MainActivity extends BridgeActivity {
    private static final String PREFS = "mt_boot";
    private static final String KEY_CLEANED_VERSION = "cleaned_for_version";
    // Incrementa questo valore per forzare un reset della WebView al prossimo avvio
    // (Service Worker, cache HTTP, IndexedDB, localStorage).
    private static final int CURRENT_CLEAN_VERSION = 2;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        int last = prefs.getInt(KEY_CLEANED_VERSION, 0);
        if (last < CURRENT_CLEAN_VERSION) {
            try {
                File dataDir = new File(getApplicationInfo().dataDir);
                deleteRecursive(new File(dataDir, "app_webview"));
                deleteRecursive(new File(dataDir, "app_textures"));
                deleteRecursive(new File(getCacheDir(), "WebView"));
            } catch (Exception ignored) {}
            prefs.edit().putInt(KEY_CLEANED_VERSION, CURRENT_CLEAN_VERSION).apply();
        }
        super.onCreate(savedInstanceState);
    }

    private static void deleteRecursive(File f) {
        if (f == null || !f.exists()) return;
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) for (File k : kids) deleteRecursive(k);
        }
        f.delete();
    }
}
