import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Use import.meta.url to reliably find the bot root directory
// (dist/index.js -> dist/ -> botDir), regardless of process.cwd()
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANG_FILE = path.join(__dirname, "..", ".tray-lang");

/**
 * Read the current language preference from .tray-lang file.
 * Returns "en" (default) or "hu".
 * Reads fresh from disk on each call so tray app changes take effect immediately.
 */
function getCurrentLang(): "en" | "hu" {
  try {
    const content = fs.readFileSync(LANG_FILE, "utf-8").trim();
    return content === "hu" || content === "kr" ? "hu" : "en";
  } catch {
    return "en";
  }
}

/**
 * Localization helper. Returns the string matching the current language.
 * Usage: L("Hello", "Szia")
 */
export function L(en: string, hu: string): string {
  return getCurrentLang() === "hu" ? hu : en;
}
