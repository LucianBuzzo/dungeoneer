/**
 * Based on Bob Nystrom's procedural dungeon generation logic that he wrote for Hauberk
 * http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
 */

'use strict'

import * as Chance from 'chance'
import * as Victor from 'victor'
import * as _ from 'underscore'

import Room from './room'
import Tile from './tile'

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

const nameChance = new Chance()

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
 *    all unconnected regions have been joined. There is also a slight
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
  const numRoomTries = 50

  // The inverse chance of adding a connector between two regions that have
  // already been joined. Increasing this leads to more loosely connected
  // dungeons.
  const extraConnectorChance = 50

  // Increasing this allows rooms to be larger.
  const roomExtraSize = 0

  const windingPercent = 50

  const _rooms = []

  // The index of the current region being carved.
  let _currentRegion = -1

  let stage
  let rng

  const n = new Victor(0, 1)
  const e = new Victor(1, 0)
  const s = new Victor(0, -1)
  const w = new Victor(-1, 0)

  // The four cardinal directions: north, south, east, and west.
  const cardinalDirections = [n, e, s, w]

  const bindStage = (givenStage) => {
    stage = givenStage
  }

  const _tiles = []
  let _seed

  const randBetween = (min, max) => {
    return rng.integer({ min, max })
  }

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
    let x
    let y

    for (x = 0; x < stage.width; x++) {
      _tiles.push([])
      for (y = 0; y < stage.height; y++) {
        _tiles[x].push(new Tile(type, x, y))
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
   *
   * @returns {Object} - Tile information for the dungeon
   */
  const build = (stage) => {
    // override width & height if level is provided
    if (stage.level != null && stage.level > 0) {
      stage.width = (16 + ((stage.level - 1) * 4)) * 2
      stage.height = (16 + ((stage.level - 1) * 4)) * 2
    }

    if (!stage.width || !stage.height) {
      throw new RangeError('DungeoneerError: either specify a level or specify both width & height')
    }

    if (stage.width < 5) {
      throw new RangeError(`DungeoneerError: options.width must not be less than 5, received ${stage.width}`)
    }

    if (stage.height < 5) {
      throw new RangeError(`DungeoneerError: options.height must not be less than 5, received ${stage.height}`)
    }

    if (stage.width % 2 === 0) {
      stage.width += 1
    }

    if (stage.height % 2 === 0) {
      stage.height += 1
    }

    const seed = stage.seed || `${nameChance.word({ length: 7 })}-${nameChance.word({ length: 7 })}`

    rng = new Chance(seed)

    _seed = seed

    bindStage(stage)

    fill('wall')

    _addRooms()

    // Fill in all of the empty space with mazes.
    for (let y = 1; y < stage.height; y += 2) {
      for (let x = 1; x < stage.width; x += 2) {
        // Skip the maze generation if the tile is already carved
        if (getTile(x, y).type === 'floor') {
          continue
        }
        _growMaze(x, y)
      }
    }

    _connectRegions()

    _lootifyDeadEnds()

    return {
      rooms: _rooms,
      tiles: _tiles,
      seed,
      toJS: _toJS
    }
  }

  const _toJS = () => {
    const rooms = []
    const tiles = []

    for (const room of _rooms) {
      rooms.push(room.toJS())
    }

    for (let x = 0; x < _tiles.length; x++) {
      if (!tiles[x]) {
        tiles.push([])
      }
      for (let y = 0; y < _tiles[x].length; y++) {
        const tile = _tiles[x][y]
        tiles[x].push(tile.toJS())
      }
    }

    return {
      tiles,
      rooms,
      seed: _seed
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
    const cells = []
    let lastDir

    if (Object.keys(_tiles[startX][startY].neighbours).filter(x => x.type === 'floor').length > 0) {
      return
    }

    _startRegion()

    _carve(startX, startY)

    cells.push(new Victor(startX, startY))

    let count = 0

    while (cells.length && count < 500) {
      count++
      const cell = cells[cells.length - 1]

      // See which adjacent cells are open.
      const unmadeCells = []

      for (const dir of cardinalDirections) {
        if (_canCarve(cell, dir)) {
          unmadeCells.push(dir)
        }
      }

      if (unmadeCells.length) {
        // Based on how "windy" passages are, try to prefer carving in the
        // same direction.
        let dir
        const stringifiedCells = unmadeCells.map(v => v.toString())
        if (lastDir && stringifiedCells.indexOf(lastDir.toString()) > -1 && randBetween(1, 100) > windingPercent) {
          dir = lastDir.clone()
        } else {
          const rand = randBetween(0, unmadeCells.length - 1)
          dir = unmadeCells[rand].clone()
        }

        const carveLoc1 = cell.clone().add(dir).toObject()
        _carve(carveLoc1.x, carveLoc1.y)

        const carveLoc2 = cell.clone().add(dir).add(dir).toObject()
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
    const maxNumberOfRooms = stage.height * 0.4
    for (let i = 0; i < numRoomTries && _rooms.length < maxNumberOfRooms; i++) {
      // Pick a random room size. The funny math here does two things:
      // - It makes sure rooms are odd-sized to line up with maze.
      // - It avoids creating rooms that are too rectangular: too tall and
      //   narrow or too wide and flat.
      const size = randBetween(1, 3 + roomExtraSize) * 2 + 1
      const rectangularity = randBetween(0, 1 + Math.floor(size / 2)) * 2
      let width = size
      let height = size
      if (_oneIn(2)) {
        width += rectangularity
      } else {
        height += rectangularity
      }

      // Restrict the size of rooms relative to the stage size
      width = Math.min(width, Math.floor(stage.width * 0.2))
      height = Math.min(width, Math.floor(stage.height * 0.2))

      let x = randBetween(0, Math.floor((stage.width - width) / 2)) * 2 + 1
      let y = randBetween(0, Math.floor((stage.height - height) / 2)) * 2 + 1

      // Make sure X dimension doesn't overflow
      if (x + width > stage.width) {
        x = Math.max(1, stage.width - width - 1)
      }

      // Make sure Y dimension doesn't overflow
      if (y + height > stage.height) {
        y = Math.max(1, stage.height - height - 1)
      }

      const room = new Room(x, y, width, height)

      let overlaps = false

      for (const other of _rooms) {
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
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
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
    const regionConnections = {}
    const { corners, nonCorners } = _getRoomCorners()
    _tiles.forEach(row => {
      row.forEach(tile => {
        if (tile.type === 'floor') {
          return
        }
        // don't place a connector next to the corner of any room
        // because each corner will turn into wall
        if (getTileNESW(tile).find(tile => corners[tile.x].includes(tile.y))) {
          return
        }

        const tileRegions = _.unique(
          getTileNESW(tile).map(x => x.region)
            .filter(x => !_.isUndefined(x))
        )
        if (tileRegions.length <= 1) {
          return
        }

        const key = tileRegions.join('-')
        if (!regionConnections[key]) {
          regionConnections[key] = []
        }
        regionConnections[key].push(tile)
      })
    })

    _.each(regionConnections, (connections) => {
      const index = randBetween(0, connections.length - 1)
      connections[index].type = 'door'
      _convertToDoorOrFloor(connections[index], nonCorners)
      connections.splice(index, 1)

      // Occasional open up additional connections
      connections.forEach(conn => {
        if (_oneIn(extraConnectorChance)) {
          _convertToDoorOrFloor(conn, nonCorners)
        }
      })
    })
  }

  // doors need to be adjacent to at least 1 room
  const _convertToDoorOrFloor = (tile, nonCorners) => {
    const roomPerimeterNeighbours = getTileNESW(tile).filter(neighbour => nonCorners[neighbour.x].includes(neighbour.y))
    // if a connector is not adjacent to any room, make it a floor tile
    if (roomPerimeterNeighbours.length === 0) {
      tile.type = 'floor'
    // if a connector is adjacent to at least 1 room, make it a door tile
    } else {
      tile.type = 'door'
    }
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
    return randBetween(1, num) === 1
  }

  /**
   * @desc Marks the end of long dead ends as having "loot", and really long dead ends as "big loot"
   *
   * @returns {void}
   */
  const _lootifyDeadEnds = () => {
    const minLootLength = Math.floor(stage.width * 0.1)
    const minBigLootLength = Math.floor(stage.width * 0.2)
    _tiles.forEach((row) => {
      row.forEach((tile) => {
        if (tile.type === 'wall') {
          return
        }
        // If it only has one exit (i.e. only one non-wall direct neighbor), it's a dead end.
        if (
          getTileNESW(tile).filter(t => t.type !== 'wall').length <= 1 &&
          !_rooms.find((room) => room.containsTile(tile.x, tile.y))
        ) {
          let longDeadEnd = true
          let currentTile = tile
          const alreadyTraveledTiles = []
          // if the corridor ending in a dead end has at least (minLootLength) number of floor tiles before
          // encountering a room or another corridor, mark the tile as containing "loot"
          for (let i = 0; i < minBigLootLength; i++) {
            const adjacentTiles = getTileNESW(currentTile)
            const adjacentFloorTiles = adjacentTiles.filter(t => t.type !== 'wall' && !alreadyTraveledTiles.includes(t))
            if (adjacentFloorTiles.length === 1) {
              if (i === minLootLength - 1) {
                tile.loot = true
              }
              alreadyTraveledTiles.push(currentTile)
              currentTile = adjacentFloorTiles[0]
            } else {
              longDeadEnd = false
              i = minBigLootLength
            }
          }
          if (longDeadEnd) {
            tile.bigLoot = true
          }
        }
      })
    })
  }

  /**
   * @desc Gets whether an opening can be carved from the given starting
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
    const end = cell.clone().add(direction).add(direction).add(direction).toObject()

    if (!_tiles[end.x] || !_tiles[end.x][end.y]) {
      return false
    }

    if (getTile(end.x, end.y).type !== 'wall') {
      return false
    }

    // Destination must not be open.
    const dest = cell.clone().add(direction).add(direction).toObject()
    return getTile(dest.x, dest.y).type !== 'floor'
  }

  const _getRoomCorners = function () {
    const corners = Array.from({ length: _tiles.length + 1 }, () => [])
    const nonCorners = Array.from({ length: _tiles.length + 1 }, () => [])

    _rooms.forEach(room => {
      for (let x = room.x; x < room.x + room.width; x++) {
        for (let y = room.y; y < room.y + room.height; y++) {
          const tile = _tiles[x][y]
          if (_isCorner(tile, room)) {
            corners[x].push(y)
          } else {
            nonCorners[x].push(y)
          }
        }
      }
    })
    return { corners, nonCorners }
  }

  const _isCorner = function (tile, room) {
    const tileBordersTheOutside = tile.x === 1 || tile.x === _tiles.length - 2 ||
      tile.y === 1 || tile.y === _tiles[0].length - 2

    // if a tile borders the outside, it won't need to be filled in with a wall
    // because the outside border is already a wall
    if (tileBordersTheOutside) {
      return false
    }

    const neCorner = tile.x === room.x + room.width - 1 && tile.y === room.y
    const seCorner = tile.x === room.x + room.width - 1 && tile.y === room.y + room.height - 1
    const nwCorner = tile.x === room.x && tile.y === room.y
    const swCorner = tile.x === room.x && tile.y === room.y + room.height - 1

    return neCorner || seCorner || nwCorner || swCorner
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
    build
  }
}

export const build = (options) => {
  console.log('building with KZ VERSION 2 of Dungeoneer!!!')
  return new Dungeon().build(options)
}
