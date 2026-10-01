import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeReadOnlyCode,
  formatReadOnlyViolations,
  DENIED_GLOBALS,
  DENIED_METHODS,
  MAX_CODE_LENGTH,
  RESERVED_MEMBERS,
} from "../dist/src/readonly-guard.js";

/**
 * The guard is a *name-based* AST check, so these tests double as the specification for
 * read-only code. Two rules are routinely conflated and are pinned separately below:
 *
 * - member assignment is rejected regardless of the property name;
 * - the method denylist matches by name only, so it also rejects reads on plain local objects.
 */

const ALLOWED = [
  "return 1;",
  "const o = {payload: 1}; return o.payload;",
  "let i = 0; i = i + 1; return i;",
  "for (let j = 0; j < 3; j = j + 1) {} return 1;",
  "const a = []; a.push({k: 1}); return a;",
  "const a = [1, 2]; a.pop(); a.shift(); return a;",
  "return [1, 2].map(function (x) { return x * 2; });",
  "return [1, 2].slice(0).join(',');",
  "return 'a-b'.split('-').join('_');",
  "return String(1).padStart(2, '0');",
  "return Math.max(1, 2) + Number('1');",
  "return Object.keys({a: 1}).length;",
  "return JSON.stringify({a: 1});",
  "return Date.now();",
  "return /sort/.test('x');",
  "return Application.ActiveSheet.Range('A1').Value2;",
  "return Application.Worksheets.Count;",
  "return Application?.ActiveSheet?.Range('A1')?.Value2;",
  "const {a} = {a: 1}; return a;",
  "const [x] = [1]; return x;",
  "const f = (x) => x + 1; return f(1);",
  "return 'o.a = 1; arr.sort();';",
  "const copy = 1; return copy;",
  "const key = 'payload'; const o = {payload: 1}; return o[key];",
];

const BLOCKED = [
  ["member assignment (any property name)", "const o = {}; o.payload = 1; return o;", "MEMBER_ASSIGNMENT"],
  ["document assignment", "Application.ActiveSheet.Range('A1').Value2 = 1; return true;", "MEMBER_ASSIGNMENT"],
  ["computed assignment", "const o = {}; o['a'] = 1; return o;", "MEMBER_ASSIGNMENT"],
  ["array destructuring assignment", "let a; let b; [a, b] = [1, 2]; return a + b;", "MEMBER_ASSIGNMENT"],
  ["increment", "let i = 0; i++; return i;", "UPDATE_EXPRESSION"],
  ["decrement", "let i = 0; --i; return i;", "UPDATE_EXPRESSION"],
  ["delete", "const o = {a: 1}; delete o.a; return o;", "DELETE_OPERATOR"],
  ["new Date", "const d = new Date(); return d.getTime();", "NEW_OPERATOR"],
  ["new Map", "const m = new Map(); return 1;", "NEW_OPERATOR"],
  ["denied method call", "const arr = [3, 1, 2]; arr.sort(); return arr;", "DENIED_MEMBER"],
  ["denied method read", "const o = {copy: 1}; return o.copy;", "DENIED_MEMBER"],
  ["denied method on a local object", "const o = {run: 1}; return o.run;", "DENIED_MEMBER"],
  ["reserved property read", "return [].constructor;", "RESERVED_MEMBER"],
  ["reserved property call", "return ({}).constructor();", "RESERVED_MEMBER"],
  ["denied global", "return eval('1+1');", "DENIED_GLOBAL"],
  ["denied global via member", "return globalThis.eval('1+1');", "DENIED_GLOBAL"],
  ["dynamic member call", "const k = 'Item'; return Application.Worksheets[k](1);", "DYNAMIC_MEMBER_CALL"],
  ["denied method nested in a function", "const f = function () { const o = {}; o.a = 1; return o; }; return f();", "MEMBER_ASSIGNMENT"],
];

test("denylists keep the published shape", () => {
  // Bumping these counts is a deliberate act: the numbers are also quoted in the
  // agent-facing skill, so both places must move together.
  assert.equal(DENIED_METHODS.size, 60);
  assert.equal(DENIED_GLOBALS.size, 7);
  assert.deepEqual([...RESERVED_MEMBERS].sort(), ["__proto__", "constructor", "prototype"]);
  for (const name of ["sort", "copy", "insert", "save", "select", "replace", "write"]) assert.ok(DENIED_METHODS.has(name), `${name} must stay denied`);
  for (const name of ["eval", "Function", "fetch"]) assert.ok(DENIED_GLOBALS.has(name), `${name} must stay denied`);
});

