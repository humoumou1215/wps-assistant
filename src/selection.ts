import { z } from "zod";

// Keep in sync with the native collector and taskpane-view.js. Coordinates are
// never shortened; text is a preview, not the authoritative range contents.
export const MAX_SELECTION_TEXT = 2000;

export function boundedSelection(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const selection = value as Record<string, unknown>;
  if (typeof selection.text !== "string") return selection;
  const truncated = selection.text.length > MAX_SELECTION_TEXT;
  return {
    ...selection,
    text: selection.text.slice(0, MAX_SELECTION_TEXT),
    ...(truncated ? { textTruncated: true, textLength: Math.max(selection.text.length, typeof selection.textLength === 'number' ? selection.textLength : 0) } : {}),
  };
}

const index = z.number().int().nonnegative();
const identity = z.number().int().positive();
const textPreview = {
  text: z.string().optional(),
  textTruncated: z.boolean().optional(),
  textLength: index.optional(),
};
const spreadsheet = z.object({
  sheet: z.string().min(1).optional(), address: z.string().min(1),
  areas: z.array(z.object({ address: z.string().min(1) })).min(1).max(500).optional(),
});
const presentation = z.object({
  type: z.enum(["text", "shape"]), nativeType: index.optional(),
  slide: identity.optional(), slideId: identity.optional(),
  shapeNames: z.array(z.string().min(1)).min(1).max(500).optional(),
  shapeIds: z.array(identity).min(1).max(500).optional(),
  start: identity.optional(), length: index.optional(), ...textPreview,
});
const writer = z.object({
  type: z.enum(["text", "caret"]), nativeType: index.optional(),
  start: index, end: index, storyType: identity, ...textPreview,
}).refine(s => s.end >= s.start && (s.type === "caret" ? s.end === s.start : s.end > s.start));

export function validateSelection(type: string, value: unknown, activeSheet?: string, activeSlide?: number) {
  const schema = type === "spreadsheet" ? spreadsheet : type === "presentation" ? presentation : writer;
  const parsed = schema.safeParse(boundedSelection(value));
  if (!parsed.success) throw new Error("选区定位信息不完整或无效，请重新选择内容并更新 WPS 插件");
  const s = parsed.data as Record<string, any>;
  if (type === "spreadsheet" && !(s.sheet || activeSheet)) throw new Error("选区缺少明确工作表，请重新引用选区");
  if (type === "presentation") {
    const hasSlide = s.slideId || s.slide || (Number.isInteger(activeSlide) && activeSlide! > 0);
    const hasShape = s.shapeIds?.length || s.shapeNames?.length;
    // Legacy whole-shape references can use a saved page/name. Local text must
    // have stable identities and an exact range; never widen it to the shape.
    if (!hasSlide || !hasShape || (s.type === "text" &&
      (!s.slideId || s.shapeIds?.length !== 1 || s.start === undefined || s.length === undefined))) {
      throw new Error("选区缺少幻灯片、对象身份或文字范围，请重新选择内容并更新 WPS 插件");
    }
  }
  return s;
}
