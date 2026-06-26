// ---------------------------------------------------------------------------
// test/item-008.test.ts — Item 008: kill-switch + reconciliacao observavel.
//
// Cobre a logica PURA (sem rede / sem D1) extraida em src/reconciliation.ts:
//   - gate de kill-switch (fail-open de disponibilidade);
//   - classificacao de divergencia agregada (none/warn/error/unknown);
//   - parse de vars (defaults 5m / threshold 3);
//   - calculo da janela [start, end) ISO 8601.
// A regressao de ALLOWED_ORIGINS e coberta pela inalteracao de cors.ts/index.ts
// (gate ORIGIN_FORBIDDEN preexistente; reconfirmado, sem mudanca de assinatura).
//
// Runner: `node --test` (Node 24+, type-stripping nativo). Sem deps externas.
// fora do tsconfig (include = src/**), nao afeta `npm run type-check`.
// ---------------------------------------------------------------------------

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  killSwitchBlocks,
  classifyDivergence,
  parsePositiveInt,
  computeWindow,
  reconciliationKey,
  DEFAULT_RECONCILIATION_WINDOW_MIN,
  DEFAULT_DIVERGENCE_ALERT_THRESHOLD,
} from "../src/reconciliation.ts";

// --- Kill-switch (fail-open de disponibilidade) ---------------------------

test("kill-switch: var ausente NAO bloqueia (fail-open)", () => {
  assert.equal(killSwitchBlocks(undefined), false);
});

test("kill-switch: 'true' NAO bloqueia", () => {
  assert.equal(killSwitchBlocks("true"), false);
});

test("kill-switch: 'false' bloqueia (503 SUBMIT_DISABLED)", () => {
  assert.equal(killSwitchBlocks("false"), true);
});

test("kill-switch: valor vazio/arbitrario explicito bloqueia", () => {
  assert.equal(killSwitchBlocks(""), true);
  assert.equal(killSwitchBlocks("0"), true);
  assert.equal(killSwitchBlocks("disabled"), true);
});

// --- Classificacao de divergencia agregada --------------------------------

test("divergencia 0 -> none (sem alerta)", () => {
  assert.equal(classifyDivergence(0, DEFAULT_DIVERGENCE_ALERT_THRESHOLD), "none");
});

test("divergencia negativa (artefato de borda de janela) -> none", () => {
  assert.equal(classifyDivergence(-1, DEFAULT_DIVERGENCE_ALERT_THRESHOLD), "none");
});

test("0 < divergencia < threshold -> warn", () => {
  assert.equal(classifyDivergence(1, 3), "warn");
  assert.equal(classifyDivergence(2, 3), "warn");
});

test("divergencia >= threshold -> error", () => {
  assert.equal(classifyDivergence(3, 3), "error");
  assert.equal(classifyDivergence(7, 3), "error");
});

test("divergencia unknown -> unknown (NUNCA falso 0)", () => {
  assert.equal(classifyDivergence("unknown", 3), "unknown");
});

// --- Parse de vars (defaults canonicos) -----------------------------------

test("parsePositiveInt aplica fallback para ausente/invalido/<=0", () => {
  assert.equal(parsePositiveInt(undefined, DEFAULT_RECONCILIATION_WINDOW_MIN), 5);
  assert.equal(parsePositiveInt("", 5), 5);
  assert.equal(parsePositiveInt("0", 5), 5);
  assert.equal(parsePositiveInt("-3", 5), 5);
  assert.equal(parsePositiveInt("abc", 5), 5);
});

test("parsePositiveInt respeita valor valido", () => {
  assert.equal(parsePositiveInt("10", 5), 10);
  assert.equal(parsePositiveInt(" 7 ", 5), 7);
});

// --- Janela de reconciliacao ----------------------------------------------

test("computeWindow produz [start, end) de N minutos em ISO 8601 UTC", () => {
  const w = computeWindow(Date.parse("2026-06-26T12:05:00.000Z"), 5);
  assert.equal(w.window, "5m");
  assert.equal(w.window_end, "2026-06-26T12:05:00.000Z");
  assert.equal(w.window_start, "2026-06-26T12:00:00.000Z");
});

// --- Correlacao por Idempotency-Key (espelha sync.ts) ---------------------

test("reconciliationKey casa com o formato do sync.ts", () => {
  assert.equal(reconciliationKey("br", "abc123"), "quote-br-abc123");
});
