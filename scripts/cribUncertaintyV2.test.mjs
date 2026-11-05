import {
  CRIB_ASSETS,
  downloadMeansAndUncertainty,
} from "./expectedPointsTableUpdate.mjs";
import {
  CRIB_UNCERTAINTY_CONTRACT,
  assertMeansDigest,
  validateUncertainty,
} from "./uncertaintySidecar.mjs";
import {
  V2_REJECTIONS,
  V2_RELATION,
  V2_ROOT,
  setV2Path,
  v2Document,
} from "../src/game/cribUncertaintyV2.test.common.ts";
import {
  doesNotReject,
  doesNotThrow,
  notEqual,
  rejects,
  strictEqual,
  throws,
} from "node:assert/strict";
import { createHash } from "node:crypto";
import { parseArtifactJson } from "./artifactJson.mjs";
import { readFileSync } from "node:fs";
import { readTableIdentity } from "./expectedTableIdentity.mjs";
import { test } from "node:test";

const contract = CRIB_UNCERTAINTY_CONTRACT;
const fixture = () => v2Document(contract.vocabulary);
const hash = (body) => createHash("sha256").update(body).digest("hex");
const bind = (sidecar, meansBody) => {
  sidecar.means_sha256 = hash(meansBody);
  return sidecar;
};
const pair = () => {
  const sidecar = fixture();
  const means = Object.fromEntries(
    contract.vocabulary.keys.map((key) => [
      key,
      Object.fromEntries(
        contract.vocabulary.roles.map((role) => [
          role,
          Object.fromEntries(
            contract.vocabulary.ranks.map((rank) => [rank, { mu: 0 }]),
          ),
        ]),
      ),
    ]),
  );
  Reflect.set(means, "__metadata__", { ...sidecar.provenance });
  means.A_2_Suited.Dealer.K = {
    mu: 0.0312,
    starter_suit_relation: { matching_discard_suit: { mu: -0.0938 } },
  };
  return { means, sidecar: bind(sidecar, JSON.stringify(means)) };
};
const checkPair = ({ sidecar, means }) => {
  const body = JSON.stringify(means);
  bind(sidecar, body);
  validateUncertainty(sidecar, contract);
  assertMeansDigest(sidecar, body, contract);
};

test("v2 root zero and relation records pass both Node checks", () => {
  const value = pair();
  checkPair(value);
  strictEqual(
    value.sidecar.record_groups.totals.records[V2_ROOT].reported_marginal_se,
    0,
  );
  strictEqual(
    value.sidecar.record_groups.totals.records[V2_RELATION]
      .reported_marginal_se,
    0.125,
  );
});
for (const { name, path, value } of V2_REJECTIONS) {
  test(`Node rejects ${name} independently`, () => {
    const sidecar = fixture();
    setV2Path(sidecar, path, value);
    throws(() => validateUncertainty(sidecar, contract));
  });
}
for (const field of ["seed", "generation"]) {
  test(`client ${field} comparison is independent of the digest`, () => {
    const value = pair();
    Reflect.get(value.means, "__metadata__")[field] += 1;
    throws(() => checkPair(value), /provenance differ/u);
  });
}
for (const seed of [null, -42]) {
  test(`matching seed ${seed} is supported`, () => {
    const value = pair();
    value.sidecar.provenance.seed = seed;
    Reflect.get(value.means, "__metadata__").seed = seed;
    doesNotThrow(() => checkPair(value));
  });
}
test("v2 sidecar refuses v3 means with matching seed and generation", () => {
  const value = pair();
  Reflect.get(value.means, "__metadata__").generation_method =
    "artifact_pipeline.generate_table.v3";
  throws(() => checkPair(value), /versions or provenance differ/u);
});
test("v1 sidecar refuses v4 means and v4 provenance independently", () => {
  const { sidecar, means } = pair();
  sidecar.schema = "expected-points-uncertainty.v1";
  const body = JSON.stringify(means);
  throws(
    () => assertMeansDigest(bind(sidecar, body), body, contract),
    /versions/u,
  );
  sidecar.n_semantics = "sum_weights";
  sidecar.qualifications.play = "play";
  for (const record of Object.values(sidecar.record_groups.totals.records)) {
    record.sum_w2 = 4;
  }
  const compatible = globalThis.structuredClone(sidecar);
  compatible.provenance.generation_method =
    "artifact_pipeline.generate_table.v3";
  validateUncertainty(compatible, contract);
  throws(() => validateUncertainty(sidecar, contract), /requires the v2/u);
});
for (const [mu, rounded] of [
  [0.03125, 0.0312],
  [-0.03125, -0.0312],
  [0.09375, 0.0938],
  [(2 ** 46 - 5) / 32, 2199023255551.8438],
  [500000000000.03125, 500000000000.0312],
  [-500000000000.03125, -500000000000.0312],
  [Number.MAX_VALUE, Number.MAX_VALUE],
]) {
  test(`Python round(${mu}, 4) = ${rounded}`, () => {
    const value = pair();
    value.sidecar.record_groups.totals.records[V2_ROOT].mu = mu;
    value.means.A_2_Suited.Dealer.K.mu = rounded;
    doesNotThrow(() => checkPair(value));
    value.means.A_2_Suited.Dealer.K.mu = -999;
    throws(() => checkPair(value), /mean differs/u);
  });
}

