const fs = require('fs');

let trainerStory = fs.readFileSync('src/ui-react/Trainer.stories.tsx', 'utf8');

trainerStory = trainerStory.replace(
  '      within(canvasElement).getByRole("columnheader", { name: "Cut" }),',
  '      within(canvasElement).getByRole("columnheader", { name: "15s" }),'
);

fs.writeFileSync('src/ui-react/Trainer.stories.tsx', trainerStory);
