import { AsyncLocalStorage } from "node:async_hooks";
import { appendFile, mkdir, readdir, rename, stat, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { DATA_DIR } from "./paths.js";

const levels = { debug: 10, info: 20, warn: 30, error: 40, silent: Infinity };
export type LogLevel = keyof typeof levels;
type Fields = Record<string, unknown>;
type Context = Record<string, string>;
type Scope = { context: Context; secrets: string[] };
export type LoggerOptions = {
  level?: LogLevel;
  directory?: string;
  file?: boolean;
  maxBytes?: number;
  maxFiles?: number;
  maxPending?: number;
  stderr?: (line: string) => void;
};

const privateKey = /^(api[-_]?key|authorization|proxy-authorization|password|secret|token|access[-_]?token|cookie|set-cookie|headers|code|args|params|body|prompt|messages|refs|result|payload|value|documentKey|path|baseUrl)$/i;

/** Small, bounded async file sink. All records go to stderr, never MCP stdout. */
export function createLogger(options: LoggerOptions = {}) {
  const level = options.level ?? "info";
  const directory = resolve(options.directory ?? join(DATA_DIR, "logs"));
  const file = join(directory, "wps-mcp.log");
  const maxBytes = Math.max(1024, options.maxBytes ?? 10 * 1024 * 1024);
  const maxFiles = Math.max(1, Math.min(100, Math.trunc(options.maxFiles ?? 5)));
  const maxPending = Math.max(1, options.maxPending ?? 1000);
  const scope = new AsyncLocalStorage<Scope>();
  const stderr = options.stderr ?? ((line: string) => { process.stderr.write(line); });
  let secrets: string[] = [];
  let queue = Promise.resolve();
  let pending = 0;
  let initialized = false;
  let size = 0;
  let fileFailed = false;
  let overflowReported = false;

  function writeStderr(line: string) {
    try { stderr(line); } catch { /* Diagnostics must never fail an operation. */ }
  }
  function hide(text: string) {
    // Replace secrets before truncating, including literal credential values in error stacks.
    for (const secret of [...secrets, ...(scope.getStore()?.secrets ?? [])].sort((a, b) => b.length - a.length)) {
      if (secret) text = text.split(secret).join("[REDACTED]");
    }
    return text.replace(/\bBearer\s+[^\s"',;]+/gi, "Bearer [REDACTED]")
      .replace(/\b(api[-_]?key|password|token|secret)\s*[=:]\s*[^\s"',;]+/gi, "$1=[REDACTED]")
      .slice(0, 4096);
  }
  function sanitize(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
    if (typeof value === "string") return hide(value);
    if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
    if (typeof value === "bigint") return String(value);
    if (typeof value !== "object") return "[Unsupported]";
    if (seen.has(value)) return "[Circular]";
    if (depth >= 6) return "[Truncated]";
    seen.add(value);
    if (value instanceof Error) {
      return sanitize({ name: value.name, message: value.message, code: (value as NodeJS.ErrnoException).code, stack: value.stack }, depth + 1, seen);
    }
    if (Array.isArray(value)) return value.slice(0, 50).map(v => sanitize(v, depth + 1, seen));
    return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, v]) => [hide(key), privateKey.test(key) ? "[REDACTED]" : sanitize(v, depth + 1, seen)]));
  }
  async function remove(path: string) {
    try { await unlink(path); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  async function append(line: string) {
    if (!initialized) {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      // Also honor a reduced retention setting after restart; leave unrelated files alone.
      for (const name of await readdir(directory)) {
        const archive = /^wps-mcp\.log\.(\d+)$/.exec(name);
        if (archive && Number(archive[1]) >= maxFiles) await remove(join(directory, name));
      }
      try { size = (await stat(file)).size; } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      initialized = true;
    }
    const bytes = Buffer.byteLength(line);
    if (size > 0 && size + bytes > maxBytes) {
      await remove(maxFiles === 1 ? file : `${file}.${maxFiles - 1}`);
      for (let i = maxFiles - 2; i >= 0; i--) {
        try { await rename(i === 0 ? file : `${file}.${i}`, `${file}.${i + 1}`); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      }
      size = 0;
    }
    await appendFile(file, line, { mode: 0o600 });
    size += bytes;
  }
  function diagnostic(event: string, error?: unknown) {
    writeStderr(JSON.stringify({ time: new Date().toISOString(), level: "warn", pid: process.pid, event, errorCode: (error as NodeJS.ErrnoException | undefined)?.code }) + "\n");
  }
  function emit(recordLevel: Exclude<LogLevel, "silent">, event: string, fields: Fields = {}) {
    if (levels[recordLevel] < levels[level]) return;
    let line: string;
    try {
      const base = { time: new Date().toISOString(), level: recordLevel, pid: process.pid, event: hide(event) };
      // Reserved fields cannot be overwritten by callers.
      const record = { ...sanitize(fields) as Fields, ...sanitize(scope.getStore()?.context ?? {}) as Context, ...base };
      line = JSON.stringify(record) + "\n";
      if (Buffer.byteLength(line) > maxBytes) line = JSON.stringify({ ...base, truncated: true }) + "\n";
    } catch { diagnostic("logger.serialization_failed"); return; }
    writeStderr(line);
    if (options.file === false || fileFailed) return;
    if (pending >= maxPending) {
      if (!overflowReported) { diagnostic("logger.queue_full"); overflowReported = true; }
      return;
    }
    pending++;
    queue = queue.then(async () => { if (!fileFailed) await append(line); })
      .catch(error => { fileFailed = true; diagnostic("logger.file_unavailable", error); })
      .finally(() => { pending--; if (pending === 0) overflowReported = false; });
  }
  return {
    file, level,
    debug: (event: string, fields?: Fields) => emit("debug", event, fields),
    info: (event: string, fields?: Fields) => emit("info", event, fields),
    warn: (event: string, fields?: Fields) => emit("warn", event, fields),
    error: (event: string, fields?: Fields) => emit("error", event, fields),
    setSecrets: (values: (string | undefined)[]) => { secrets = [...new Set(values.filter((v): v is string => !!v))]; },
    withContext<T>(context: Context, fn: () => T): T {
      const parent = scope.getStore();
      return scope.run({ context: { ...parent?.context, ...context }, secrets: parent?.secrets ?? [] }, fn);
    },
    withSecrets<T>(values: (string | undefined)[], fn: () => T): T {
      const parent = scope.getStore();
      return scope.run({ context: parent?.context ?? {}, secrets: [...(parent?.secrets ?? []), ...values.filter((v): v is string => !!v)] }, fn);
    },
    flush: () => queue,
  };
}

function positiveInteger(value: string | undefined, fallback: number) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}
const requestedLevel = process.env.WPS_MCP_LOG_LEVEL ?? "info";
export const logger = createLogger({
  level: Object.hasOwn(levels, requestedLevel) ? requestedLevel as LogLevel : "info",
  directory: process.env.WPS_MCP_LOG_DIR,
  file: process.env.WPS_MCP_LOG_FILE !== "0",
  maxBytes: positiveInteger(process.env.WPS_MCP_LOG_MAX_BYTES, 10 * 1024 * 1024),
  maxFiles: positiveInteger(process.env.WPS_MCP_LOG_MAX_FILES, 5),
});
