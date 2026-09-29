#!/usr/bin/env node
/**
 * Register (or remove) the WPS MCP Add-in in the local WPS Office JS add-in
 * registry (publish.xml). Cross-platform: macOS and Windows.
 *
 * The registry file already contains entries from other local add-ins; this
 * script only ever touches its own <jspluginonline name="WpsMcp*"> entries and
 * backs the file up before the first change.
 *
 * Usage:
 *   node scripts/install-addin.mjs --dry-run     # preview, writes nothing
 *   node scripts/install-addin.mjs               # register ET/WPP/WPS add-ins
 *   node scripts/install-addin.mjs --uninstall   # remove them again
 *
 * Env:
 *   WPS_MCP_PORT            bridge port, default 18766
 *   WPS_MCP_ADDIN_ENABLE    enable attribute, default enable_dev
 *   WPS_MCP_ADDINS_DIR      override the jsaddons directory
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const PORT = process.env.WPS_MCP_PORT ?? "18766";
const ENABLE = process.env.WPS_MCP_ADDIN_ENABLE ?? "enable_dev";
const BACKUP_NAME = "publish.xml.backup-before-wps-mcp";
const HOSTS = [
  { host: "et", name: "WpsMcpET" },
  { host: "wpp", name: "WpsMcpWPP" },
  { host: "wps", name: "WpsMcpWPS" },
];
const OWN_ENTRY = /<jsplugin(?:online)?\b[^>]*\bname\s*=\s*["'](WpsMcpET|WpsMcpWPP|WpsMcpWPS)["'][^>]*\/?>/gi;
/** Line-scoped form used for removal so no blank lines are left behind. */
const OWN_LINE = /^[ \t]*<jsplugin(?:online)?\b[^>]*\bname\s*=\s*["'](WpsMcpET|WpsMcpWPP|WpsMcpWPS)["'][^>]*\/?>[ \t]*\r?\n?/gim;

const flags = new Set(process.argv.slice(2));
const unknown = [...flags].filter((flag) => !["--dry-run", "--uninstall"].includes(flag));
if (unknown.length) {
  console.error(`Unknown argument(s): ${unknown.join(", ")}\nUsage: node scripts/install-addin.mjs [--dry-run] [--uninstall]`);
  process.exit(2);
}
const dryRun = flags.has("--dry-run");
const uninstall = flags.has("--uninstall");

function addinsDir() {
  if (process.env.WPS_MCP_ADDINS_DIR) return process.env.WPS_MCP_ADDINS_DIR;
  if (platform() === "win32") {
    const appData = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appData, "kingsoft", "wps", "jsaddons");
  }
  if (platform() === "darwin") {
    return join(homedir(), "Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons");
  }
  throw new Error(`Unsupported platform '${platform()}'; set WPS_MCP_ADDINS_DIR to the WPS jsaddons directory`);
}

function entryFor({ host, name }) {
  return `  <jspluginonline name="${name}" url="http://127.0.0.1:${PORT}/addins/${host}/" type="${host}" enable="${ENABLE}" debug="" install="null"/>`;
}

/** Keep our own entries on the current port/dev settings without touching other add-ins. */
function normalize(tag) {
  let result = tag;
  for (const [key, value] of [["enable", ENABLE], ["debug", ""], ["install", "null"]]) {
    const pattern = new RegExp(`\\b${key}="[^"]*"`);
    result = pattern.test(result) ? result.replace(pattern, `${key}="${value}"`) : result.replace(/\/?>$/, ` ${key}="${value}"/>`);
  }
  return result;
}

const DIR = addinsDir();
const PUBLISH = join(DIR, "publish.xml");
const BACKUP = join(DIR, BACKUP_NAME);
console.log(`Add-in registry: ${PUBLISH}`);

await mkdir(DIR, { recursive: true });
let original = null;
try { original = await readFile(PUBLISH, "utf8"); } catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (original === null) console.log("  publish.xml does not exist yet; a new one will be created.");

const CRLF = original?.includes("\r\n") ?? false;
const EOL = CRLF ? "\r\n" : "\n";
let content = original ?? `<?xml version="1.0" encoding="UTF-8"?>${EOL}<jsplugins>${EOL}</jsplugins>${EOL}`;

if (!/<\/jsplugins>/i.test(content)) {
  console.error("  publish.xml has no </jsplugins>; refusing to touch it to protect other add-ins.");
  process.exit(1);
}

const existingNames = new Set([...content.matchAll(OWN_ENTRY)].map((match) => match[1]));
let removed = 0;
if (uninstall) {
  content = content.replace(OWN_LINE, () => { removed += 1; return ""; });
} else {
  content = content.replace(OWN_ENTRY, (tag) => normalize(tag));
}

if (!uninstall) {
  const missing = HOSTS.filter(({ name }) => !existingNames.has(name));
  if (missing.length) {
    const block = missing.map(entryFor).join(EOL);
    const index = content.toLowerCase().lastIndexOf("</jsplugins>");
    content = content.slice(0, index) + block + EOL + content.slice(index);
  }
}

const changed = content !== (original ?? "");
console.log(`  existing WpsMcp entries: ${existingNames.size ? [...existingNames].join(", ") : "none"}`);
console.log(`  action: ${uninstall ? `remove ${removed} entr${removed === 1 ? "y" : "ies"}` : `register ${HOSTS.length} entries on port ${PORT} (enable="${ENABLE}")`}`);

if (!changed) {
  console.log("  publish.xml already up to date; nothing to write.");
} else if (dryRun) {
  console.log(`\n--- preview (dry run, nothing written) ---\n${content}`);
} else {
  if (original !== null) {
    let haveBackup = true;
    try { await readFile(BACKUP); } catch { haveBackup = false; }
    if (haveBackup) console.log(`  backup already present: ${BACKUP_NAME}`);
    else { await copyFile(PUBLISH, BACKUP); console.log(`  backup written: ${BACKUP_NAME}`); }
  }
  await writeFile(PUBLISH, content, "utf8");
  console.log("  publish.xml updated.");
}

if (!dryRun && changed) {
  console.log(uninstall
    ? "\nFully quit and restart WPS Office to unload the add-in."
    : "\nFully quit and restart WPS Office, then open a document to load the add-in.");
  console.log(`Verify the bridge is up: curl http://127.0.0.1:${PORT}/health`);
}
