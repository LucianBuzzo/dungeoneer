const ava = require('ava')
const dungeoneer = require('..')
const helpers = require('./helpers')
const foobarbazDungeon = require('./fixtures/dungeon.foobarbaz.json')

const assert = (x, y) => {
  if (x !== y) {
    throw new Error(`${x} does not equal ${y}`)
  }
}

ava('.build() should return an object containing the key "tiles"', (test) => {
  const dungeon = dungeoneer.build({
    width: 21,
    height: 21
  })

  test.true(dungeon.hasOwnProperty('tiles'))
})

ava('.build() should return an object containing the key "rooms"', (test) => {
  const dungeon = dungeoneer.build({
    width: 21,
    height: 21
  })

  test.true(dungeon.hasOwnProperty('rooms'))
})

ava('.build() should return a 2d array of tiles proportional to the width and height options', (test) => {
  const width = 21
  const height = 31

  const dungeon = dungeoneer.build({
    width,
    height
  })

  test.is(dungeon.tiles.length, width)

  for (const column of dungeon.tiles) {
    test.is(column.length, height)
  }
})

ava('.build() every tile should correctly reference its neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const neighbours = dungeon.tiles[x][y].neighbours

      if (neighbours.n) {
        assert(neighbours.n, dungeon.tiles[x][y - 1])
      }

      if (neighbours.ne) {
        test.is(neighbours.ne, dungeon.tiles[x + 1][y - 1])
      }

      if (neighbours.e) {
        test.is(neighbours.e, dungeon.tiles[x + 1][y])
      }

      if (neighbours.se) {
        test.is(neighbours.se, dungeon.tiles[x + 1][y + 1])
      }

      if (neighbours.s) {
        test.is(neighbours.s, dungeon.tiles[x][y + 1])
      }

      if (neighbours.sw) {
        test.is(neighbours.sw, dungeon.tiles[x - 1][y + 1])
      }

      if (neighbours.w) {
        test.is(neighbours.w, dungeon.tiles[x - 1][y])
      }

      if (neighbours.nw) {
        test.is(neighbours.nw, dungeon.tiles[x - 1][y - 1])
      }
    }
  }

  test.pass()
})

ava('.build() tiles on the north edge should not list a northern neighbour', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (let x = 0; x < width; x++) {
    const tile = dungeon.tiles[x][0]

    test.false(tile.neighbours.hasOwnProperty('n'))
  }
})

ava('.build() tiles on the east edge should not list an eastern neighbour', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (let y = 0; y < height; y++) {
    const tile = dungeon.tiles[width - 1][y]

    test.false(tile.neighbours.hasOwnProperty('e'))
  }
})

ava('.build() tiles on the south edge should not list a southern neighbour', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (let x = 0; x < width; x++) {
    const tile = dungeon.tiles[x][height - 1]

    test.false(tile.neighbours.hasOwnProperty('s'))
  }
})

ava('.build() tiles on the west edge should not list a western neighbour', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (let y = 0; y < height; y++) {
    const tile = dungeon.tiles[0][y]

    test.false(tile.neighbours.hasOwnProperty('w'))
  }
})

ava('.build() the tile on north west corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[0][0]

  test.deepEqual(Object.keys(tile.neighbours), [ 'e', 'se', 's' ])
})

ava('.build() the tile on north east corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[width - 1][0]

  test.deepEqual(Object.keys(tile.neighbours), [ 's', 'sw', 'w' ])
})

ava('.build() the tile on south west corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[0][height - 1]

  test.deepEqual(Object.keys(tile.neighbours), [ 'n', 'ne', 'e' ])
})

ava('.build() the tile on south east corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[width - 1][height - 1]

  test.deepEqual(Object.keys(tile.neighbours), [ 'n', 'w', 'nw' ])
})

ava('.build() tiles should contain at least one floor tile', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const floorTiles = []

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const tile = dungeon.tiles[x][y]
      if (tile.type === 'floor') {
        floorTiles.push(tile)
      }
    }
  }

  test.truthy(floorTiles.length)
})

ava('.build() every floor tile should be connected to a floor or door tile', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const tile = dungeon.tiles[x][y]
      if (tile.type === 'floor') {
        const neighbours = dungeon.tiles[x][y].neighbours

        test.truthy(Object.values(neighbours).find((n) => {
          return n.type === 'floor' || n.type === 'door'
        }))
      }
    }
  }
})

ava('.build() every door tile should be connected to at least two floor tiles', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const tile = dungeon.tiles[x][y]
      if (tile.type === 'door') {
        const neighbours = dungeon.tiles[x][y].neighbours

        test.true(Object.values(neighbours).filter((n) => {
          return n.type === 'floor'
        }).length >= 2)
      }
    }
  }
})

ava('.build() every floor and door tile should be accessible', (test) => {
  const width = 15
  const height = 15
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const visited = helpers.walkDungeon(dungeon)

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const tile = dungeon.tiles[x][y]
      if (tile.type === 'door' || tile.type === 'floor') {
        if (!visited[tile.x][tile.y]) {
          throw new Error(`Tile ${x}, ${y} was not visited`)
        }
      }
    }
  }

  test.pass()
})

