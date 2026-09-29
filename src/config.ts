import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { DATA_DIR } from "./tools.js";

const configFile = join(DATA_DIR, "config.json");
const modelSchema = z.object({
  id: z.string().trim().min(1).max(200), name: z.string().max(200).default(""),
  contextWindow: z.number().int().min(1024).max(10_000_000),
  maxTokens: z.number().int().min(1).max(1_000_000),
  reasoning: z.boolean(), vision: z.boolean(),
});
export const configSchema = z.object({
  kind: z.enum(["builtin", "custom"]), label: z.string().trim().max(200),
  baseUrl: z.string().max(2000), api: z.enum(["openai-completions", "openai-responses"]),
  apiKey: z.string().max(16000).optional(), model: modelSchema,
  thinkingLevel: z.enum(["off", "minimal", "low", "medium", "high", "xhigh", "max"]),
  compat: z.object({
    thinkingFormat: z.enum(["", "openai", "deepseek", "qwen", "chat-template", "together", "zai", "string-thinking"]).default(""),
    maxTokensField: z.enum(["", "max_tokens", "max_completion_tokens"]).default(""),
  }),
  headers: z.record(z.string().regex(/^[A-Za-z0-9-]+$/), z.string().max(16000).refine(s => !/[\r\n]/.test(s))).optional(),
}).superRefine((c, ctx) => {
  if (c.model.maxTokens > c.model.contextWindow) ctx.addIssue({ code: "custom", message: "最大输出不能超过上下文长度", path: ["model", "maxTokens"] });
  if (c.kind === "custom") {
    try {
      const url = new URL(c.baseUrl);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    } catch { ctx.addIssue({ code: "custom", message: "Base URL 必须是不含凭据、查询参数的 HTTP(S) 地址", path: ["baseUrl"] }); }
  }
});
export type ModelConfig = z.infer<typeof configSchema>;
export const defaults: ModelConfig = {
  kind: "builtin", label: "DeepSeek 官方", baseUrl: "", api: "openai-completions",
  model: { id: "deepseek-flash", name: "deepseek-flash", contextWindow: 1000000, maxTokens: 65536, reasoning: true, vision: true },
  thinkingLevel: "off", compat: { thinkingFormat: "", maxTokensField: "" },
};
let current: ModelConfig = structuredClone(defaults);
let configured = false;
export async function loadConfig() {
  try { current = configSchema.parse(JSON.parse(await readFile(configFile, "utf8"))); configured = true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
export function getConfig() { return structuredClone(current); }
export function publicConfig() {
  const { apiKey, headers, ...safe } = current;
  return { ...safe, configured, hasKey: !!apiKey, hasHeaders: !!headers && Object.keys(headers).length > 0 };
}
export function parseConfig(input: unknown): ModelConfig {
  const next = configSchema.parse(input);
  // A saved credential belongs to its endpoint. Never silently send it to another endpoint.
  const sameEndpoint = next.kind === current.kind && (next.kind === "builtin" || next.baseUrl.replace(/\/$/, "") === current.baseUrl.replace(/\/$/, ""));
  return { ...next, apiKey: next.apiKey ?? (sameEndpoint ? current.apiKey : ""), headers: next.headers ?? (sameEndpoint ? current.headers : {}) };
}
export async function saveConfig(next: ModelConfig) {
  await mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  const temp = `${configFile}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
  await rename(temp, configFile);
  current = next;
  configured = true;
  return publicConfig();
}
export function redact(message: string) {
  for (const secret of [current.apiKey, ...Object.values(current.headers ?? {})]) {
    if (secret) message = message.split(secret).join("[已隐藏]");
  }
  return message;
}
