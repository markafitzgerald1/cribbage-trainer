const fs = require('fs');

let expectedCutAddedPoints = fs.readFileSync('src/game/expectedCutAddedPoints.ts', 'utf8');

expectedCutAddedPoints = expectedCutAddedPoints.replace(
  '  const countRemaining = rankCounts([...keep, ...discard]).map(\n    (count) => SUITS_PER_DECK - count,\n  );',
  '// countRemaining is not sufficient for a 52 card deck with suits.\n  const deck = DECK.filter(card => ![...keep, ...discard].some(c => c.rank === card.rank && c.suit === card.suit));\n  '
);

expectedCutAddedPoints = expectedCutAddedPoints.replace(
  'import { CARDS, type Card, INDICES_PER_SUIT } from "./Card";',
  'import { DECK, type Card, INDICES_PER_SUIT } from "./Card";'
);

expectedCutAddedPoints = expectedCutAddedPoints.replace(
  '  for (let cut = 0; cut < INDICES_PER_SUIT; cut += 1) {\n    // eslint-disable-next-line security/detect-object-injection\n    const remaining = countRemaining[cut] as number;\n    if (remaining > 0) {\n      // eslint-disable-next-line security/detect-object-injection\n      const cutCard = CARDS[cut] as Card;\n      processCutContributions({\n        accumulator,\n        basePoints,\n        cutCard,\n        keep,\n        remaining,\n      });\n    }\n  }',
  `  // In a 52 card deck, each remaining card is distinct. But we can group by rank+suit or just iterate the remaining deck.
  // Actually, wait, since we grouped by rank before, the CutContribution array size was 13.
  // The UI assumes cutCountsRemaining is size 13.
  const cutCountsRemaining = Array(13).fill(0);
  for (const card of deck) {
    cutCountsRemaining[card.rank]++;
    processCutContributions({
      accumulator,
      basePoints,
      cutCard: card,
      keep,
      remaining: 1,
    });
  }`
);

expectedCutAddedPoints = expectedCutAddedPoints.replace(
  '    cutCountsRemaining: countRemaining,',
  '    cutCountsRemaining,'
);

fs.writeFileSync('src/game/expectedCutAddedPoints.ts', expectedCutAddedPoints);

let expectedHandPoints = fs.readFileSync('src/game/expectedHandPoints.ts', 'utf8');

expectedHandPoints = expectedHandPoints.replace(
  'import { CARDS, type Card, INDICES_PER_SUIT } from "./Card";',
  'import { DECK, type Card, INDICES_PER_SUIT } from "./Card";'
);

expectedHandPoints = expectedHandPoints.replace(
  '  const totalPoints: HandPoints = rankCounts([...keep, ...discard])\n    .map((count: number, rank: number) => {\n      // eslint-disable-next-line security/detect-object-injection\n      const points = handPoints([...keep, CARDS[rank] as Card]);\n      return {\n        fifteens: points.fifteens * (SUITS_PER_DECK - count),\n        flushes: points.flushes * (SUITS_PER_DECK - count),\n        pairs: points.pairs * (SUITS_PER_DECK - count),\n        runs: points.runs * (SUITS_PER_DECK - count),\n        total: points.total * (SUITS_PER_DECK - count),\n      };\n    })',
  `  const deck = DECK.filter(card => ![...keep, ...discard].some(c => c.rank === card.rank && c.suit === card.suit));
  const totalPoints: HandPoints = deck.map(card => {
    const points = handPoints([...keep, card]);
    return {
      fifteens: points.fifteens,
      flushes: points.flushes,
      pairs: points.pairs,
      runs: points.runs,
      total: points.total,
    };
  })`
);

fs.writeFileSync('src/game/expectedHandPoints.ts', expectedHandPoints);