ava('.build() even numbers for options.width and options.height should be rounded up', (test) => {
  const width = 20
  const height = 20
  const dungeon = dungeoneer.build({
    width,
    height
  })

  test.is(dungeon.tiles.length, width + 1)
  test.is(dungeon.tiles[0].length, height + 1)
})

ava('.build() should throw an error if width is less than 5', (test) => {
  const width = 4
  const height = 20

  const error = test.throws(() => {
    dungeoneer.build({
      width,
      height
    })
  })

  test.is(error.message, `DungeoneerError: options.width must not be less than 5, received ${width}`)
})

ava('.build() should throw an error if height is less than 5', (test) => {
  const width = 20
  const height = 4

  const error = test.throws(() => {
    dungeoneer.build({
      width,
      height
    })
  })

  test.is(error.message, `DungeoneerError: options.height must not be less than 5, received ${height}`)
})

ava('.build() every room should have numerical height, width, x, and y properties', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (const room of dungeon.rooms) {
    test.is(typeof room.height, 'number')
    test.is(typeof room.width, 'number')
    test.is(typeof room.x, 'number')
    test.is(typeof room.y, 'number')
  }
})

ava('.build() every room should fall within the bounds of the declared height and width', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (const room of dungeon.rooms) {
    test.true(room.width + room.x <= width)
    test.true(room.height + room.y <= height)
  }
})

ava('.build() every room should be surrounded by either wall or door tiles', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tiles = []

  for (const room of dungeon.rooms) {
    const north = room.y - 1
    const east = room.x + room.width
    const south = room.y + room.height
    const west = room.x - 1

    for (let x = west; x < east + 1; x++) {
      if (dungeon.tiles[x]) {
        if (dungeon.tiles[x][north]) {
          tiles.push(dungeon.tiles[x][north])
        }

        if (dungeon.tiles[x][south]) {
          tiles.push(dungeon.tiles[x][south])
        }
      }
    }

    for (let y = north + 1; y < south; y++) {
      if (dungeon.tiles[west]) {
        tiles.push(dungeon.tiles[west][y])
      }

      if (dungeon.tiles[east]) {
        tiles.push(dungeon.tiles[east][y])
      }
    }
  }

  for (const tile of tiles) {
    test.true(tile.type === 'wall' || tile.type === 'door')
  }
})

ava('.build() every room should have at least one adjacent door tile', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (const room of dungeon.rooms) {
    const tiles = []

    const north = room.y - 1
    const east = room.x + room.width
    const south = room.y + room.height
    const west = room.x - 1

    for (let x = west; x < east + 1; x++) {
      if (dungeon.tiles[x]) {
        if (dungeon.tiles[x][north]) {
          tiles.push(dungeon.tiles[x][north])
        }

        if (dungeon.tiles[x][south]) {
          tiles.push(dungeon.tiles[x][south])
        }
      }
    }

    for (let y = north + 1; y < south; y++) {
      if (dungeon.tiles[west]) {
        tiles.push(dungeon.tiles[west][y])
      }

      if (dungeon.tiles[east]) {
        tiles.push(dungeon.tiles[east][y])
      }
    }

    test.truthy(tiles.find((tile) => {
      return tile.type === 'door'
    }))
  }
})

ava('.build() every room should be made up of an area of floor tiles', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  for (const room of dungeon.rooms) {
    for (let x = room.x; x < room.x + room.width; x++) {
      for (let y = room.y; y < room.y + room.height; y++) {
        const tile = dungeon.tiles[x][y]
        assert(tile.type, 'floor')
      }
    }
  }

  test.pass()
})

ava('.build() should return a re-usable seed', (test) => {
  const width = 21
  const height = 21
  const dungeon1 = dungeoneer.build({
    width,
    height
  })

  const dungeon2 = dungeoneer.build({
    width,
    height,
    seed: dungeon1.seed
  })

  test.deepEqual(dungeon1.toJS(), dungeon2.toJS())
})

ava('.build() seeded dungeons should be consisten', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height,
    seed: 'foobarbaz'
  })

  test.deepEqual(dungeon.toJS(), foobarbazDungeon)
})

ava('.build() should be seedable', (test) => {
  const width = 21
  const height = 21
  const dungeon1 = dungeoneer.build({
    width,
    height,
    seed: 'foobarbaz'
  })

  const dungeon2 = dungeoneer.build({
    width,
    height,
    seed: 'foobarbaz'
  })

  test.deepEqual(dungeon1.toJS(), dungeon2.toJS())
})

const sizes = [
  [5, 7],
  [7, 7],
  [21, 21],
  [51, 51],
  [101, 101]
]

for (const [width, height] of sizes) {
  ava(`.build() Should reliably create ${width} x ${height} dungeons`, (test) => {
    let count = 10

    while (count--) {
      dungeoneer.build({
        width,
        height
      })
    }

    test.pass()
  })
}
