import { homedir } from "node:os";
import { join, resolve } from "node:path";

function defaultDataDir() {
  if (process.platform === "win32") return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "wps-mcp");
  if (process.platform === "darwin") return join(homedir(), "Library/Application Support/wps-mcp");
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "wps-mcp");
}

export const DATA_DIR = resolve(process.env.WPS_MCP_DATA_DIR ?? defaultDataDir());
