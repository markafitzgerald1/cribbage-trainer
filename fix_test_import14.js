const fs = require('fs');
let code = fs.readFileSync('src/game/expectedHandPoints.test.ts', 'utf8');

code = code.replace(
  'const remainingCards = 46;\n      const hasFlush = keep.length === 4 && keep.every(c => c.suit === keep[0]!.suit);\n      const flushAddedPoints = hasFlush ? (13 - 6) * 1 : 0;\n      const nobsPoints = keep.some(c => c.rankLabel === "J") ? (13 - 6) : 0;\n      \n      expect(expectedHandPoints(keep, discard).total).toBe(\n        preStarterPoints + expectedStartersAddedPoints + (flushAddedPoints + nobsPoints) / remainingCards,\n      );',
  'expect(expectedHandPoints(keep, discard).total).toBeCloseTo(\n        preStarterPoints + expectedStartersAddedPoints, 12\n      );'
);

// We need to completely delete the manual flush points logic from expectedHandPoints.test.ts because expectedHandPoints uses the SAME handPoints calculation that already evaluates flushes properly across the full 52 card deck minus keep/discard. Wait, NO.
// The test builds combinations where expectedStartersAddedPoints explicitly specifies what is gained for pairs, fifteens, etc but leaves OUT flushes and nobs.
// In our implementation expectedHandPoints iterates over all remaining 46 cards.
// If the keep/discard have alternating suits, there are no flushes to score.
// Let's check `parseCards`. I set `parseCards` to alternate suits.
// So `keep` and `discard` have alternating suits, meaning `hasFlush` is false!
// If `hasFlush` is false, flushAddedPoints is 0!
// So what about `nobsPoints`?
// If `keep` has a Jack, it has a specific suit. There are 13 Spades, etc.
// But we altered `expectedHandPoints.ts` to iterate the full 52-card deck.
// So `expectedHandPoints` returns the EXACT value including Nobs and Flushes.

// We will calculate nobs added mathematically to match what `expectedHandPoints` outputs.
fs.writeFileSync('src/game/expectedHandPoints.test.ts', code);

code = fs.readFileSync('src/game/expectedHandPoints.test.ts', 'utf8');
code = code.replace(
  'expect(expectedHandPoints(keep, discard).total).toBeCloseTo(\n        preStarterPoints + expectedStartersAddedPoints, 12\n      );',
  `const jackCards = keep.filter(c => c.rankLabel === "J");
      let totalNobsAdded = 0;
      for (const jack of jackCards) {
         // for each jack, how many cards of its suit are left in deck?
         // deck size is 52. 13 of that suit originally.
         // count how many of that suit are in keep/discard.
         const suitCountInDealt = dealtCards.filter(c => c.suit === jack.suit).length;
         totalNobsAdded += (13 - suitCountInDealt) * 1;
      }

      const hasFlush = keep.length === 4 && keep.every(c => c.suit === keep[0]!.suit);
      let totalFlushAdded = 0;
      if (hasFlush) {
         const flushSuit = keep[0]!.suit;
         const suitCountInDealt = dealtCards.filter(c => c.suit === flushSuit).length;
         totalFlushAdded += (13 - suitCountInDealt) * 1;
      }

      const remainingCards = 46;
      expect(expectedHandPoints(keep, discard).total).toBeCloseTo(
        preStarterPoints + expectedStartersAddedPoints + (totalNobsAdded + totalFlushAdded) / remainingCards, 12
      );`
);
fs.writeFileSync('src/game/expectedHandPoints.test.ts', code);
