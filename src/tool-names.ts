import type { AgentSession } from "@earendil-works/pi-coding-agent";

// Compatibility for saved conversations only; the callable tool registry exposes canonical names.
const legacyNamePairs: [string, string][] = [
  ["workspace.list_documents", "wps_list_documents"],
  ["document.get", "wps_get_document"],
  ["wps.exec", "wps_run_readonly_code"],
  ["transform.create", "wps_create_variable"],
  ["transform.update", "wps_update_transform"],
  ["render.create", "wps_create_render"],
  ["render.update", "wps_update_render"],
  ["variable.get", "wps_get_variable"],
  ["variable.transform", "wps_run_transform"],
  ["variable.render", "wps_run_render"],
];
const legacyNames: Record<string, string> = Object.fromEntries(legacyNamePairs.flatMap(([old, name]) => [[old, name], [old.replaceAll(".", "_"), name]]));

export function normalizeToolName(name: string) {
  return Object.hasOwn(legacyNames, name) ? legacyNames[name]! : name;
}

export function normalizeToolMessages(messages: AgentSession["messages"]): AgentSession["messages"] {
  return messages.map(message => {
    if (message.role === "toolResult") return { ...message, toolName: normalizeToolName(message.toolName) };
    if (message.role === "assistant") return {
      ...message,
      content: message.content.map(block => block.type === "toolCall" ? { ...block, name: normalizeToolName(block.name) } : block),
    };
    return message;
  });
}
