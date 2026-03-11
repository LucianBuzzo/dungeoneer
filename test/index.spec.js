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

  test.truthy(dungeon.tiles)
})

ava('.build() should return an object containing the key "rooms"', (test) => {
  const dungeon = dungeoneer.build({
    width: 21,
    height: 21
  })

  test.truthy(dungeon.rooms)
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

    test.falsy(tile.neighbours.n)
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

    test.falsy(tile.neighbours.e)
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

    test.falsy(tile.neighbours.s)
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

    test.falsy(tile.neighbours.w)
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

  test.deepEqual(Object.keys(tile.neighbours), ['e', 'se', 's'])
})

ava('.build() the tile on north east corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[width - 1][0]

  test.deepEqual(Object.keys(tile.neighbours), ['s', 'sw', 'w'])
})

ava('.build() the tile on south west corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[0][height - 1]

  test.deepEqual(Object.keys(tile.neighbours), ['n', 'ne', 'e'])
})

ava('.build() the tile on south east corner should have only three neighbours', (test) => {
  const width = 21
  const height = 21
  const dungeon = dungeoneer.build({
    width,
    height
  })

  const tile = dungeon.tiles[width - 1][height - 1]

  test.deepEqual(Object.keys(tile.neighbours), ['n', 'w', 'nw'])
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

ava('.build() should throw for non-integer width', (test) => {
  const width = 20.5
  const height = 21

  const error = test.throws(() => {
    dungeoneer.build({
      width,
      height
    })
  })

  test.is(error.message, `DungeoneerError: options.width must be an integer, received ${width}`)
})

ava('.build() should throw for non-integer height', (test) => {
  const width = 21
  const height = 20.5

  const error = test.throws(() => {
    dungeoneer.build({
      width,
      height
    })
  })

  test.is(error.message, `DungeoneerError: options.height must be an integer, received ${height}`)
})

ava('.build() should accept valid constraints without changing invocation shape', (test) => {
  const dungeon = dungeoneer.build({
    width: 21,
    height: 21,
    constraints: {
      minRooms: 1,
      maxRooms: 10,
      minRoomSize: 3,
      maxRoomSize: 11,
      maxDeadEnds: 20
    }
  })

  test.truthy(dungeon.tiles)
  test.truthy(dungeon.rooms)
})

ava('.build() should throw for non-integer constraints', (test) => {
  const error = test.throws(() => {
    dungeoneer.build({
      width: 21,
      height: 21,
      constraints: {
        minRooms: 1.5
      }
    })
  })

  test.is(error.message, 'DungeoneerError: options.constraints.minRooms must be an integer, received 1.5')
})

ava('.build() should throw when minRooms is greater than maxRooms', (test) => {
  const error = test.throws(() => {
    dungeoneer.build({
      width: 21,
      height: 21,
      constraints: {
        minRooms: 10,
        maxRooms: 2
      }
    })
  })

  test.is(error.message, 'DungeoneerError: options.constraints.minRooms must be less than or equal to options.constraints.maxRooms')
})

ava('.build() should throw when minRoomSize is greater than maxRoomSize', (test) => {
  const error = test.throws(() => {
    dungeoneer.build({
      width: 21,
      height: 21,
      constraints: {
        minRoomSize: 9,
        maxRoomSize: 5
      }
    })
  })

  test.is(error.message, 'DungeoneerError: options.constraints.minRoomSize must be less than or equal to options.constraints.maxRoomSize')
})

ava('.build() should throw for negative maxDeadEnds', (test) => {
  const error = test.throws(() => {
    dungeoneer.build({
      width: 21,
      height: 21,
      constraints: {
        maxDeadEnds: -1
      }
    })
  })

  test.is(error.message, 'DungeoneerError: options.constraints.maxDeadEnds must be greater than or equal to 0, received -1')
})

ava('.build() should cap room count to maxRooms when provided', (test) => {
  const dungeon = dungeoneer.build({
    width: 51,
    height: 51,
    seed: 'max-rooms-check',
    constraints: {
      maxRooms: 3
    }
  })

  test.true(dungeon.rooms.length <= 3)
})

ava('.build() should honor room size constraints when provided', (test) => {
  const dungeon = dungeoneer.build({
    width: 51,
    height: 51,
    seed: 'room-size-constraints-check',
    constraints: {
      minRoomSize: 5,
      maxRoomSize: 9
    }
  })

  for (const room of dungeon.rooms) {
    test.true(room.width >= 5)
    test.true(room.width <= 9)
    test.true(room.height >= 5)
    test.true(room.height <= 9)
  }
})

ava('.build() should throw when minRooms cannot be satisfied', (test) => {
  const error = test.throws(() => {
    dungeoneer.build({
      width: 11,
      height: 11,
      seed: 'unsatisfied-min-rooms',
      constraints: {
        minRooms: 20,
        maxRooms: 20
      }
    })
  })

  test.true(error.message.startsWith('DungeoneerError: unable to satisfy options.constraints.minRooms=20'))
})

ava('.build() should remain deterministic with constraints and a fixed seed', (test) => {
  const options = {
    width: 31,
    height: 31,
    seed: 'constraints-determinism',
    constraints: {
      minRooms: 3,
      maxRooms: 6,
      minRoomSize: 3,
      maxRoomSize: 9
    }
  }

  const dungeon1 = dungeoneer.build(options)
  const dungeon2 = dungeoneer.build(options)

  test.deepEqual(dungeon1.toJS(), dungeon2.toJS())
})

const countRemovableDeadEnds = (dungeon) => {
  let count = 0

  for (const row of dungeon.tiles) {
    for (const tile of row) {
      if (tile.type === 'wall') {
        continue
      }

      const inRoom = dungeon.rooms.find((room) => room.containsTile(tile.x, tile.y))
      if (inRoom) {
        continue
      }

      const cardinalNeighbours = [tile.neighbours.n, tile.neighbours.e, tile.neighbours.s, tile.neighbours.w]
      const exits = cardinalNeighbours.filter((n) => n && n.type !== 'wall').length

      if (exits <= 1) {
        count++
      }
    }
  }

  return count
}

ava('.build() should constrain dead-end removal to maxDeadEnds when provided', (test) => {
  const constrained = dungeoneer.build({
    width: 41,
    height: 41,
    seed: 'max-deadends-constraint',
    constraints: {
      maxDeadEnds: 8
    }
  })

  test.true(countRemovableDeadEnds(constrained) <= 8)
})

ava('.build() with maxDeadEnds=0 should match default dead-end removal behavior', (test) => {
  const seed = 'max-deadends-zero-equivalence'

  const defaultDungeon = dungeoneer.build({
    width: 31,
    height: 31,
    seed
  })

  const constrainedDungeon = dungeoneer.build({
    width: 31,
    height: 31,
    seed,
    constraints: {
      maxDeadEnds: 0
    }
  })

  test.deepEqual(defaultDungeon.toJS(), constrainedDungeon.toJS())
})

ava('.build() should reject infeasible odd room-size normalization ranges', (test) => {
  const error = test.throws(() => {
    dungeoneer.build({
      width: 21,
      height: 21,
      seed: 'infeasible-size-constraints',
      constraints: {
        minRoomSize: 2,
        maxRoomSize: 2
      }
    })
  })

  test.is(error.message, 'DungeoneerError: room size constraints are infeasible for this stage size (21x21)')
})

ava('.build() should normalize even room size constraints to odd room sizes', (test) => {
  const dungeon = dungeoneer.build({
    width: 51,
    height: 51,
    seed: 'even-room-size-constraints',
    constraints: {
      minRoomSize: 4,
      maxRoomSize: 8
    }
  })

  for (const room of dungeon.rooms) {
    test.true(room.width >= 5)
    test.true(room.width <= 7)
    test.true(room.height >= 5)
    test.true(room.height <= 7)
    test.true(room.width % 2 === 1)
    test.true(room.height % 2 === 1)
  }
})

const deterministicConstraintCases = [
  {
    name: 'min/max rooms only',
    constraints: {
      minRooms: 2,
      maxRooms: 5
    }
  },
  {
    name: 'room size bounds only',
    constraints: {
      minRoomSize: 5,
      maxRoomSize: 9
    }
  },
  {
    name: 'dead-end budget only',
    constraints: {
      maxDeadEnds: 6
    }
  },
  {
    name: 'combined M1 constraints',
    constraints: {
      minRooms: 2,
      maxRooms: 6,
      minRoomSize: 3,
      maxRoomSize: 9,
      maxDeadEnds: 10
    }
  }
]

for (const scenario of deterministicConstraintCases) {
  ava(`.build() should remain deterministic for constraint scenario: ${scenario.name}`, (test) => {
    const options = {
      width: 41,
      height: 41,
      seed: `determinism-${scenario.name}`,
      constraints: scenario.constraints
    }

    const dungeon1 = dungeoneer.build(options)
    const dungeon2 = dungeoneer.build(options)

    test.deepEqual(dungeon1.toJS(), dungeon2.toJS())
  })
}

ava('.build() should throw if a plugin entry is not a function', (test) => {
  const error = test.throws(() => {
    dungeoneer.build({
      width: 21,
      height: 21,
      plugins: [null]
    })
  })

  test.is(error.message, 'DungeoneerError: options.plugins[0] must be a function')
})

ava('.build() should apply plugins in the order they are provided', (test) => {
  const calls = []

  const pluginA = () => {
    calls.push('a')
  }

  const pluginB = () => {
    calls.push('b')
  }

  dungeoneer.build({
    width: 21,
    height: 21,
    seed: 'plugin-order',
    plugins: [pluginA, pluginB]
  })

  test.deepEqual(calls, ['a', 'b'])
})

ava('plugins.addChokePoints() should be deterministic with a fixed seed', (test) => {
  const plugin = dungeoneer.plugins.addChokePoints({
    inverseChance: 5,
    maxCount: 12
  })

  const options = {
    width: 41,
    height: 41,
    seed: 'plugin-determinism',
    plugins: [plugin]
  }

  const dungeon1 = dungeoneer.build(options)
  const dungeon2 = dungeoneer.build(options)

  test.deepEqual(dungeon1.toJS(), dungeon2.toJS())
})

ava('plugins.addChokePoints() should add choke-point doors up to maxCount', (test) => {
  const maxCount = 5

  const withoutPlugin = dungeoneer.build({
    width: 41,
    height: 41,
    seed: 'plugin-chokes-count'
  })

  const withPlugin = dungeoneer.build({
    width: 41,
    height: 41,
    seed: 'plugin-chokes-count',
    plugins: [dungeoneer.plugins.addChokePoints({
      inverseChance: 1,
      maxCount
    })]
  })

  const countDoors = (dungeon) => {
    let count = 0

    for (const row of dungeon.tiles) {
      for (const tile of row) {
        if (tile.type === 'door') {
          count++
        }
      }
    }

    return count
  }

  const doorDelta = countDoors(withPlugin) - countDoors(withoutPlugin)

  test.true(doorDelta >= 0)
  test.true(doorDelta <= maxCount)
})

ava('plugins.addSecrets() should be deterministic with a fixed seed', (test) => {
  const plugin = dungeoneer.plugins.addSecrets({
    inverseChance: 4,
    maxCount: 10
  })

  const options = {
    width: 41,
    height: 41,
    seed: 'plugin-secrets-determinism',
    plugins: [plugin]
  }

  const dungeon1 = dungeoneer.build(options)
  const dungeon2 = dungeoneer.build(options)

  test.deepEqual(dungeon1.toJS(), dungeon2.toJS())
})

ava('plugins.addSecrets() should add secret doors up to maxCount', (test) => {
  const maxCount = 4

  const withoutPlugin = dungeoneer.build({
    width: 41,
    height: 41,
    seed: 'plugin-secrets-count'
  })

  const withPlugin = dungeoneer.build({
    width: 41,
    height: 41,
    seed: 'plugin-secrets-count',
    plugins: [dungeoneer.plugins.addSecrets({
      inverseChance: 1,
      maxCount
    })]
  })

  const countDoors = (dungeon) => {
    let count = 0

    for (const row of dungeon.tiles) {
      for (const tile of row) {
        if (tile.type === 'door') {
          count++
        }
      }
    }

    return count
  }

  const doorDelta = countDoors(withPlugin) - countDoors(withoutPlugin)

  test.true(doorDelta >= 0)
  test.true(doorDelta <= maxCount)
})

ava('plugins.addRegionTags() should deterministically tag passable tiles', (test) => {
  const options = {
    width: 41,
    height: 41,
    seed: 'plugin-region-tags-determinism',
    plugins: [dungeoneer.plugins.addRegionTags()]
  }

  const dungeon1 = dungeoneer.build(options)
  const dungeon2 = dungeoneer.build(options)

  test.deepEqual(dungeon1.toJS(), dungeon2.toJS())
})

ava('plugins.addRegionTags() should assign region tags to passable tiles', (test) => {
  const dungeon = dungeoneer.build({
    width: 41,
    height: 41,
    seed: 'plugin-region-tags-presence',
    plugins: [dungeoneer.plugins.addRegionTags()]
  })

  let passableCount = 0
  let taggedCount = 0

  for (const row of dungeon.tiles) {
    for (const tile of row) {
      if (tile.type === 'wall') {
        continue
      }

      passableCount++

      if (tile.regionId !== undefined && typeof tile.regionTag === 'string') {
        taggedCount++
      }
    }
  }

  test.true(passableCount > 0)
  test.is(taggedCount, passableCount)
})

ava('plugins.addRegionTags() should include corridor flavor categories in tags', (test) => {
  const dungeon = dungeoneer.build({
    width: 51,
    height: 51,
    seed: 'plugin-region-tags-flavors',
    plugins: [dungeoneer.plugins.addRegionTags()]
  })

  const tags = new Set()

  for (const row of dungeon.tiles) {
    for (const tile of row) {
      if (tile.regionTag) {
        tags.add(tile.regionTag)
      }
    }
  }

  const hasCorridorFlavor = Array.from(tags).some((tag) => {
    return tag.includes(':hub') || tag.includes(':branch') || tag.includes(':dead-end-cluster')
  })

  test.true(hasCorridorFlavor)
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

ava('.build() seeded dungeons should be consistent', (test) => {
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

ava('.build() should accept falsy seeds like 0', (test) => {
  const width = 21
  const height = 21
  const dungeon1 = dungeoneer.build({
    width,
    height,
    seed: 0
  })

  const dungeon2 = dungeoneer.build({
    width,
    height,
    seed: 0
  })

  test.deepEqual(dungeon1.toJS(), dungeon2.toJS())
  test.is(dungeon1.seed, 0)
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
