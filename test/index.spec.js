const ava = require('ava')
const dungeoneer = require('..')

ava.test('.generate() should return an object containing the key "tiles"', (test) => {
  const dungeon = dungeoneer.generate({
    width: 21,
    height: 21
  })

  test.true(dungeon.hasOwnProperty('tiles'))
})

ava.test('.generate() should return an object containing the key "rooms"', (test) => {
  const dungeon = dungeoneer.generate({
    width: 21,
    height: 21
  })

  test.true(dungeon.hasOwnProperty('rooms'))
})
