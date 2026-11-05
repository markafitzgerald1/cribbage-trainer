import {
  CRIB_V2_SCHEMA,
  CRIB_V4_METHOD,
} from "../src/game/cribUncertaintyV2.mjs";

const numericTokens = new WeakMap();
const integerToken = /^-?\d+$/u;

// Python keeps integer operands exact, including beyond binary64 precision.
export const artifactNumber = (object, field) => {
  const source = numericTokens.get(object)?.get(field);
  return source && integerToken.test(source) ? BigInt(source) : object?.[field];
};

export const stringifyArtifactJson = (value) => {
  /** @this {object} */
  function preserveToken(key, item) {
    const source = numericTokens.get(this)?.get(key);
    return typeof item === "number" && source ? JSON.rawJSON(source) : item;
  }
  return JSON.stringify(value, preserveToken);
};

// JSON.parse keeps only the last occurrence, so inspect names while the wire
// spelling (including escaped names) is still available.
const assertUniqueNames = (body) => {
  const objects = [];
  const lexemes = body.matchAll(/"(?:[^"\\]|\\.)*"\s*:?|[{}]/gu);
  for (const [lexeme] of lexemes) {
    if (lexeme === "{") {
      objects.push(new Set());
    } else if (lexeme === "}") {
      objects.pop();
    } else if (lexeme.endsWith(":")) {
      const key = JSON.parse(lexeme.slice(0, -1));
      const names = objects.at(-1);
      if (names.has(key)) {
        throw new Error(`Duplicate JSON key: ${key}`);
      }
      names.add(key);
    }
  }
};

export const parseArtifactJson = (body) => {
  /** @this {object} */
  function readToken(key, item, context) {
    if (typeof item === "number") {
      const tokens = numericTokens.get(this) ?? new Map();
      tokens.set(key, context.source);
      numericTokens.set(this, tokens);
    }
    return item;
  }
  assertUniqueNames(body);
  const value = JSON.parse(body, readToken);
  const assertIntegers = (object, fields) => {
    for (const field of fields) {
      const source = numericTokens.get(object)?.get(field);
      if (source && !integerToken.test(source)) {
        throw new Error(`Expected JSON integer lexeme: ${field}`);
      }
    }
  };
  if (value?.schema === CRIB_V2_SCHEMA) {
    assertIntegers(value.provenance, [
      "seed",
      "generation",
      "precut_resolved_positive",
      "precut_resolved_negative",
      "precut_unresolved",
    ]);
    const totals = value.record_groups?.totals;
    assertIntegers(totals, ["record_count"]);
    for (const record of Object.values(totals?.records ?? {})) {
      assertIntegers(record, ["n"]);
    }
  }
  if (
    Reflect.get(value ?? {}, "__metadata__")?.generation_method ===
    CRIB_V4_METHOD
  ) {
    assertIntegers(Reflect.get(value, "__metadata__"), ["seed", "generation"]);
  }
  return value;
};
