const ava = require('ava')
const dungeoneer = require('..')

ava.test('.build() should return an object containing the key "tiles"', (test) => {
  const dungeon = dungeoneer.build({
    width: 21,
    height: 21
  })

  test.true(dungeon.hasOwnProperty('tiles'))
})

ava.test('.build() should return an object containing the key "rooms"', (test) => {
  const dungeon = dungeoneer.build({
    width: 21,
    height: 21
  })

  test.true(dungeon.hasOwnProperty('rooms'))
})

ava.test('.build() should return a 2d array of tiles proportional to the width and height options', (test) => {
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

ava.test('.build() every tile should correctly reference its neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const assert = (x, y) => {
    if (x !== y) {
      throw new Error(`${x} does not equal ${y}`)
    }
  }

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

ava.test('.build() tiles on the north edge should not list a northern neighbour', (test) => {
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

ava.test('.build() tiles on the east edge should not list an eastern neighbour', (test) => {
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

ava.test('.build() tiles on the south edge should not list a southern neighbour', (test) => {
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

ava.test('.build() tiles on the west edge should not list a western neighbour', (test) => {
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

ava.test('.build() the tile on north west corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[0][0]

  test.deepEqual(Object.keys(tile.neighbours), [ 'e', 'se', 's' ])
})

ava.test('.build() the tile on north east corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[width - 1][0]

  test.deepEqual(Object.keys(tile.neighbours), [ 's', 'sw', 'w' ])
})

ava.test('.build() the tile on south west corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[0][height - 1]

  test.deepEqual(Object.keys(tile.neighbours), [ 'n', 'ne', 'e' ])
})

ava.test('.build() the tile on south east corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[width - 1][height - 1]

  test.deepEqual(Object.keys(tile.neighbours), [ 'n', 'w', 'nw' ])
})

ava.test('.build() every floor tile should be connected to a floor or door tile', (test) => {
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

ava.test('.build() every door tile should be connected to at least two floor tiles', (test) => {
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
