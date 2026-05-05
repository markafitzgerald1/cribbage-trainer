const fs = require('fs');

function replaceInFile(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(file, content);
}

replaceInFile('src/game/expectedCutAddedPoints.ts',
  'import { DECK, type Card, INDICES_PER_SUIT } from "./Card";',
  'import { DECK, type Card } from "./Card";'
);
replaceInFile('src/game/expectedCutAddedPoints.ts',
  'import { SUITS_PER_DECK } from "./expectedHandPoints";\n',
  ''
);
replaceInFile('src/game/expectedCutAddedPoints.ts',
  'import { rankCounts } from "./rankCounts";\n',
  ''
);

replaceInFile('src/game/expectedHandPoints.ts',
  'import { rankCounts } from "./rankCounts";\n',
  ''
);
