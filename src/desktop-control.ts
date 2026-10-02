import { timingSafeEqual } from "node:crypto";

// Available only in services launched by the portable runtime. Never expose the token.
export const desktopInstance = process.env.WPS_MCP_DESKTOP_INSTANCE;
const token = process.env.WPS_MCP_DESKTOP_TOKEN;
export const desktopManaged = Boolean(desktopInstance && token);
let stopping = false;
let stop: (() => void) | undefined;
let busy: () => boolean = () => true;
export function configureDesktopStop(callback: () => void, isBusy: () => boolean) { stop = callback; busy = isBusy; }
export function isDesktopBusy() { return busy(); }
export function isDesktopStopping() { return stopping; }
export function desktopAuthorized(authorization: string | undefined) {
  if (!desktopManaged || !authorization) return false;
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(authorization);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function requestDesktopStop() {
  if (!stop) throw new Error("服务尚未就绪");
  stopping = true;
  // Give the HTTP response time to flush; the gate prevents new work meanwhile.
  setTimeout(stop, 100);
}
