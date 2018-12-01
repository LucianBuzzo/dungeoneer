/**
 * Based on Bob Nystrom's procedural dungeon generation logic that he wrote for Hauberk
 * http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
 */

'use strict'

const Victor = require('victor')
const _ = require('underscore')

const Room = require('./room')
const Tile = require('./tile')

const getTileNESW = (tile) => {
  const tiles = []
  if (tile.neighbours.n) {
    tiles.push(tile.neighbours.n)
  }
  if (tile.neighbours.e) {
    tiles.push(tile.neighbours.e)
  }
  if (tile.neighbours.s) {
    tiles.push(tile.neighbours.s)
  }
  if (tile.neighbours.w) {
    tiles.push(tile.neighbours.w)
  }

  return tiles
}

/**
 * @desc The random dungeon generator.
 *
 * Starting with a stage of solid walls, it works like so:
 *
 * 1. Place a number of randomly sized and positioned rooms. If a room
 *    overlaps an existing room, it is discarded. Any remaining rooms are
 *    carved out.
 * 2. Any remaining solid areas are filled in with mazes. The maze generator
 *    will grow and fill in even odd-shaped areas, but will not touch any
 *    rooms.
 * 3. The result of the previous two steps is a series of unconnected rooms
 *    and mazes. We walk the stage and find every tile that can be a
 *    "connector". This is a solid tile that is adjacent to two unconnected
 *    regions.
 * 4. We randomly choose connectors and open them or place a door there until
 *    all of the unconnected regions have been joined. There is also a slight
 *    chance to carve a connector between two already-joined regions, so that
 *    the dungeon isn't single connected.
 * 5. The mazes will have a lot of dead ends. Finally, we remove those by
 *    repeatedly filling in any open tile that's closed on three sides. When
 *    this is done, every corridor in a maze actually leads somewhere.
 *
 * The end result of this is a multiply-connected dungeon with rooms and lots
 * of winding corridors.
 *
 * @constructor
 */
