<div align="center">
  <img width="200" height="200" src="https://raw.githubusercontent.com/LucianBuzzo/dungeoneer/master/architecture-blueprint-svgrepo-com.png">
  <br>
  <br>

[![Build Status](https://travis-ci.org/LucianBuzzo/dungeoneer.svg?branch=master)](https://travis-ci.org/LucianBuzzo/dungeoneer)
[![npm version](https://badge.fury.io/js/dungeoneer.svg)](http://badge.fury.io/js/dungeoneer)
[![Dependency Status](https://img.shields.io/david/LucianBuzzo/dungeoneer.svg)](https://david-dm.org/LucianBuzzo/dungeoneer)

  <h1>Dungeoneer</h1>

  <p>
    Procedurally generate beautiful 2d dungeons for your game.
    <br>
    https://lucianbuzzo.github.io/dungeoneer
  </p>
  <br>
  <br>
</div>

This module is a tool for generating random dungeons as a two-dimensional array.
It is largely based on the excellent work of [Bob
Nystrom](https://github.com/munificent) and his game
[Hauberk](http://munificent.github.io/hauberk/), which you can read about [here](http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/).

A demo of this module can be seen here https://lucianbuzzo.github.io/dungeoneer/

## Installation

Install `dungeoneer` by running:

```sh
$ npm install --save dungeoneer
```

## Usage

```js
const dungeoneer = require('dungeoneer')

const dungeon = dungeoneer.build({
  width: 21,
  height: 21
})
```

The `build` method accepts `width` and `height` options that define the size of
the dungeon and will return a dungeon object. The smallest possible size for
a dungeon is 5 x 5. Dungeons are always an odd size due to the way walls and
floors are generated. If you supply even-sized dimensions, they will be rounded
up to the nearest odd number.
The shape of the dungeon object is defined below:

```ts
type Tile = {
  // An object containing the tiles immediately surrounding this tile.
  neighbours: {
    n?: Tile;
    ne?: Tile;
    e?: Tile;
    se?: Tile;
    s?: Tile;
    sw?: Tile;
    w?: Tile;
    nw?: Tile;
  };
  x: number;
  y: number;

  // 'floor' and 'door' are passable terrain and a wall is impassable terrain.
  type: 'wall' | 'floor' | 'door';
}

type Room = {
  height: number;
  width: number;
  x: number;
  y: number;
}

type BuildConstraints = {
  minRooms?: number;
  maxRooms?: number;
  minRoomSize?: number;
  maxRoomSize?: number;
  maxDeadEnds?: number;
}

type Dungeon = {
  rooms: Room[];
  tiles: Array<Tile[]>;
  seed: string | number;
  toJS(): {
    rooms: Room[];
    tiles: Array<Pick<Tile, 'x' | 'y' | 'type'>[]>;
    seed: string | number;
  };
}
```

## Constraints

You can optionally pass a `constraints` object to influence generation output.

```js
const dungeon = dungeoneer.build({
  width: 41,
  height: 41,
  seed: 'my-seed',
  constraints: {
    minRooms: 3,
    maxRooms: 7,
    minRoomSize: 5,
    maxRoomSize: 11,
    maxDeadEnds: 8
  }
})
```

### Constraint reference

- `minRooms` (integer, `>= 1`): minimum number of generated rooms.
- `maxRooms` (integer, `>= 1`): maximum number of generated rooms.
- `minRoomSize` (integer, `>= 1`): lower room size bound.
- `maxRoomSize` (integer, `>= 1`): upper room size bound.
- `maxDeadEnds` (integer, `>= 0`): maximum number of corridor dead ends to keep after pruning.

### Notes and caveats

- Room dimensions are always odd-sized internally to align with maze carving.
- If `minRoomSize` / `maxRoomSize` are even, they are normalized to odd bounds.
- If room targets are infeasible (for example too many rooms for a tiny stage), `build()` throws a `DungeoneerError`.
- If constraints are omitted, generation behavior remains unchanged from legacy defaults.
- `maxDeadEnds: 0` is equivalent to default full dead-end removal.

## Seeding

A dungeon can be seeded using the `seed` option. A dungeon created with a seed
and the same options can be repeatably created. Dungeons always return the seed
they were created with.

```js
const dungeoneer = require('dungeoneer')

const dungeon = dungeoneer.build({
  width: 21,
  height: 21,
  seed: 'foobarbaz'
})
```

## License

The project is licensed under the MIT license.

The icon at the top of this file is provided by
[svgrepo.com](https://www.svgrepo.com/svg/293783/architecture-blueprint) and is
licensed under [Creative Commons BY
4.0](https://creativecommons.org/licenses/by/4.0/).

## Contributing

This project uses Release Please for automated versioning and changelog generation.

Use Conventional Commits where possible (for example `feat:`, `fix:`, `docs:`). To signal a breaking change, use either:

- a `!` after the type/scope, e.g. `feat!: ...`
- or a `BREAKING CHANGE:` footer in the commit body

Releases are automatically created from changes merged into `master`.
