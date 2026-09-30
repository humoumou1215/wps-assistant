import { cp, mkdir, readFile, realpath, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSkillsFromDir, type Skill, type ToolDefinition } from "@earendil-works/pi-coding-agent";
import { z } from "zod";
import { DATA_DIR } from "./paths.js";

// Resolve from the module, so development and packaged dist/src builds both work
// even when the bridge is started from a different working directory.
const sourceSkills = new URL("../skills/", import.meta.url);
export const BUNDLED_SKILLS_DIR = fileURLToPath(existsSync(sourceSkills) ? sourceSkills : new URL("../../skills/", import.meta.url));
export const AGENT_DIR = join(DATA_DIR, "pi");
export const INSTALLED_SKILLS_DIR = join(AGENT_DIR, "skills");

export async function installBundledSkills(source = BUNDLED_SKILLS_DIR, target = INSTALLED_SKILLS_DIR) {
  await mkdir(target, { recursive: true, mode: 0o700 });
  // Copy whole skill directories, including references and supporting resources.
  // Refresh shipped files on startup; retain separately installed skills.
  await cp(source, target, { recursive: true, force: true });
  return loadSkillsFromDir({ dir: target, source: "wps-mcp" });
}

function isWithin(root: string, path: string) {
  const rel = relative(root, path);
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(".." + sep));
}

export async function readSkillContent(skills: Skill[], path: string) {
  const candidate = resolve(INSTALLED_SKILLS_DIR, path);
  if (!skills.some(skill => isWithin(skill.baseDir, candidate))) throw new Error("只能读取已安装技能目录中的文件");
  const resolved = await realpath(candidate);
  // Reject links escaping either the installed skill root or its own directory.
  const installed = await realpath(INSTALLED_SKILLS_DIR);
  if (!isWithin(installed, resolved)) throw new Error("只能读取已安装技能目录中的文件");
  const roots = await Promise.all(skills.map(skill => realpath(skill.baseDir)));
  if (!roots.some(root => isWithin(root, resolved))) throw new Error("只能读取已安装技能目录中的文件");
  const info = await stat(resolved);
  if (!info.isFile() || info.size > 2_000_000) throw new Error("技能文件必须是小于 2 MB 的文本文件");
  const content = await readFile(resolved, "utf8");
  if (content.includes("\0")) throw new Error("只能读取技能文本文件");
  return { path: resolved, content };
}

export async function readSkillFile(skills: Skill[], path: string, offset = 1, limit = 200) {
  if (!Number.isInteger(offset) || offset < 1 || !Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error("offset 必须为正整数；limit 必须为 1–1000");
  const { path: resolved, content } = await readSkillContent(skills, path);
  const lines = content.split(/\r?\n/);
  const selected = lines.slice(offset - 1, offset - 1 + limit);
  return { path: resolved, content: selected.join("\n"), offset, totalLines: lines.length, nextOffset: offset - 1 + selected.length < lines.length ? offset + selected.length : undefined };
}

export function createSkillReadTool(skills: Skill[]): ToolDefinition {
  return {
    name: "read", label: "读取技能资料",
    description: "读取已安装技能的 SKILL.md 和目录内参考资料。path 使用技能列表中的绝对路径，或相对技能安装目录的路径。仅允许读取技能文本，不能读取其他本机文件。可用 offset（起始行，默认 1）和 limit（行数，默认 200，最多 1000）分页。",
    parameters: z.toJSONSchema(z.object({ path: z.string().min(1), offset: z.number().int().min(1).optional(), limit: z.number().int().min(1).max(1000).optional() })) as any,
    executionMode: "sequential",
    execute: async (_id, args, signal) => {
      if (signal?.aborted) throw new Error("已停止");
      const input = args as { path: string; offset?: number; limit?: number };
      const value = await readSkillFile(skills, input.path, input.offset, input.limit);
      const suffix = value.nextOffset ? `\n\n[共 ${value.totalLines} 行；继续读取请使用 offset=${value.nextOffset}]` : "";
      return { content: [{ type: "text", text: value.content + suffix }], details: value };
    },
  };
}