const Dungeon = function Dungeon () {
  var numRoomTries = 50

  // The inverse chance of adding a connector between two regions that have
  // already been joined. Increasing this leads to more loosely connected
  // dungeons.
  var extraConnectorChance = 50

  // Increasing this allows rooms to be larger.
  var roomExtraSize = 0

  var windingPercent = 50

  var _rooms = []

  // The index of the current region being carved.
  var _currentRegion = -1

  var stage

  const n = new Victor(0, 1)
  const e = new Victor(1, 0)
  const s = new Victor(0, -1)
  const w = new Victor(-1, 0)

  // The four cardinal directions: north, south, east, and west.
  const cardinalDirections = [n, e, s, w]

  const bindStage = (givenStage) => {
    stage = givenStage
  }

  let _tiles = []

  /**
   * @desc returns a tile at the provided coordinates
   *
   * @param {Number} x - The x coordinate to retrieve
   * @param {Number} y - The y coordinate to retrieve
   *
   * @returns {Object} - A Tile object
   */
  const getTile = (x, y) => {
    return _tiles[x][y]
  }

  /**
   * @desc Sets a tile's type and region. This function will thrown an error if
   * the tile doesn't exist.
   *
   * @param {Number} x - The x coordinate of the tile to set
   * @param {Number} y - The y coordinate of the tile to set
   * @param {String} type - The type to set on the tile
   *
   * @returns {Object} - The Tile object or null if the tile was not found
   *
   */
  const setTile = (x, y, type) => {
    if (_tiles[x] && _tiles[x][y]) {
      _tiles[x][y].type = type
      _tiles[x][y].region = _currentRegion

      return _tiles[x][y]
    }

    throw new RangeError(`tile at ${x}, ${y} is unreachable`)
  }

  /**
   * @desc Generates tile data to the dimension of the stage.
   *
   * @param {String} type - The tile type to set on newly created tiles
   *
   * @returns {Array} - The _tiles array
   */
  const fill = (type) => {
    let neighbours = {}
    var x
    var y

    for (x = 0; x < stage.width; x++) {
      _tiles.push([])
      for (y = 0; y < stage.height; y++) {
        _tiles[x].push(new Tile(type))
      }
    }

    for (x = 0; x < stage.width; x++) {
      for (y = 0; y < stage.height; y++) {
        neighbours = {}
        if (_tiles[x][y - 1]) {
          neighbours.n = _tiles[x][y - 1]
        }
        if (_tiles[x + 1] && _tiles[x + 1][y - 1]) {
          neighbours.ne = _tiles[x + 1][y - 1]
        }
        if (_tiles[x + 1] && _tiles[x + 1][y]) {
          neighbours.e = _tiles[x + 1][y]
        }
        if (_tiles[x + 1] && _tiles[x + 1][y + 1]) {
          neighbours.se = _tiles[x + 1][y + 1]
        }
        if (_tiles[x] && _tiles[x][y + 1]) {
          neighbours.s = _tiles[x][y + 1]
        }
        if (_tiles[x - 1] && _tiles[x - 1][y + 1]) {
          neighbours.sw = _tiles[x - 1][y + 1]
        }
        if (_tiles[x - 1] && _tiles[x - 1][y]) {
          neighbours.w = _tiles[x - 1][y]
        }
        if (_tiles[x - 1] && _tiles[x - 1][y - 1]) {
          neighbours.nw = _tiles[x - 1][y - 1]
        }
        _tiles[x][y].setNeighbours(neighbours)
      }
    }

    return _tiles
  }

  /**
   * @desc Master function for generating a dungeon
   *
   * @param {Object} stage - An object with a width key and a height key. Used
   * to determine the size of the dungeon. Must be odd with and height.
   * @param {Boolean} debug - outputs debug info if set to true
   *
   * @returns {Object} - Tile information for the dungeon
   */
  const generate = (stage, debug = false) => {
    let startDate = Date.now()
    if (stage.width % 2 === 0 || stage.height % 2 === 0) {
      throw new Error('The stage must be odd-sized.')
    }

    bindStage(stage)

    fill('wall')

    _addRooms()

    // Fill in all of the empty space with mazes.
    for (var y = 1; y < stage.height; y += 2) {
      for (var x = 1; x < stage.width; x += 2) {
        // Skip the maze generation if the tile is already carved
        if (getTile(x, y).type === 'floor') {
          continue
        }
        _growMaze(x, y)
      }
    }

    _connectRegions()

    _removeDeadEnds()

    let endDate = Date.now()

    if (debug) {
      console.log('Dungeon generated in ' + (endDate - startDate) + 'ms')
    }

    return {
      rooms: _rooms,
      tiles: _tiles
    }
  }

  /**
   * @desc Implementation of the "growing tree" algorithm from here:
   * http://www.astrolog.org/labyrnth/algrithm.htm.
   *
   * @param {Number} startX - The x coordinate to start at
   * @param {Number} startY - The y coordinate to start at
   *
   * @returns {void}
   */
  const _growMaze = (startX, startY) => {
    var cells = []
    var lastDir

    if (Object.keys(_tiles[startX][startY].neighbours).filter(x => x.type === 'floor').length > 0) {
      return
    }

    _startRegion()

    _carve(startX, startY)

    cells.push(new Victor(startX, startY))

    let count = 0

    while (cells.length && count < 500) {
      count++
      var cell = cells[cells.length - 1]

      // See which adjacent cells are open.
      var unmadeCells = []

      for (let dir of cardinalDirections) {
        if (_canCarve(cell, dir)) {
          unmadeCells.push(dir)
        }
      }

      if (unmadeCells.length) {
        // Based on how "windy" passages are, try to prefer carving in the
        // same direction.
        var dir
        var stringifiedCells = unmadeCells.map(v => v.toString())
        if (lastDir && stringifiedCells.indexOf(lastDir.toString()) > -1 && _.random(1, 100) > windingPercent) {
          dir = lastDir.clone()
        } else {
          let rand = _.random(0, unmadeCells.length - 1)
          dir = unmadeCells[rand].clone()
        }

        let carveLoc1 = cell.clone().add(dir).toObject()
        _carve(carveLoc1.x, carveLoc1.y)

        let carveLoc2 = cell.clone().add(dir).add(dir).toObject()
        _carve(carveLoc2.x, carveLoc2.y)

        cells.push(cell.clone().add(dir).add(dir))

        lastDir = dir.clone()
      } else {
        // No adjacent uncarved cells.
        cells.pop()

        // This path has ended.
        lastDir = null
      }
    }
  }

  /**
   * @desc Creates rooms in the dungeon by repeatedly creating random rooms and
   * seeing if they overlap. Rooms that overlap are discarded. This process is
   * repeated until it hits the maximum tries determined by the 'numRoomTries'
   * variable.
   *
   * @returns {void}
   */
  const _addRooms = () => {
    for (var i = 0; i < numRoomTries; i++) {
      // Pick a random room size. The funny math here does two things:
      // - It makes sure rooms are odd-sized to line up with maze.
      // - It avoids creating rooms that are too rectangular: too tall and
      //   narrow or too wide and flat.
      var size = _.random(1, 3 + roomExtraSize) * 2 + 1
      var rectangularity = _.random(0, 1 + Math.floor(size / 2)) * 2
      var width = size
      var height = size
      if (_oneIn(2)) {
        width += rectangularity
      } else {
        height += rectangularity
      }

      var x = _.random(0, Math.floor((stage.width - width) / 2)) * 2 + 1
      var y = _.random(0, Math.floor((stage.height - height) / 2)) * 2 + 1

      if (x > stage.width - width) {
        x = stage.width - width - 1
      }

      if (y > stage.height - height) {
        y = stage.height - height - 1
      }

      var room = new Room(x, y, width, height)

      var overlaps = false

      for (var other of _rooms) {
        if (room.intersects(other)) {
          overlaps = true
          break
        }
      }

      if (overlaps) {
        continue
      }

      _rooms.push(room)

      _startRegion()

      // Convert room tiles to floor
      carveArea(x, y, width, height)
    }
  }

  /**
   * @desc converts an area of tiles to floor type
   *
   * @param {Number} x - The starting x coordinate
   * @param {Number} y - The starting y coordinate
   * @param {Number} width - The width of the area to carve
   * @param {Number} height - The height of the area to carve
   *
   * @returns {void}
   */
  const carveArea = (x, y, width, height) => {
    for (var i = x; i < x + width; i++) {
      for (var j = y; j < y + height; j++) {
        _carve(i, j)
      }
    }
  }

  /**
   * @desc Creates doorways between each generated region of tiles
   *
   * @return {void}
   */
  const _connectRegions = () => {
    let regionConnections = {}
    _tiles.forEach(row => {
      row.forEach(tile => {
        if (tile.type === 'floor') {
          return
        }

        let tileRegions = _.unique(
          getTileNESW(tile).map(x => x.region)
            .filter(x => !_.isUndefined(x))
        )
        if (tileRegions.length <= 1) {
          return
        }

        let key = tileRegions.join('-')
        if (!regionConnections[key]) {
          regionConnections[key] = []
        }
        regionConnections[key].push(tile)
      })
    })

    _.each(regionConnections, (connections) => {
      let index = _.random(0, connections.length - 1)
      connections[index].type = 'door'
      connections.splice(index, 1)

      // Occasional open up additional connections
      connections.forEach(conn => {
        if (_oneIn(extraConnectorChance)) {
          conn.type = 'door'
        }
      })
    })
  }

  /**
   * @desc Helper function for calculating random chance. The higher the number
   * provided the less likely this value is to return true.
   *
   * @param {Number} num - The ceiling number that could be calculated
   *
   * @returns {Boolean} - True if the function rolled a one
   *
   * @example
   * _oneIn(50); // - Has a 1 in 50 chance of returning true
   */
  const _oneIn = (num) => {
    return _.random(1, num) === 1
  }

  /**
   * @desc Fills in dead ends in the dungeon with wall tiles
   *
   * @returns {void}
   */
  const _removeDeadEnds = () => {
    var done = false

    const cycle = () => {
      let done = true
      _tiles.forEach((row) => {
        row.forEach((tile) => {
          // If it only has one exit, it's a dead end --> fill it in!
          if (tile.type === 'wall') {
            return
          }
          if (getTileNESW(tile).filter(t => t.type !== 'wall').length <= 1) {
            tile.type = 'wall'
            done = false
          }
        })
      })

      return done
    }

    while (!done) {
      done = true
      done = cycle()
    }
  }

  /**
   * @desc Gets whether or not an opening can be carved from the given starting
   * [Cell] at [pos] to the adjacent Cell facing [direction]. Returns `true`
   * if the starting Cell is in bounds and the destination Cell is filled
   * (or out of bounds).</returns>
   *
   * @param {Victor} cell - Victor JS vector object
   * @param {Victor} direction - Victor JS vector object indicating direction
   *
   * @return {Boolean} - true if the path can be carved
   */
  const _canCarve = (cell, direction) => {
    // Must end in bounds.
    let end = cell.clone().add(direction).add(direction).add(direction).toObject()

    if (!_tiles[end.x] || !_tiles[end.x][end.y]) {
      return false
    }

    if (getTile(end.x, end.y).type !== 'wall') {
      return false
    }

    // Destination must not be open.
    let dest = cell.clone().add(direction).add(direction).toObject()
    return getTile(dest.x, dest.y).type !== 'floor'
  }

  /**
   * @desc Increments the current region. Typically called every time a new area
   * starts being carved
   *
   * @returns {Number} - The current region number
   */
  const _startRegion = () => {
    _currentRegion++
    return _currentRegion
  }

  /**
   * @desc Changes the Tile at a given coordinate to a provided type. Typically
   * used to change the type to 'floor'
   *
   * @param {Number} x - The x coordinate to change
   * @param {Number} y - The y coordinate to change
   * @param {String} type - The type to change the tile to. Defaults to 'floor'
   *
   * @returns {void}
   */
  const _carve = (x, y, type = 'floor') => {
    setTile(x, y, type)
  }

  return {
    generate
  }
}

const generate = (options) => {
  return new Dungeon().generate(options)
}

module.exports = {
  generate
}
