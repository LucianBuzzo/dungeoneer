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

ava.test('.build() should return an 2d array of tiles proportional to the width and height options', (test) => {
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
