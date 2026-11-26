import {
  CRIB_V2_SCHEMA,
  CRIB_V4_METHOD,
} from "../src/game/cribUncertaintyV2.mjs";
import { TextDecoder } from "node:util";

const numericTokens = new WeakMap();
const parsedObjects = new WeakSet();
const integerToken = /^-?\d+$/u;

export const assertArtifactJson = (value) => {
  if (!parsedObjects.has(value)) {
    throw new Error("Expected an object produced by parseArtifactJson");
  }
};

export const artifactText = (body) =>
  typeof body === "string"
    ? body
    : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body);

// Python keeps integer operands exact, including beyond binary64 precision.
export const artifactNumber = (object, field) => {
  assertArtifactJson(object);
  const source = numericTokens.get(object)?.get(field);
  return source && integerToken.test(source) ? BigInt(source) : object?.[field];
};

export const stringifyArtifactJson = (value) => {
  assertArtifactJson(value);
  // Contract sidecar keys are not integer-like; unknown fields may reorder.
  // Minified bytes are not an identity: only embedded digests bind artifacts.
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

export const assertIntegerLexemes = (object, fields) => {
  for (const field of fields) {
    const source = numericTokens.get(object)?.get(field);
    if (source && !integerToken.test(source)) {
      throw new Error(`Expected JSON integer lexeme: ${field}`);
    }
  }
};

// One spelling per decimal value: sign, significant digits, power of ten.
const canonicalDecimal = (text) => {
  const [mantissa, exponent = "0"] = text.toLowerCase().split("e");
  const sign = mantissa.startsWith("-") ? "-" : "";
  const [whole, fraction = ""] = mantissa.slice(sign.length).split(".");
  const digits = `${whole}${fraction}`.replace(/^0+/u, "");
  const significant = digits.replace(/0+$/u, "");
  const scale =
    BigInt(exponent) -
    BigInt(fraction.length) +
    BigInt(digits.length - significant.length);
  return significant === "" ? `${sign}0` : `${sign}${significant}e${scale}`;
};

const numberText = (value) => (Object.is(value, -0) ? "-0" : String(value));

/*
 * JSON parsing rounds a token to the nearest double, so `-1e-400` reads as
 * `-0` and `13000.0000000000001` as `13000` with nothing left to show it.
 * The shortest spelling of the parsed double must therefore name the same
 * decimal as the token did; a token that needs more digits lost them.
 */
export const assertExactNumbers = (value) => {
  assertArtifactJson(value);
  for (const [key, item] of Object.entries(value)) {
    const source = numericTokens.get(value)?.get(key);
    if (typeof item === "object" && item !== null) {
      assertExactNumbers(item);
    } else if (
      typeof item === "number" &&
      canonicalDecimal(source) !== canonicalDecimal(numberText(item))
    ) {
      throw new Error(
        `JSON number ${source} does not survive JSON parsing exactly`,
      );
    }
  }
};

export const parseArtifactJson = (input) => {
  const body = artifactText(input);
  /** @this {object} */
  function readToken(key, item, context) {
    if (typeof item === "object" && item !== null) {
      parsedObjects.add(item);
    }
    if (typeof item === "number") {
      const tokens = numericTokens.get(this) ?? new Map();
      tokens.set(key, context.source);
      numericTokens.set(this, tokens);
    }
    return item;
  }
  assertUniqueNames(body);
  const value = JSON.parse(body, readToken);
  if (value?.schema === CRIB_V2_SCHEMA) {
    assertIntegerLexemes(value.provenance, [
      "seed",
      "generation",
      "precut_resolved_positive",
      "precut_resolved_negative",
      "precut_unresolved",
    ]);
    const totals = value.record_groups?.totals;
    assertIntegerLexemes(totals, ["record_count"]);
    for (const record of Object.values(totals?.records ?? {})) {
      assertIntegerLexemes(record, ["n"]);
    }
  }
  if (
    typeof value === "object" &&
    value !== null &&
    Reflect.get(value, "__metadata__")?.generation_method === CRIB_V4_METHOD
  ) {
    assertIntegerLexemes(Reflect.get(value, "__metadata__"), [
      "seed",
      "generation",
    ]);
  }
  return value;
};