test("read-only code that only reads and computes passes", () => {
  for (const code of ALLOWED) {
    const analysis = analyzeReadOnlyCode(code);
    assert.equal(analysis.invalid, null, `unexpected syntax error for: ${code}`);
    assert.deepEqual(analysis.violations, [], `expected to pass: ${code}`);
    assert.equal(analysis.ok, true);
  }
});

test("blocking constructs are reported with a specific kind", () => {
  for (const [label, code, kind] of BLOCKED) {
    const analysis = analyzeReadOnlyCode(code);
    assert.equal(analysis.invalid, null, `unexpected syntax error for ${label}`);
    assert.equal(analysis.ok, false, `expected to be blocked: ${label}`);
    assert.ok(analysis.violations.length >= 1, `no violation recorded for ${label}`);
    assert.equal(analysis.violations[0].kind, kind, `wrong kind for ${label}: ${analysis.violations[0].message}`);
    assert.equal(typeof analysis.violations[0].message, "string");
    assert.ok(analysis.violations[0].line >= 1, `missing line information for ${label}`);
  }
});

test("member assignment and the name denylist are independent rules", () => {
  // Assigning to a harmless property name is still blocked: the rule looks at the syntax.
  const assigned = analyzeReadOnlyCode("const o = {}; o.payload = 1; return o;");
  assert.deepEqual(assigned.violations.map((v) => v.kind), ["MEMBER_ASSIGNMENT"]);

  // Reading a harmless property name is fine...
  assert.deepEqual(analyzeReadOnlyCode("const o = {payload: 1}; return o.payload;").violations, []);

  // ...but reading a denied name is blocked even though nothing is written.
  const read = analyzeReadOnlyCode("const o = {copy: 1}; return o.copy;");
  assert.deepEqual(read.violations.map((v) => v.kind), ["DENIED_MEMBER"]);
});

test("every violation is reported in a single pass", () => {
  const code = [
    "let i = 0; i++;",
    "const o = {}; o.a = 1;",
    "const arr = [3, 1]; arr.sort();",
    "const d = new Date();",
    "return {i: i, o: o, arr: arr, d: d};",
  ].join("\n");
  const analysis = analyzeReadOnlyCode(code);
  assert.deepEqual(
    analysis.violations.map((v) => v.kind).sort(),
    ["DENIED_MEMBER", "MEMBER_ASSIGNMENT", "NEW_OPERATOR", "UPDATE_EXPRESSION"],
  );
  assert.deepEqual(analysis.violations.map((v) => v.line), [1, 2, 3, 4]);

  const message = formatReadOnlyViolations(analysis.violations);
  assert.match(message, /4 violations found/);
  for (const kind of ["MEMBER_ASSIGNMENT", "UPDATE_EXPRESSION", "NEW_OPERATOR", "DENIED_MEMBER"]) {
    assert.ok(message.includes(kind), `message must list ${kind}`);
  }
  assert.match(message, /line 4/);
  assert.match(message, /wps_create_render/);
});

test("a denied method used as a call is reported once, not twice", () => {
  const analysis = analyzeReadOnlyCode("const arr = [3, 1]; arr.sort(); return arr;");
  assert.equal(analysis.violations.length, 1);
  assert.equal(analysis.violations[0].kind, "DENIED_MEMBER");
});

test("unusable code is reported as invalid rather than as a violation", () => {
  assert.equal(analyzeReadOnlyCode("").invalid.kind, "CODE_SIZE");
  assert.equal(analyzeReadOnlyCode("   \n  ").invalid.kind, "CODE_SIZE");
  assert.equal(analyzeReadOnlyCode(`return '${"x".repeat(MAX_CODE_LENGTH + 1)}';`).invalid.kind, "CODE_SIZE");
  assert.equal(analyzeReadOnlyCode("return (((;").invalid.kind, "SYNTAX");
  assert.equal(analyzeReadOnlyCode("import x from 'y'; return 1;").invalid.kind, "SYNTAX");
  assert.equal(analyzeReadOnlyCode("const r = await Promise.resolve(1); return r;").invalid.kind, "SYNTAX");
  for (const code of ["", "return (((;"]) {
    const analysis = analyzeReadOnlyCode(code);
    assert.deepEqual(analysis.violations, [], "invalid code must not also report violations");
    assert.equal(analysis.ok, false);
  }
});
