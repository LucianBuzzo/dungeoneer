# dungeon-factory

This module is a tool for generating random dungeons as a two dimensional array.
It is largely based on the excellent work of [Bob
Nystrom](https://github.com/munificent) and his game
[Hauberk](http://munificent.github.io/hauberk/), which you can read about [here](http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/).

## Installation

Install `dungeon-factory` by running:

```sh
$ npm install --save dungeon-factory
```

## Usage

Require in the factory and then call the `generate` method,
using an object containing a `width` and `height` attribute. 
The `width` and `height` attributes determine the size of the dungeon and should
always be odd numbers.

```
const DungeonFactory = require('dungeon-factory');

const dungeon = DungeonFactory.generate({
  width: 21,
  height: 21
});
```

The `generate` method will return a two dimensional array of Tile objects

```
Tile {
  type: 'wall',
  neighbours: [ 
    [Object], [Object], [Object], [Object], [Object] 
  ],
  nesw: { 
    north: [Object], 
    south: [Object], 
    east: [Object], 
    west: [Object] 
  } 
}
```

 - **type** - The tile type, can be one of 'wall', 'floor' or 'door'.
 - **neighbours** - An array containing the tiles immediately surrounding this one.
 - **nesw** - An object containing the tiles immediately north, south, east, and
west of this tile.

## License

The project is licensed under the MIT license.
