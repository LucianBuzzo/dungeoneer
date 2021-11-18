const ava = require('ava')
const Room = require('../lib/room')

ava('Room objects should contain an x property', (test) => {
  test.is(new Room(2, 2, 10, 10).x, 2)
})

ava('Room objects should contain an y property', (test) => {
  test.is(new Room(2, 2, 10, 10).x, 2)
})

ava('Room objects should contain a width property', (test) => {
  test.is(new Room(2, 2, 10, 10).width, 10)
})

ava('Room objects should contain a height property', (test) => {
  test.is(new Room(2, 2, 10, 10).height, 10)
})

ava('Room.containsTile() returns false for tiles north of the room', (test) => {
  const room = new Room(0, 0, 10, 10)

  test.false(room.containsTile(0, -1))
})

ava('Room.containsTile() returns false for tiles east of the room', (test) => {
  const room = new Room(0, 0, 10, 10)

  test.false(room.containsTile(11, 0))
})

ava('Room.containsTile() returns false for tiles south of the room', (test) => {
  const room = new Room(0, 0, 10, 10)

  test.false(room.containsTile(0, 11))
})

ava('Room.containsTile() returns false for tiles west of the room', (test) => {
  const room = new Room(0, 0, 10, 10)

  test.false(room.containsTile(-1, 0))
})

ava('Room.containsTile() returns true for tiles inside of the room', (test) => {
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

ava('Room.intersects() Should throw if the object has no getBoundingBox method', (test) => {
  test.throws(() => {
    new Room(0, 0, 3, 3).intersects({ foo: 'bar' })
  })
})

ava('Room.intersects() returns false for rooms north of the room', (test) => {
  const room1 = new Room(0, 10, 10, 10)
  const room2 = new Room(0, 0, 10, 10)

  test.false(room1.intersects(room2))
})

ava('Room.intersects() returns false for rooms east of the room', (test) => {
  const room1 = new Room(0, 0, 10, 10)
  const room2 = new Room(10, 0, 10, 10)

  test.false(room1.intersects(room2))
})

ava('Room.intersects() returns false for rooms south of the room', (test) => {
  const room1 = new Room(0, 0, 10, 10)
  const room2 = new Room(0, 10, 10, 10)

  test.false(room1.intersects(room2))
})

ava('Room.intersects() returns false for rooms west of the room', (test) => {
  const room1 = new Room(10, 0, 10, 10)
  const room2 = new Room(0, 0, 10, 10)

  test.false(room1.intersects(room2))
})

ava('Room.intersects() returns true for rooms that intersect', (test) => {
  const room = new Room(10, 10, 10, 10)

  test.true(room.intersects(new Room(1, 1, 10, 10)))
  test.true(room.intersects(new Room(9, 9, 10, 10)))
  test.true(room.intersects(new Room(10, 10, 10, 10)))
  test.true(room.intersects(new Room(19, 19, 10, 10)))
})

ava('Room.getBoundingBox() returns the correct bounding box', (test) => {
  test.deepEqual(new Room(0, 0, 10, 10).getBoundingBox(), {
    top: 0,
    right: 9,
    bottom: 9,
    left: 0
  })

  test.deepEqual(new Room(3, 3, 3, 3).getBoundingBox(), {
    top: 3,
    right: 5,
    bottom: 5,
    left: 3
  })
})

ava('Room.toJS() should return a POJO', (test) => {
  test.deepEqual(new Room(0, 0, 10, 10).toJS(), {
    x: 0,
    y: 0,
    width: 10,
    height: 10
  })
})
