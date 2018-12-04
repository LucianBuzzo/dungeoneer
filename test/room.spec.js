const ava = require('ava')
const Room = require('../lib/room')

ava.test('Room.containsTile() returns false for tiles north of the room', (test) => {
  const room = new Room(0, 0, 10, 10)

  test.false(room.containsTile(0, -1))
})

ava.test('Room.containsTile() returns false for tiles east of the room', (test) => {
  const room = new Room(0, 0, 10, 10)

  test.false(room.containsTile(0, 10))
})

ava.test('Room.containsTile() returns false for tiles south of the room', (test) => {
  const room = new Room(0, 0, 10, 10)

  test.false(room.containsTile(10, 0))
})

ava.test('Room.containsTile() returns false for tiles east of the room', (test) => {
  const room = new Room(0, 0, 10, 10)

  test.false(room.containsTile(-1, 0))
})

ava.test('Room.containsTile() returns true for tiles inside of the room', (test) => {
  const room = new Room(0, 0, 3, 3)

  test.true(room.containsTile(0, 2))
  test.true(room.containsTile(1, 2))
  test.true(room.containsTile(2, 2))

  test.true(room.containsTile(0, 1))
  test.true(room.containsTile(1, 1))
  test.true(room.containsTile(2, 1))

  test.true(room.containsTile(0, 0))
  test.true(room.containsTile(1, 0))
  test.true(room.containsTile(2, 0))
})
