/**
 * Read-only code guard for `wps.exec` / `variable.transform`.
 *
 * This module is the single source of truth for what read-only code may contain.
 * It is a *name-based* AST check, not a sandbox: WPS JS API is intentionally powerful.
 *
 * Two properties matter for callers, and both are deliberate:
 *
 * 1. The check is purely syntactic. It matches node types and property-name strings,
 *    so it cannot tell a document object from a plain local object. `const o = {}; o.a = 1`
 *    is rejected exactly like `Range('A1').Value2 = 1`.
 * 2. `analyzeReadOnlyCode` reports **every** violation in one pass instead of throwing on
 *    the first one. Callers that surface errors to an agent must keep that behaviour: the
 *    guard used to fail fast, which forced agents into one-violation-per-round retry loops.
 */

import { parse } from "acorn";

export const MAX_CODE_LENGTH = 100_000;

/**
 * Method/property names rejected wherever they appear, whether read or called.
 * Matched case-insensitively, and matched against *any* object — including plain literals,
 * so a hand-rolled `{ copy: 1 }` helper trips the guard too.
 */
export const DENIED_METHODS = new Set([
  "add", "add2", "addchart", "addshape", "addtextbox", "addtable", "addslide", "addworksheet",
  "delete", "remove", "clear", "clearcontents", "clearformats", "insert", "insertafter", "insertbefore",
  "cut", "paste", "copy", "duplicate", "merge", "unmerge", "save", "saveas", "close", "quit", "run",
  "execute", "sendkeys", "select", "activate", "undo", "redo", "writefile", "appendfile", "mkdir",
  "setvalue", "settext", "setdata", "setsource", "autofill", "autofilter", "sort", "sortascending", "sortdescending",
  "calculate", "calculatefull", "refresh", "refreshall", "replace", "exportasfixedformat", "applytemplate", "insertbreak",
  "addapieventlistener", "removeapieventlistener", "write", "savecopyas", "protect", "unprotect", "printout",
]);

/** Globals that may not be called. Matched case-sensitively. */
export const DENIED_GLOBALS = new Set(["eval", "Function", "fetch", "XMLHttpRequest", "WebSocket", "Worker", "SharedWorker"]);

/** Prototype-chain properties that are always rejected. Matched case-sensitively. */
export const RESERVED_MEMBERS = new Set(["constructor", "__proto__", "prototype"]);

export type ViolationKind =
  | "MEMBER_ASSIGNMENT"
  | "UPDATE_EXPRESSION"
  | "DELETE_OPERATOR"
  | "NEW_OPERATOR"
  | "DENIED_MEMBER"
  | "RESERVED_MEMBER"
  | "DENIED_GLOBAL"
  | "DYNAMIC_MEMBER_CALL";

export type ReadOnlyViolation = {
  kind: ViolationKind;
  /** 1-based line number, when source locations are available. */
  line?: number;
  /** 1-based column number, when source locations are available. */
  column?: number;
  /** The offending source line, trimmed and truncated. */
  snippet?: string;
  /** One self-contained sentence describing the rule and the rewrite that works. */
  message: string;
};

export type GuardInvalid = {
  kind: "CODE_SIZE" | "SYNTAX";
  message: string;
};

export type GuardAnalysis = {
  /** Non-null when the code could not be validated at all (surfaced as INVALID_REQUEST). */
  invalid: GuardInvalid | null;
  /** Every blocking violation, in source order. Empty when the code passes. */
  violations: ReadOnlyViolation[];
  /** True when the code would pass the guard. */
  ok: boolean;
};

type AstNode = Record<string, any>;

const SNIPPET_MAX = 160;

/** Parse as a non-module script with a top-level `return`, mirroring how the host wraps code. */
function parseScript(code: string): { ast: AstNode | null; error: string | null } {
  try {
    const ast = parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
      allowReturnOutsideFunction: true,
      locations: true,
    }) as unknown as AstNode;
    return { ast, error: null };
  } catch (error) {
    return { ast: null, error: (error as Error).message };
  }
}

