import { test } from "node:test";
import assert from "node:assert/strict";
import { createGuardBudget, GUARD_RETRY_LIMIT } from "../dist/src/guard-budget.js";

/**
 * The budget is charged per *model round*, because one assistant message can fire several
 * `wps.exec` calls in parallel. These tests pin that behaviour: a regression here is what
 * aborted a whole session after two mistakes instead of three.
 */

test("parallel violations inside one model round cost a single charge", () => {
  const budget = createGuardBudget();
  budget.startTurn();
  assert.equal(budget.charge(), false);
  assert.equal(budget.charge(), false);
  assert.equal(budget.charge(), false);
  assert.equal(budget.failures, 1);
  assert.equal(budget.exhausted, false);
});

test("three correction rounds exhaust the budget, and only the last charge reports it", () => {
  const budget = createGuardBudget();
  budget.startTurn();
  assert.equal(budget.charge(), false);
  budget.startTurn();
  assert.equal(budget.charge(), false);
  budget.startTurn();
  assert.equal(budget.charge(), true);
  assert.equal(budget.exhausted, true);
  assert.equal(budget.failures, GUARD_RETRY_LIMIT);
});

test("the remainder of an exhausting round is not charged again", () => {
  const budget = createGuardBudget(1);
  budget.startTurn();
  assert.equal(budget.charge(), true);
  assert.equal(budget.charge(), false);
  assert.equal(budget.failures, 1);
});

test("rounds that violate nothing spend nothing", () => {
  const budget = createGuardBudget();
  budget.startTurn();
  budget.startTurn();
  budget.startTurn();
  budget.startTurn();
  assert.equal(budget.failures, 0);
  assert.equal(budget.exhausted, false);
});

test("without turn events, charging falls back to one per call", () => {
  const budget = createGuardBudget();
  assert.equal(budget.tracksTurns, false);
  assert.equal(budget.charge(), false);
  assert.equal(budget.charge(), false);
  assert.equal(budget.charge(), true);
  assert.equal(budget.failures, 3);
});

test("reset returns the budget to its initial state, including turn tracking", () => {
  const budget = createGuardBudget();
  budget.startTurn();
  budget.charge();
  budget.startTurn();
  budget.charge();
  budget.reset();
  assert.equal(budget.failures, 0);
  assert.equal(budget.exhausted, false);
  assert.equal(budget.tracksTurns, false);
  budget.startTurn();
  assert.equal(budget.charge(), false);
  assert.equal(budget.failures, 1);
});

test("a custom limit is honoured", () => {
  const budget = createGuardBudget(2);
  budget.startTurn();
  assert.equal(budget.charge(), false);
  budget.startTurn();
  assert.equal(budget.charge(), true);
});
