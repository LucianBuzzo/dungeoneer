const DungeonFactory = require('./lib/generator.js');

let dungeon = DungeonFactory.generate({
  width: 21,
  height: 21
});

dungeon.tiles.forEach(column => {
  let columnText = column.map(t => {
    if (t.type === 'wall') {
      return '█';
    }
    if (t.type === 'door') {
      return '+';
    }
    return '.';
  }).join('');

  console.log(columnText);
});