function positionOf(node: AstNode | undefined): { line?: number; column?: number } {
  const loc = node?.loc?.start;
  if (!loc) return {};
  return { line: loc.line, column: loc.column + 1 };
}

/** Property name of a (possibly computed) member expression, exactly as the guard sees it. */
function memberName(node: AstNode): string | undefined {
  if (!node) return undefined;
  if (node.computed && node.property?.type === "Literal") return String(node.property.value);
  return node.property?.name;
}

function deniedMember(node: AstNode): boolean {
  const prop = memberName(node);
  if (prop === undefined) return false;
  return DENIED_METHODS.has(prop.toLowerCase()) || RESERVED_MEMBERS.has(prop);
}

/**
 * Collect every read-only violation in `code`.
 *
 * Never throws: a syntax error and the violation list are both reported through the result,
 * so callers can decide how to phrase the failure.
 */
export function analyzeReadOnlyCode(code: string): GuardAnalysis {
  if (!code.trim() || code.length > MAX_CODE_LENGTH) {
    return { invalid: { kind: "CODE_SIZE", message: `code must be 1-${MAX_CODE_LENGTH} characters` }, violations: [], ok: false };
  }
  const { ast, error } = parseScript(code);
  if (!ast) {
    return { invalid: { kind: "SYNTAX", message: `Invalid JavaScript: ${error}` }, violations: [], ok: false };
  }

  const violations: ReadOnlyViolation[] = [];
  const seen = new Set<string>();
  const push = (kind: ViolationKind, node: AstNode | undefined, message: string) => {
    const { line, column } = positionOf(node);
    const key = `${kind}|${line ?? ""}|${column ?? ""}|${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    const snippet = typeof node?.__snippet === "string" && node.__snippet ? node.__snippet : undefined;
    violations.push({ kind, ...(line !== undefined ? { line } : {}), ...(column !== undefined ? { column } : {}), ...(snippet ? { snippet } : {}), message });
  };

  // Attach the source line to each node lazily so messages can quote it.
  const sourceLines = code.split(/\r?\n/);
  const annotate = (node: AstNode) => {
    const line = node?.loc?.start?.line;
    if (typeof line !== "number") return undefined;
    const text = sourceLines[line - 1];
    if (text === undefined) return undefined;
    const trimmed = text.trim();
    return trimmed.length > SNIPPET_MAX ? `${trimmed.slice(0, SNIPPET_MAX)}…` : trimmed;
  };

  const visit = (node: AstNode, parent: AstNode | null) => {
    if (!node || typeof node !== "object") return;
    const snippet = annotate(node);
    node.__snippet = snippet ?? "";

    switch (node.type) {
      case "AssignmentExpression":
        if (node.left?.type !== "Identifier") {
          push("MEMBER_ASSIGNMENT", node,
            "Assigned to something other than a local variable. This check is purely syntactic — it rejects assignment to *any* member expression "
            + "(and to array/object destructuring patterns), not just to WPS document objects. Accumulate into a local variable instead, e.g. `acc = acc + 1`.");
        }
        break;
      case "UpdateExpression":
        push("UPDATE_EXPRESSION", node,
          `'${node.operator}' is never allowed in read-only code, not even on a local counter. Rewrite as \`i = i + 1\` or \`i = i - 1\`.`);
        break;
      case "UnaryExpression":
        if (node.operator === "delete") {
          push("DELETE_OPERATOR", node, "The `delete` operator is not allowed in read-only code.");
        }
        break;
      case "NewExpression":
        push("NEW_OPERATOR", node,
          "The `new` operator is rejected for *every* constructor — built-ins included (`new Date()`, `new Map()`, `new Array()` all fail). "
          + "Use literal syntax (`[]`, `{}`), `Date.now()`, or an existing object.");
        break;
      case "MemberExpression": {
        // A member that is the callee of a call is reported by the CallExpression branch
        // below, which produces a more accurate message. Everything else is checked here,
        // because reading a denied property is a violation on its own.
        const isCallee = parent?.type === "CallExpression" && parent.callee === node;
        if (!isCallee && deniedMember(node)) {
          const prop = String(memberName(node));
          const reason = RESERVED_MEMBERS.has(prop)
            ? `'${prop}' is a reserved prototype-chain property and can never appear in read-only code.`
            : `Member '${prop}' is on the read-only denylist, matched by name only. It is rejected even on your own local objects — rename the property (e.g. \`payload\`, \`text\`, \`items\`) instead of fighting the guard.`;
          push(RESERVED_MEMBERS.has(prop) ? "RESERVED_MEMBER" : "DENIED_MEMBER", node, reason);
        }
        break;
      }
      case "CallExpression": {
        const callee = node.callee;
        if (callee?.type === "Identifier" && DENIED_GLOBALS.has(callee.name)) {
          push("DENIED_GLOBAL", node, `Call to global '${callee.name}' is not allowed in read-only code.`);
        }
        if (callee?.type === "MemberExpression") {
          if (callee.computed && callee.property?.type !== "Literal") {
            push("DYNAMIC_MEMBER_CALL", node,
              "Calling a member through a computed key (`obj[expr]()`) is not allowed. Branch explicitly with `if`/`else` and call each method by name.");
          }
          const prop = memberName(callee);
          if (prop !== undefined) {
            if (RESERVED_MEMBERS.has(prop)) {
              push("RESERVED_MEMBER", node, `Calling '${prop}' is not allowed: it is a reserved prototype-chain property.`);
            } else if (DENIED_GLOBALS.has(prop)) {
              push("DENIED_GLOBAL", node, `Call to '${prop}' is not allowed in read-only code.`);
            } else if (DENIED_METHODS.has(prop.toLowerCase())) {
              push("DENIED_MEMBER", node,
                `Method '${prop}' is on the read-only denylist, matched by name only — it is rejected even on your own local objects. Rename it, or move this step into a Render.`);
            }
          }
        }
        break;
      }
      default:
        break;
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "loc" || key === "start" || key === "end" || key === "__snippet") continue;
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === "object") visit(child, node);
      } else if (value && typeof value === "object") {
        visit(value, node);
      }
    }
  };

  visit(ast, null);
  return { invalid: null, violations, ok: violations.length === 0 };
}

