import { z } from "zod";
import { getState, refreshDocument } from "./tools.js";
import { validateSelection } from "./selection.js";

export const selectionRefSchema = z.object({
  kind: z.literal("sel"), id: z.string().min(1),
  selectionMode: z.enum(["current", "fixed"]).default("fixed"),
  label: z.string().max(1000).optional(), marker: z.string().max(40).optional(),
  activeSheet: z.string().optional(), activeSlide: z.number().optional(),
  selection: z.record(z.string(), z.unknown()).optional(),
});

export function selectionLabel(ref: { selectionMode?: string; name: string; activeSheet?: string; activeSlide?: number; selection?: unknown }) {
  const s = (ref.selection || {}) as Record<string, any>;
  const position = s.address ? `${s.sheet || ref.activeSheet || ""}!${s.address}`
    : [ref.activeSlide ? `第 ${ref.activeSlide} 页` : "", s.shapeNames?.join("、"),
      typeof s.text === "string" && s.type === "text" ? `「${s.text.slice(0, 40)}${s.text.length > 40 ? "…" : ""}」` : "",
      s.start !== undefined ? (s.end !== undefined ? `字符 ${s.start}–${s.end}` : `起点 ${s.start} · ${s.length ?? 0} 字符`) : ""].filter(Boolean).join(" › ");
  const label = `${ref.selectionMode === "current" ? "当前选区" : "固定选区"} · ${ref.name} › ${position || "无选区"}`;
  return label.length > 900 ? label.slice(0, 900) + "…" : label;
}

export async function resolveSelectionReference(input: unknown, freshDocument?: Awaited<ReturnType<typeof refreshDocument>>) {
  const ref = selectionRefSchema.parse(input);
  const doc = ref.selectionMode === "current" ? freshDocument ?? await refreshDocument(ref.id)
    : getState().documents.find(d => d.documentId === ref.id && d.connected);
  if (!doc) throw new Error(`引用文档已断开：${ref.id}`);
  const snapshot = ref.selectionMode === "current" ? doc.selection : ref.selection ?? doc.selection;
  if (!snapshot || (snapshot as any).type === "none") throw new Error("该文档没有可用的当前选区，请在文档中选择内容后重试");
  const activeSheet = ref.selectionMode === "current" ? doc.activeSheet : ref.activeSheet ?? (ref.selection ? undefined : doc.activeSheet);
  const activeSlide = ref.selectionMode === "current" ? doc.activeSlide : ref.activeSlide ?? (ref.selection ? undefined : doc.activeSlide);
  const selection = validateSelection(doc.type, snapshot, activeSheet, activeSlide);
  const resolved = {
    ...doc, ...ref, selection,
    activeSheet,
    activeSlide,
    selectionResolved: true,
  };
  return { ...resolved, label: selectionLabel(resolved) };
}
