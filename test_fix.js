const fs = require('fs');

let code = fs.readFileSync('src/game/handPoints.test.ts', 'utf8');

code = code.replace(
  'describe("flushes", () => {',
  `describe("flushes", () => {
    it("more than 5 card hand", () => {
      expect(handPoints(parseCards("2,3,4,5,6,7")).flushes).toBe(0);
    });`
);

fs.writeFileSync('src/game/handPoints.test.ts', code);