/**
 * Render violations as a single multi-line message.
 *
 * Every violation is listed — including the count and the total — so a caller can fix them
 * all in one edit instead of resubmitting once per error.
 */
export function formatReadOnlyViolations(violations: ReadOnlyViolation[], limit = 30): string {
  const shown = violations.slice(0, Math.max(0, limit));
  const head = [
    "wps.exec / variable.transform run read-only code: nothing may be mutated, and the check is purely syntactic — it rejects edits to plain local objects exactly like edits to document objects.",
    `${violations.length} violation${violations.length === 1 ? "" : "s"} found. All of them are listed below: fix every one and resubmit once (the guard reports the whole batch, so there is no need to retry one violation at a time).`,
    "",
  ];
  const body = shown.map((violation, index) => {
    const pos = violation.line === undefined ? "" : ` (line ${violation.line}, column ${violation.column ?? 1})`;
    const lines = [`  ${String(index + 1).padStart(2, " ")}. [${violation.kind}]${pos} ${violation.message}`];
    if (violation.snippet) lines.push(`      ${violation.snippet}`);
    return lines.join("\n");
  });
  if (violations.length > shown.length) {
    body.push(`  … and ${violations.length - shown.length} more violation(s), omitted for brevity.`);
  }
  const tail = [
    "",
    "Document writes are not restricted: create the edit with render.create and run it with variable.render.",
  ];
  return [...head, ...body, ...tail].join("\n");
}
