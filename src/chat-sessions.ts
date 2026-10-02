import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { AGENT_DIR } from "./agent-skills.js";

const sessionDir = join(AGENT_DIR, "sessions");
const indexFile = join(AGENT_DIR, "chat-sessions.json");
type Index = { activeId?: string; archived: string[]; autoCompact: boolean };
let index: Index = { archived: [], autoCompact: true };
let manager: SessionManager | undefined;
let initializing: Promise<SessionManager> | undefined;

async function saveIndex() {
  await writeFile(indexFile + ".tmp", JSON.stringify(index) + "\n", { mode: 0o600 });
  await rename(indexFile + ".tmp", indexFile);
}
async function createEmpty() {
  const created = SessionManager.create(AGENT_DIR, sessionDir);
  const path = created.getSessionFile()!;
  // Pi delays persistence until the first assistant response. Persist the header
  // so empty chats can be listed and selected after a restart, then reopen it.
  await writeFile(path, JSON.stringify(created.getHeader()) + "\n", { mode: 0o600, flag: "wx" });
  return SessionManager.open(path, sessionDir);
}
export async function chatSessionManager(): Promise<SessionManager> {
  if (manager) return manager;
  if (!initializing) initializing = (async () => {
    await mkdir(sessionDir, { recursive: true, mode: 0o700 });
    try { index = JSON.parse(await readFile(indexFile, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const sessions = await SessionManager.list(AGENT_DIR, sessionDir);
    const chosen = sessions.find(s => s.id === index.activeId && !index.archived.includes(s.id)) ?? sessions.find(s => !index.archived.includes(s.id));
    manager = chosen ? SessionManager.open(chosen.path, sessionDir) : await createEmpty();
    index.activeId = manager.getSessionId();
    await saveIndex();
    return manager;
  })().finally(() => { initializing = undefined; });
  return initializing;
}
export function autoCompactionEnabled() { return index.autoCompact; }
export async function setAutoCompaction(enabled: boolean) { index.autoCompact = enabled; await saveIndex(); }
export async function listChatSessions() {
  const active = await chatSessionManager();
  const sessions = await SessionManager.list(AGENT_DIR, sessionDir);
  return { activeId: active.getSessionId(), sessions: sessions.map(s => ({ id: s.id, name: s.name || (s.firstMessage === "(no messages)" ? "" : s.firstMessage.slice(0, 80)) || "新会话", created: s.created, modified: s.modified, messageCount: s.messageCount, archived: index.archived.includes(s.id) })) };
}
export async function changeChatSession(op: "new" | "select" | "archive" | "restore" | "delete" | "clone", id?: string) {
  const active = await chatSessionManager();
  if (op === "new") manager = await createEmpty();
  else if (op === "clone") manager = SessionManager.forkFrom(active.getSessionFile()!, AGENT_DIR, sessionDir);
  else {
    // Accept IDs only, resolving paths exclusively from this app's session list.
    const target = (await SessionManager.list(AGENT_DIR, sessionDir)).find(s => s.id === id);
    if (!target) throw new Error("会话不存在或已删除");
    if (op === "select") {
      if (index.archived.includes(target.id)) throw new Error("请先恢复已归档会话");
      if (target.id !== active.getSessionId()) manager = SessionManager.open(target.path, sessionDir);
    } else if (op === "restore") index.archived = index.archived.filter(value => value !== target.id);
    else {
      if (op === "delete") { await unlink(target.path); index.archived = index.archived.filter(value => value !== target.id); }
      else if (!index.archived.includes(target.id)) index.archived.push(target.id);
      if (target.id === active.getSessionId()) {
        const next = (await SessionManager.list(AGENT_DIR, sessionDir)).find(s => !index.archived.includes(s.id));
        manager = next ? SessionManager.open(next.path, sessionDir) : await createEmpty();
      }
    }
  }
  index.activeId = manager!.getSessionId();
  await saveIndex();
  return listChatSessions();
}