const wirePair = () => {
  const { sidecar, means } = pair();
  return {
    meansBody: JSON.stringify(means),
    sidecarBody: JSON.stringify(sidecar),
  };
};
const checkWire = ({ sidecarBody, meansBody }) => {
  const sidecar = parseArtifactJson(sidecarBody);
  validateUncertainty(sidecar, contract);
  assertMeansDigest(sidecar, meansBody, contract);
};
const replaceChecked = (body, from, to) => {
  const changed = body.replace(from, to);
  notEqual(changed, body);
  return changed;
};
const readWireIdentity = (wire) =>
  readTableIdentity((file) => {
    if (file.pathname.endsWith("expectedCribPointsTable.json")) {
      return wire.meansBody;
    }
    if (file.pathname.endsWith("expectedCribPointsUncertainty.json")) {
      return wire.sidecarBody;
    }
    return readFileSync(file, "utf8");
  });
test("the build identity gate accepts a valid v2 matched pair", () => {
  const wire = wirePair();
  strictEqual(readWireIdentity(wire).crib.means_sha256, hash(wire.meansBody));
});
const downloadWire = (context, wire) => {
  context.mock.method(globalThis, "fetch", (url) =>
    Promise.resolve({
      ok: true,
      text: () =>
        Promise.resolve(url === "means" ? wire.meansBody : wire.sidecarBody),
    }),
  );
  return downloadMeansAndUncertainty(CRIB_ASSETS, "means", "sidecar");
};
const rejectWire = async (context, wire) => {
  throws(() => checkWire(wire));
  throws(() => readWireIdentity(wire));
  await rejects(downloadWire(context, wire));
};

const wireMeans = (client, measured) => {
  const wire = wirePair();
  wire.meansBody = replaceChecked(
    wire.meansBody,
    '"mu":0.0312',
    `"mu":${client}`,
  );
  wire.sidecarBody = replaceChecked(
    JSON.stringify(bind(JSON.parse(wire.sidecarBody), wire.meansBody)),
    '"mu":0.03125',
    `"mu":${measured}`,
  );
  return wire;
};
for (const boundary of ["updater", "on-disk identity gate"]) {
  test(`wire preserves exact large integer means at the ${boundary}`, async (context) => {
    const read = (wire) =>
      Promise.resolve().then(() =>
        boundary === "updater"
          ? downloadWire(context, wire)
          : readWireIdentity(wire),
      );
    await [
      ["9007199254740993", "9007199254740992", "9007199254740993"],
      ["-9007199254740993", "-9007199254740992", "-9007199254740993"],
      ["9007199254740993.0", "9007199254740993", "9007199254740992"],
      ["9007199254740992", "9007199254740994.0", "9007199254740992.0"],
      [`1${"0".repeat(99)}1`, `1${"0".repeat(100)}`, `1${"0".repeat(99)}1`],
    ].reduce(async (previous, [measured, mismatching, matching]) => {
      await previous;
      await rejects(read(wireMeans(mismatching, measured)), /mean differs/u);
      await doesNotReject(async () => {
        const files = await read(wireMeans(matching, measured));
        if (boundary === "updater") {
          readWireIdentity({
            meansBody: files[0].body,
            sidecarBody: files[1].body,
          });
        }
      });
    }, Promise.resolve());
  });
}
for (const [field, integer] of [
  ["n", 4],
  ["seed", 42],
  ["generation", 1],
  ["record_count", 2],
  ["precut_resolved_positive", 0],
  ["precut_resolved_negative", 0],
  ["precut_unresolved", 0],
]) {
  for (const suffix of [".0", "e0", ".0000000000000001"]) {
    test(`wire rejects ${field} spelled ${integer}${suffix} at download and disk boundaries`, async (context) => {
      const wire = wirePair();
      const sidecar = JSON.parse(wire.sidecarBody);
      Object.assign(sidecar.provenance, {
        precut_resolved_negative: 0,
        precut_resolved_positive: 0,
        precut_unresolved: 0,
      });
      wire.sidecarBody = replaceChecked(
        JSON.stringify(sidecar),
        `"${field}":${integer}`,
        `"${field}":${integer}${suffix}`,
      );
      await rejectWire(context, wire);
    });
  }
}
for (const field of ["seed", "generation"]) {
  test(`wire rejects client ${field} float token despite a matching digest`, async (context) => {
    const wire = wirePair();
    const integer = field === "seed" ? 42 : 1;
    wire.meansBody = replaceChecked(
      wire.meansBody,
      `"${field}":${integer}`,
      `"${field}":${integer}.0`,
    );
    wire.sidecarBody = JSON.stringify(
      bind(JSON.parse(wire.sidecarBody), wire.meansBody),
    );
    await rejectWire(context, wire);
  });
}
for (const [from, to] of [
  ['"schema":', '"schema":null,"schema":'],
  [
    '"selection_adjustment":null',
    '"selection_adjustment":0,"selection_adjustment":null',
  ],
  ['"n":4', '"n":1,"n":4'],
  ['"seed":42', '"se\\u0065d":0,"seed":42'],
]) {
  test(`wire rejects duplicate sidecar ${from}`, async (context) => {
    const wire = wirePair();
    wire.sidecarBody = replaceChecked(wire.sidecarBody, from, to);
    await rejectWire(context, wire);
  });
}
test("wire rejects duplicate means metadata seed with a matching digest", async (context) => {
  const wire = wirePair();
  wire.meansBody = replaceChecked(
    wire.meansBody,
    '"seed":42',
    '"seed":0,"seed":42',
  );
  wire.sidecarBody = JSON.stringify(
    bind(JSON.parse(wire.sidecarBody), wire.meansBody),
  );
  await rejectWire(context, wire);
});
test("unknown v1 fields and groups remain permitted; duplicate names there do not", () => {
  const raw =
    '{"schema":"expected-points-uncertainty.v1","future":{"n":4.0},"record_groups":{"categories":[{"a":1}]}}';
  strictEqual(parseArtifactJson(raw).future.n, 4);
  throws(
    () => parseArtifactJson(raw.replace('"a":1', '"a":0,"a":1')),
    /Duplicate/u,
  );
});
