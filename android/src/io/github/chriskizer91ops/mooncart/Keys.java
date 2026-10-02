package io.github.chriskizer91ops.mooncart;

import android.view.KeyEvent;

import java.util.HashMap;
import java.util.Map;

/** Translations between web key names, Android key codes and the console's buttons. */
final class Keys {
    private static final Map<String, Integer> CODES = new HashMap<>();
    static {
        CODES.put("ArrowUp", KeyEvent.KEYCODE_DPAD_UP);
        CODES.put("ArrowDown", KeyEvent.KEYCODE_DPAD_DOWN);
        CODES.put("ArrowLeft", KeyEvent.KEYCODE_DPAD_LEFT);
        CODES.put("ArrowRight", KeyEvent.KEYCODE_DPAD_RIGHT);
        CODES.put("Enter", KeyEvent.KEYCODE_ENTER);
        CODES.put("Space", KeyEvent.KEYCODE_SPACE);
        CODES.put("Escape", KeyEvent.KEYCODE_ESCAPE);
        CODES.put("Backspace", KeyEvent.KEYCODE_DEL);
        CODES.put("Tab", KeyEvent.KEYCODE_TAB);
        CODES.put("ShiftLeft", KeyEvent.KEYCODE_SHIFT_LEFT);
        for (char c = 'A'; c <= 'Z'; c++) CODES.put("Key" + c, KeyEvent.KEYCODE_A + (c - 'A'));
        for (char c = '0'; c <= '9'; c++) CODES.put("Digit" + c, KeyEvent.KEYCODE_0 + (c - '0'));
    }

    /** Android key code for a web key name such as "Enter" or "KeyE"; 0 if unknown. */
    static int androidKey(String code) {
        Integer k = code == null ? null : CODES.get(code);
        return k == null ? 0 : k;
    }

    /** The console button a controller key stands for, or null. */
    static String padButton(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_DPAD_UP: return "up";
            case KeyEvent.KEYCODE_DPAD_DOWN: return "down";
            case KeyEvent.KEYCODE_DPAD_LEFT: return "left";
            case KeyEvent.KEYCODE_DPAD_RIGHT: return "right";
            case KeyEvent.KEYCODE_BUTTON_A: case KeyEvent.KEYCODE_DPAD_CENTER: return "a";
            case KeyEvent.KEYCODE_BUTTON_B: return "b";
            case KeyEvent.KEYCODE_BUTTON_X: return "a";
            case KeyEvent.KEYCODE_BUTTON_Y: return "b";
            case KeyEvent.KEYCODE_BUTTON_START: return "start";
            case KeyEvent.KEYCODE_BUTTON_SELECT: return "select";
            case KeyEvent.KEYCODE_BUTTON_MODE: return "home";
            case KeyEvent.KEYCODE_BUTTON_L1: case KeyEvent.KEYCODE_BUTTON_L2: return "select";
            case KeyEvent.KEYCODE_BUTTON_R1: case KeyEvent.KEYCODE_BUTTON_R2: return "start";
            default: return null;
        }
    }

    /** Keyboard shortcuts that work even while a game has the keyboard. */
    static String shortcut(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_F1: return "menu";
            case KeyEvent.KEYCODE_F4: return "home";
            case KeyEvent.KEYCODE_F5: return "restart";
            case KeyEvent.KEYCODE_F11: return "frame";
            default: return null;
        }
    }
}
