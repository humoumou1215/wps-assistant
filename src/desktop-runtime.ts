// Short-lived control helper. Only the service and native tray remain resident.
import { execFile, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { openSync, closeSync } from "node:fs";
import { mkdir, open, readFile, writeFile, unlink, stat, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { createConnection } from "node:net";
import { DATA_DIR } from "./paths.js";
import { registerAddins, removeAddins } from "./addin-registration.js";

const execute = promisify(execFile);
const appDir = await realpath(fileURLToPath(new URL("../../", import.meta.url)));
const port = Number(process.env.WPS_MCP_PORT ?? 18766);
if (!Number.isInteger(port) || port < 1025 || port > 65535) throw new Error("无效的服务端口");
const base = `http://127.0.0.1:${port}`;
const metaPath = join(DATA_DIR, "desktop-service.json");
const markerPath = join(DATA_DIR, "desktop-registration.json");
/// 标记已按哪个端口/目录注册过；removed 记录用户主动移除的决定，启动服务据此不再自动补注册。
type RegistrationMarker = { port: number; addinsDir: string; removed?: boolean };
const addinsDir = resolve(process.env.WPS_MCP_ADDINS_DIR ?? (process.platform === "darwin"
  ? join(homedir(), "Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons")
  : join(process.env.APPDATA ?? join(homedir(), "AppData/Roaming"), "kingsoft/wps/jsaddons")));
type Metadata = { pid: number; instanceId: string; token: string; appDir: string; dataDir: string; port: number; parentPid?: number };
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function alive(pid: number) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return (error as NodeJS.ErrnoException).code === "EPERM"; }
}
async function readObject<T>(path: string): Promise<T | undefined> {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw new Error(`无法读取运行记录：${path}`); }
}
async function listening() {
  return new Promise<boolean>((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const done = (value: boolean) => { socket.destroy(); resolve(value); };
    socket.once("connect", () => done(true)); socket.once("error", () => done(false));
    socket.setTimeout(1000, () => done(true)); // Uncertain listeners are never taken over.
  });
}
async function ownedStatus(meta: Metadata) {
  if (meta.appDir !== appDir || meta.dataDir !== DATA_DIR || meta.port !== port || !meta.token || !alive(meta.pid)) {
    throw new Error("服务运行记录属于其他路径或进程；请从原程序停止服务后重试");
  }
  const response = await fetch(`${base}/api/desktop/status`, { headers: { authorization: `Bearer ${meta.token}` }, signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error("端口由其他服务管理；请先停止原来的源码服务或免安装程序");
  const status = await response.json() as Metadata & { busy: boolean };
  if (status.instanceId !== meta.instanceId || status.pid !== meta.pid || status.appDir !== appDir || status.dataDir !== DATA_DIR || status.port !== port) {
    throw new Error("服务身份不匹配，拒绝操作");
  }
  return status;
}
/// 注册和启动都要求完全退出 WPS：文档宿主加上常驻的后台/CEF 宿主进程。
function wpsProcessNames() {
  if (process.platform === "darwin") return ["wpsoffice", "promecefpluginhost"];
  if (process.platform === "win32") return ["wps", "et", "wpp", "wpscenter", "promecefpluginhost"];
  throw new Error("免安装桌面程序只支持 macOS 和 Windows");
}
/// 正在运行的 WPS 进程数。macOS 逐个用 pgrep 精确匹配，Windows 一次查询进程名列表。
async function wpsProcessCount(names = wpsProcessNames(), deadline?: number) {
  const options = () => ({ windowsHide: true, ...(deadline === undefined ? {} : { timeout: remainingCloseTime(deadline) }) });
  if (process.platform === "darwin") {
    let count = 0;
    for (const name of names) {
      try { count += (await execute("/usr/bin/pgrep", ["-x", name], options())).stdout.split("\n").filter(Boolean).length; }
      catch (error) {
        if (deadline !== undefined) remainingCloseTime(deadline);
        if ((error as { code?: number }).code === 1) continue;
        throw new Error("无法检查 WPS 是否已退出");
      }
    }
    return count;
  }
  const result = await execute("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `@(Get-Process -Name ${names.join(",")} -ErrorAction SilentlyContinue).Count`], options());
  const count = Number(result.stdout.trim());
  if (!Number.isInteger(count) || count < 0) throw new Error("无法检查 WPS 是否已退出");
  return count;
}
/// 注册前必须先退出 WPS。reason 让托盘能识别这一情形，改为弹确认框并代用户关闭。
export async function assertWpsClosed() {
  if ((await wpsProcessCount()) === 0) return;
  throw Object.assign(
    new Error(process.platform === "darwin"
      ? "请完全退出 WPS（包括后台进程），再选择「修复 WPS 加载项注册」或「启动服务」"
      : "请完全退出 WPS（包括右下角托盘进程），再重试注册"),
    { reason: "wps-running" },
  );
}
const CLOSE_TIMEOUT = "WPS 未能在 15 秒内完全退出；请在 WPS 中保存并关闭后重试";
function remainingCloseTime(deadline: number) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error(CLOSE_TIMEOUT);
  return remaining;
}
async function waitForWpsExit(names: string[], deadline: number) {
  while (true) {
    remainingCloseTime(deadline);
    const count = await wpsProcessCount(names, deadline);
    remainingCloseTime(deadline);
    if (count === 0) return;
    await pause(Math.min(250, remainingCloseTime(deadline)));
  }
}
/// Only terminate background hosts after every document host has exited normally.
async function closeWps() {
  const deadline = Date.now() + 15_000;
  const names = wpsProcessNames();
  const run = async (file: string, args: string[]) => {
    try { await execute(file, args, { windowsHide: true, timeout: remainingCloseTime(deadline) }); }
    catch (error) {
      if (Date.now() >= deadline || (error as { killed?: boolean }).killed) throw new Error(CLOSE_TIMEOUT);
      throw new Error("WPS 关闭已取消或失败；请在 WPS 中保存并关闭后重试", { cause: error });
    }
    remainingCloseTime(deadline);
  };
  const count = await wpsProcessCount(names, deadline);
  remainingCloseTime(deadline);
  if (count === 0) return "WPS 未在运行";
  if (process.platform === "win32") {
    for (const name of ["wps", "et", "wpp"]) {
      if (await wpsProcessCount([name], deadline)) await run("taskkill.exe", ["/IM", `${name}.exe`]);
    }
    await waitForWpsExit(["wps", "et", "wpp"], deadline);
    for (const name of ["wpscenter", "promecefpluginhost"]) {
      if (await wpsProcessCount([name], deadline)) await run("taskkill.exe", ["/IM", `${name}.exe`, "/F"]);
    }
  } else {
    if (await wpsProcessCount(["wpsoffice"], deadline)) {
      await run("/usr/bin/osascript", ["-e", 'tell application id "com.kingsoft.wpsoffice.mac" to quit']);
      await waitForWpsExit(["wpsoffice"], deadline);
    }
    if (await wpsProcessCount(["promecefpluginhost"], deadline)) await run("/usr/bin/pkill", ["-x", "promecefpluginhost"]);
  }
  await waitForWpsExit(names, deadline);
  return "WPS 已关闭";
}
// Stopping through the authenticated endpoint both checks busy and gates new work.
// Keep the operation lock until registration and service recovery are complete.
async function withClosedWps(action: () => Promise<string> = closeWps) {
  const running = await listening();
  if (running) await stop();
  else {
    const meta = await readObject<Metadata>(metaPath);
    if (meta && alive(meta.pid)) throw new Error("服务正在启动或退出，请稍后重试；不会关闭 WPS");
  }
  let result: string | undefined, failure: unknown;
  try { result = await action(); } catch (error) { failure = error; }
  if (running) {
    try { await start(false); }
    catch (error) {
      const detail = failure instanceof Error ? failure.message + "；" : "";
      throw new Error(`${detail}服务恢复失败：${(error as Error).message}`);
    }
  }
  if (failure) throw failure;
  return result!;
}
async function register() {
  await assertWpsClosed();
  registerAddins(addinsDir, String(port), process.env.WPS_MCP_ADDIN_ENABLE ?? "enable_dev", process.platform);
  await writeFile(markerPath, JSON.stringify({ port, addinsDir }), { mode: 0o600 });
  return "WPS 加载项已注册，可以重新打开 WPS。";
}
/// 移除注册也要完全退出 WPS；标记保留端口/目录并把 removed 置位，避免下次启动服务又补注册。
async function unregister() {
  await assertWpsClosed();
  const message = removeAddins(addinsDir, process.platform);
  await writeFile(markerPath, JSON.stringify({ port, addinsDir, removed: true }), { mode: 0o600 });
  return message;
}
async function start(firstRun: boolean) {
  const meta = await readObject<Metadata>(metaPath);
  if (await listening()) {
    if (!meta) throw new Error(`端口 ${port} 已被其他服务占用。请先停止原来的源码部署服务，再启动免安装版`);
    await ownedStatus(meta);
    const parentPid = Number(process.env.WPS_MCP_DESKTOP_PARENT_PID);
    if (parentPid && meta.parentPid !== parentPid) throw new Error("当前服务绑定其他托盘或旧版本，请先停止旧服务后重试");
    return "服务已在运行";
  }
  if (meta && alive(meta.pid)) throw new Error("已有服务进程尚未就绪或正在退出，请稍后重试；不会启动第二个服务");
  if (firstRun) {
    const marker = await readObject<RegistrationMarker>(markerPath);
    // 端口/目录一致就视为已处理过：主动移除（removed）同样跳过，否则移除会被下次启动悄悄撤销。
    if (marker?.port !== port || marker?.addinsDir !== addinsDir) await register();
  }
  const logs = join(DATA_DIR, "logs"); await mkdir(logs, { recursive: true });
  const output = openSync(join(logs, "desktop.stdout.log"), "a", 0o600);
  const errors = openSync(join(logs, "desktop.stderr.log"), "a", 0o600);
  const instanceId = randomUUID(), token = randomBytes(32).toString("hex");
  const parentPid = process.env.WPS_MCP_DESKTOP_PARENT_PID ? Number(process.env.WPS_MCP_DESKTOP_PARENT_PID) : undefined;
  if (parentPid !== undefined && (!Number.isInteger(parentPid) || parentPid <= 1 || !alive(parentPid))) throw new Error("托盘进程已退出，取消服务启动");
  let child;
  try {
    child = spawn(process.execPath, [join(appDir, "dist/src/server.js")], {
      cwd: appDir, detached: true, windowsHide: true, stdio: ["ignore", output, errors],
      env: { ...process.env, WPS_MCP_TRANSPORT: "http", WPS_MCP_PORT: String(port), WPS_MCP_DATA_DIR: DATA_DIR, WPS_MCP_DESKTOP_INSTANCE: instanceId, WPS_MCP_DESKTOP_TOKEN: token },
    });
    await new Promise<void>((resolve, reject) => { child!.once("spawn", resolve); child!.once("error", reject); });
  } finally { closeSync(output); closeSync(errors); }
  const next: Metadata = { pid: child.pid!, instanceId, token, appDir, dataDir: DATA_DIR, port, parentPid };
  try { await writeFile(metaPath, JSON.stringify(next), { mode: 0o600 }); }
  catch (error) { child.kill(); throw error; }
  child.unref();
  for (let i = 0; i < 60; i++) {
    if (!alive(next.pid)) throw new Error(`服务启动失败，请查看 ${logs}/desktop.stderr.log`);
    try { await ownedStatus(next); return "服务已启动"; } catch { /* Wait for initialization. */ }
    await pause(500);
  }
  throw new Error(`服务启动超时，进程仍保留，请查看 ${logs}，稍后通过托盘重试`);
}
async function stop() {
  const meta = await readObject<Metadata>(metaPath);
  if (!(await listening())) {
    if (meta && alive(meta.pid)) throw new Error("服务进程尚未就绪或正在退出，请稍后重试");
    await unlink(metaPath).catch(error => { if (error.code !== "ENOENT") throw error; });
    return "服务已停止";
  }
  if (!meta) throw new Error("当前服务不由免安装程序管理，请从原启动方式停止");
  await ownedStatus(meta);
  const response = await fetch(`${base}/api/desktop/stop`, {
    method: "POST", headers: { authorization: `Bearer ${meta.token}`, "content-type": "application/json" }, body: "{}", signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) { const result = await response.json() as { error?: string }; throw new Error(result.error ?? "停止失败"); }
  for (let i = 0; i < 60; i++) {
    if (!alive(meta.pid)) { await unlink(metaPath); return "服务已停止"; }
    await pause(250);
  }
  throw new Error("服务尚未退出，请稍后重试；不会强制结束文档操作");
}
export function xmlEscape(value: string) { return value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!); }
async function login(enabled: boolean, executable: string) {
  if (!executable) throw new Error("缺少托盘程序路径");
  const tray = await realpath(executable);
  if (process.platform === "darwin") {
    const plist = join(homedir(), "Library/LaunchAgents/com.local.wps-assistant.tray.plist");
    if (enabled) {
      await mkdir(dirname(plist), { recursive: true });
      const environments = ["WPS_MCP_PORT", "WPS_MCP_DATA_DIR", "WPS_MCP_ADDINS_DIR", "WPS_MCP_ADDIN_ENABLE"].filter(key => process.env[key]);
      await writeFile(plist, `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>com.local.wps-assistant.tray</string><key>ProgramArguments</key><array><string>${xmlEscape(tray)}</string></array><key>RunAtLoad</key><true/><key>EnvironmentVariables</key><dict>${environments.map(key => `<key>${key}</key><string>${xmlEscape(process.env[key]!)}</string>`).join("")}</dict></dict></plist>\n`, { mode: 0o600 });
    } else {
      // No KeepAlive: leave this login's running tray alone; subsequent logins omit it.
      await unlink(plist).catch(error => { if (error.code !== "ENOENT") throw error; });
    }
  } else if (process.platform === "win32") {
    const key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    const options = [["--port", String(port)], ["--data-dir", DATA_DIR], ["--addins-dir", addinsDir], ["--addin-enable", process.env.WPS_MCP_ADDIN_ENABLE ?? "enable_dev"]];
    const startup = [`"${tray}"`, ...options.map(([key, value]) => `"${key}=${value}"`)].join(" ");
    const args = enabled ? ["add", key, "/v", "WpsAssistantTray", "/t", "REG_SZ", "/d", startup, "/f"] : ["delete", key, "/v", "WpsAssistantTray", "/f"];
    await execute("reg.exe", args, { windowsHide: true });
  } else throw new Error("不支持的桌面平台");
  return enabled ? "已启用下次登录时启动，请保留程序在当前路径" : "已关闭登录启动";
}
async function withLock<T>(operation: () => Promise<T>) {
  await mkdir(DATA_DIR, { recursive: true });
  const path = join(DATA_DIR, "desktop-operation.lock");
  let lock;
  for (let i = 0; i < 2; i++) {
    try { lock = await open(path, "wx", 0o600); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const content = await readFile(path, "utf8");
      const pid = Number(content);
      if (alive(pid) || (!pid && Date.now() - (await stat(path)).mtimeMs < 30_000)) throw new Error("另一个启停或注册操作正在运行，请稍后重试");
      await unlink(path);
    }
  }
  if (!lock) throw new Error("无法获取服务操作锁");
  try { await lock.writeFile(String(process.pid)); return await operation(); }
  finally { await lock.close(); await unlink(path); }
}
export async function desktopCommand(command: string, tray = "") {
  return withLock(async () => {
    switch (command) {
      case "initialize": case "start": return start(true);
      case "stop": return stop();
      case "quit": {
        const meta = await readObject<Metadata>(metaPath);
        // A source deployment or another app is never stopped when this tray exits.
        if (!meta || meta.appDir !== appDir || meta.dataDir !== DATA_DIR || meta.port !== port) return "已退出";
        return stop();
      }
      case "restart": await stop(); return start(true);
      case "register": return register();
      case "unregister": return unregister();
      case "close-wps": return withClosedWps();
      case "register-close-wps": case "unregister-close-wps": return withClosedWps(async () => {
        await closeWps();
        return command === "register-close-wps" ? register() : unregister();
      });
      case "login-on": return login(true, tray);
      case "login-off": return login(false, tray);
      default: throw new Error("未知托盘操作");
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify({ ok: true, message: await desktopCommand(process.argv[2] ?? "initialize", process.argv[3]) })); }
  catch (error) {
    // reason 只由本文件的显式标记产生，ErrnoException 的 code 不会串到这里。
    const failure = error as { message?: string; reason?: string };
    console.log(JSON.stringify({ ok: false, message: failure.message ?? "操作失败", ...(failure.reason ? { reason: failure.reason } : {}) }));
    process.exitCode = 1;
  }
}
