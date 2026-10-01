/**
 * Read-only guard retry budget.
 *
 * The budget is charged at most **once per model round**, not once per tool call. A single
 * assistant message may fire several `wps_run_readonly_code` calls in parallel; charging each of them
 * spends the whole budget on one mistake and aborts the turn before the model has had a
 * chance to fix anything. `startTurn()` is called on every `turn_start` event, so a round
 * in which three parallel calls all violate the guard still costs exactly one charge.
 *
 * If the host never reports turns (`startTurn()` is never called), charging falls back to
 * one-per-call. The guard therefore never silently stops enforcing its budget — the worst
 * case is the old, stricter behaviour.
 */

/** Charges allowed before the session is aborted: one correction round per charge. */
export const GUARD_RETRY_LIMIT = 3;

export type GuardBudget = {
  /** Mark the start of a new model round. Called once per `turn_start` event. */
  startTurn(): void;
  /**
   * Charge a guard failure.
   * Returns true when *this* charge exhausted the budget and the session must be aborted.
   * Returns false when the current round was already charged, or when budget remains.
   */
  charge(): boolean;
  /** True once the budget is spent; further tool calls must be refused. */
  readonly exhausted: boolean;
  /** Charges spent so far. Exposed for reporting and tests. */
  readonly failures: number;
  /** True once any turn was observed, i.e. per-round charging is active. */
  readonly tracksTurns: boolean;
  reset(): void;
};

export function createGuardBudget(limit: number = GUARD_RETRY_LIMIT): GuardBudget {
  let failures = 0;
  let turn = 0;
  let chargedTurn = -1;
  let tracksTurns = false;
  return {
    startTurn() { tracksTurns = true; turn++; },
    charge() {
      if (tracksTurns && chargedTurn === turn) return false;
      chargedTurn = turn;
      failures++;
      return failures >= limit;
    },
    get exhausted() { return failures >= limit; },
    get failures() { return failures; },
    get tracksTurns() { return tracksTurns; },
    reset() { failures = 0; turn = 0; chargedTurn = -1; tracksTurns = false; },
  };
}
