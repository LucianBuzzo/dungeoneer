import Chance from 'chance'
import Victor from 'victor'
import _ from 'underscore'

import Room, { PlainRoom } from './room'
import Tile, { PlainTile, TileNeighbours, TileType } from './tile'
import addChokePoints from './plugins/add-choke-points'

type BuildConstraints = {
  minRooms?: number;
  maxRooms?: number;
  minRoomSize?: number;
  maxRoomSize?: number;
  maxDeadEnds?: number;
}

type PluginContext = {
  rooms: Room[];
  tiles: Array<Tile[]>;
  seed: string | number;
  randBetween: (min: number, max: number) => number;
  oneIn: (num: number) => boolean;
}

type DungeonPlugin = (context: PluginContext) => void

type BuildOptions = {
  width: number;
  height: number;
  seed?: string | number;
  constraints?: BuildConstraints;
  plugins?: DungeonPlugin[];
}

type DungeonOutput = {
  rooms: Room[];
  tiles: Array<Tile[]>;
  seed: string | number;
  toJS: () => {
    tiles: Array<PlainTile[]>;
    rooms: PlainRoom[];
    seed: string | number;
  };
}

const getTileNESW = (tile: Tile): Tile[] => {
  const tiles: Tile[] = []
  if (tile.neighbours.n) tiles.push(tile.neighbours.n)
  if (tile.neighbours.e) tiles.push(tile.neighbours.e)
  if (tile.neighbours.s) tiles.push(tile.neighbours.s)
  if (tile.neighbours.w) tiles.push(tile.neighbours.w)
  return tiles
}

const nameChance = new Chance()

const assertInteger = (value: number, path: string): void => {
  if (!Number.isInteger(value)) {
    throw new RangeError(`DungeoneerError: ${path} must be an integer, received ${value}`)
  }
}

const validatePlugins = (plugins: DungeonPlugin[]): void => {
  plugins.forEach((plugin, index) => {
    if (typeof plugin !== 'function') {
      throw new TypeError(`DungeoneerError: options.plugins[${index}] must be a function`)
    }
  })
}

const validateConstraints = (constraints: BuildConstraints): void => {
  const {
    minRooms,
    maxRooms,
    minRoomSize,
    maxRoomSize,
    maxDeadEnds
  } = constraints

  const numericChecks: Array<[number | undefined, string, number]> = [
    [minRooms, 'options.constraints.minRooms', 1],
    [maxRooms, 'options.constraints.maxRooms', 1],
    [minRoomSize, 'options.constraints.minRoomSize', 1],
    [maxRoomSize, 'options.constraints.maxRoomSize', 1],
    [maxDeadEnds, 'options.constraints.maxDeadEnds', 0]
  ]

  for (const [value, path, min] of numericChecks) {
    if (value === undefined) {
      continue
    }

    assertInteger(value, path)

    if (value < min) {
      throw new RangeError(`DungeoneerError: ${path} must be greater than or equal to ${min}, received ${value}`)
    }
  }

  if (
    minRooms !== undefined &&
    maxRooms !== undefined &&
    minRooms > maxRooms
  ) {
    throw new RangeError('DungeoneerError: options.constraints.minRooms must be less than or equal to options.constraints.maxRooms')
  }

  if (
    minRoomSize !== undefined &&
    maxRoomSize !== undefined &&
    minRoomSize > maxRoomSize
  ) {
    throw new RangeError('DungeoneerError: options.constraints.minRoomSize must be less than or equal to options.constraints.maxRoomSize')
  }
}

const Dungeon = function Dungeon () {
  const numRoomTries = 50
  const extraConnectorChance = 50
  const roomExtraSize = 0
  const windingPercent = 50

  const _rooms: Room[] = []
  let _currentRegion = -1

  let stage: BuildOptions
  let rng: Chance.Chance

  const n = new Victor(0, 1)
  const e = new Victor(1, 0)
  const s = new Victor(0, -1)
  const w = new Victor(-1, 0)

  const cardinalDirections = [n, e, s, w]

  const bindStage = (givenStage: BuildOptions): void => {
    stage = givenStage
  }

  const _tiles: Tile[][] = []
  let _seed: string | number

  const randBetween = (min: number, max: number): number => {
    return rng.integer({ min, max })
  }

  const getTile = (x: number, y: number): Tile => {
    return _tiles[x][y]
  }

  const setTile = (x: number, y: number, type: TileType): Tile => {
    if (_tiles[x] && _tiles[x][y]) {
      _tiles[x][y].type = type
      _tiles[x][y].region = _currentRegion
      return _tiles[x][y]
    }

    throw new RangeError(`tile at ${x}, ${y} is unreachable`)
  }

  const fill = (type: TileType): Tile[][] => {
    let neighbours: TileNeighbours = {}

    for (let x = 0; x < stage.width; x++) {
      _tiles.push([])
      for (let y = 0; y < stage.height; y++) {
        _tiles[x].push(new Tile(type, x, y))
      }
    }

    for (let x = 0; x < stage.width; x++) {
      for (let y = 0; y < stage.height; y++) {
        neighbours = {}
        if (_tiles[x][y - 1]) neighbours.n = _tiles[x][y - 1]
        if (_tiles[x + 1] && _tiles[x + 1][y - 1]) neighbours.ne = _tiles[x + 1][y - 1]
        if (_tiles[x + 1] && _tiles[x + 1][y]) neighbours.e = _tiles[x + 1][y]
        if (_tiles[x + 1] && _tiles[x + 1][y + 1]) neighbours.se = _tiles[x + 1][y + 1]
        if (_tiles[x] && _tiles[x][y + 1]) neighbours.s = _tiles[x][y + 1]
        if (_tiles[x - 1] && _tiles[x - 1][y + 1]) neighbours.sw = _tiles[x - 1][y + 1]
        if (_tiles[x - 1] && _tiles[x - 1][y]) neighbours.w = _tiles[x - 1][y]
        if (_tiles[x - 1] && _tiles[x - 1][y - 1]) neighbours.nw = _tiles[x - 1][y - 1]
        _tiles[x][y].setNeighbours(neighbours)
      }
    }

    return _tiles
  }

  const _toJS = () => {
    const rooms: PlainRoom[] = []
    const tiles: PlainTile[][] = []

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

  const _startRegion = (): number => {
    _currentRegion++
    return _currentRegion
  }

  const _carve = (x: number, y: number, type: TileType = 'floor'): void => {
    setTile(x, y, type)
  }

  const _canCarve = (cell: Victor, direction: Victor): boolean => {
    const end = cell.clone().add(direction).add(direction).add(direction).toObject()

    if (!_tiles[end.x] || !_tiles[end.x][end.y]) {
      return false
    }

    if (getTile(end.x, end.y).type !== 'wall') {
      return false
    }

    const dest = cell.clone().add(direction).add(direction).toObject()
    return getTile(dest.x, dest.y).type !== 'floor'
  }

  const _oneIn = (num: number): boolean => {
    return randBetween(1, num) === 1
  }

  const carveArea = (x: number, y: number, width: number, height: number): void => {
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        _carve(i, j)
      }
    }
  }

  const _growMaze = (startX: number, startY: number): void => {
    const cells: Victor[] = []
    let lastDir: Victor | null = null

    if (Object.values(_tiles[startX][startY].neighbours).filter(tile => tile.type === 'floor').length > 0) {
      return
    }

    _startRegion()
    _carve(startX, startY)
    cells.push(new Victor(startX, startY))

    let count = 0

    while (cells.length && count < 500) {
      count++
      const cell = cells[cells.length - 1]

      const unmadeCells: Victor[] = []

      for (const dir of cardinalDirections) {
        if (_canCarve(cell, dir)) {
          unmadeCells.push(dir)
        }
      }

      if (unmadeCells.length) {
        let dir: Victor
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
        cells.pop()
        lastDir = null
      }
    }
  }

  const _addRooms = (): void => {
    const constraints = stage.constraints

    const minRooms = constraints?.minRooms ?? 0
    const maxRooms = constraints?.maxRooms ?? Number.POSITIVE_INFINITY

    const minConfiguredRoomSize = constraints?.minRoomSize
    const maxConfiguredRoomSize = constraints?.maxRoomSize

    const usesRoomSizeConstraints = minConfiguredRoomSize !== undefined || maxConfiguredRoomSize !== undefined

    const maxFeasibleRoomSize = Math.max(1, Math.min(stage.width - 4, stage.height - 4))

    const toOddCeil = (value: number): number => {
      return value % 2 === 0 ? value + 1 : value
    }

    const toOddFloor = (value: number): number => {
      return value % 2 === 0 ? value - 1 : value
    }

    const pickOddInRange = (min: number, max: number): number => {
      const oddMin = toOddCeil(min)
      const oddMax = toOddFloor(max)

      if (oddMin > oddMax) {
        throw new RangeError(`DungeoneerError: room size constraints are infeasible for this stage size (${stage.width}x${stage.height})`)
      }

      const steps = Math.floor((oddMax - oddMin) / 2)
      return oddMin + (randBetween(0, steps) * 2)
    }

    const maxAttempts = Math.max(
      numRoomTries,
      minRooms * 25,
      Number.isFinite(maxRooms) ? maxRooms * 10 : 0
    )

    let attempts = 0

    while (attempts < maxAttempts && _rooms.length < maxRooms) {
      attempts++

      let width: number
      let height: number

      if (usesRoomSizeConstraints) {
        const minSize = Math.min(minConfiguredRoomSize ?? 3, maxFeasibleRoomSize)
        const maxSize = Math.min(maxConfiguredRoomSize ?? maxFeasibleRoomSize, maxFeasibleRoomSize)

        width = pickOddInRange(minSize, maxSize)
        height = pickOddInRange(minSize, maxSize)
      } else {
        const size = randBetween(1, 3 + roomExtraSize) * 2 + 1
        const rectangularity = randBetween(0, 1 + Math.floor(size / 2)) * 2

        width = size
        height = size

        if (_oneIn(2)) {
          width += rectangularity
        } else {
          height += rectangularity
        }

        width = Math.min(width, stage.width - 4)
        height = Math.min(height, stage.height - 4)
      }

      let x = randBetween(0, Math.floor((stage.width - width) / 2)) * 2 + 1
      let y = randBetween(0, Math.floor((stage.height - height) / 2)) * 2 + 1

      if (x + width > stage.width) {
        x = Math.max(1, stage.width - width - 1)
      }

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
      carveArea(x, y, width, height)
    }

    if (_rooms.length < minRooms) {
      throw new RangeError(`DungeoneerError: unable to satisfy options.constraints.minRooms=${minRooms}; generated ${_rooms.length} room(s)`)
    }
  }

  const _connectRegions = (): void => {
    const regionConnections: Record<string, Tile[]> = {}

    _tiles.forEach(row => {
      row.forEach(tile => {
        if (tile.type === 'floor') {
          return
        }

        const tileRegions = _.uniq(
          getTileNESW(tile).map(x => x.region)
            .filter(x => !_.isUndefined(x))
        ) as number[]

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

    _.each(regionConnections, (connections: Tile[]) => {
      const index = randBetween(0, connections.length - 1)
      connections[index].type = 'door'
      connections.splice(index, 1)

      connections.forEach(conn => {
        if (_oneIn(extraConnectorChance)) {
          conn.type = 'door'
        }
      })
    })
  }

  const _applyPlugins = (plugins: DungeonPlugin[], seed: string | number): void => {
    const context: PluginContext = {
      rooms: _rooms,
      tiles: _tiles,
      seed,
      randBetween,
      oneIn: _oneIn
    }

    for (const plugin of plugins) {
      plugin(context)
    }
  }

  const _removeDeadEnds = (): void => {
    const maxDeadEnds = stage.constraints?.maxDeadEnds

    const isRemovableDeadEnd = (tile: Tile): boolean => {
      if (tile.type === 'wall') {
        return false
      }

      if (_rooms.find((room) => room.containsTile(tile.x, tile.y))) {
        return false
      }

      return getTileNESW(tile).filter(t => t.type !== 'wall').length <= 1
    }

    const countDeadEnds = (): number => {
      let count = 0
      _tiles.forEach((row) => {
        row.forEach((tile) => {
          if (isRemovableDeadEnd(tile)) {
            count++
          }
        })
      })

      return count
    }

    let done = false

    const cycle = (): boolean => {
      let isDone = true

      if (maxDeadEnds !== undefined && countDeadEnds() <= maxDeadEnds) {
        return true
      }

      _tiles.forEach((row) => {
        row.forEach((tile) => {
          if (isRemovableDeadEnd(tile)) {
            tile.type = 'wall'
            isDone = false
          }
        })
      })

      return isDone
    }

    while (!done) {
      done = cycle()
    }
  }

  const build = (inputStage: BuildOptions): DungeonOutput => {
    const mutableStage = { ...inputStage }

    if (mutableStage.width < 5) {
      throw new RangeError(`DungeoneerError: options.width must not be less than 5, received ${mutableStage.width}`)
    }

    if (mutableStage.height < 5) {
      throw new RangeError(`DungeoneerError: options.height must not be less than 5, received ${mutableStage.height}`)
    }

    if (mutableStage.constraints) {
      validateConstraints(mutableStage.constraints)
    }

    if (mutableStage.plugins) {
      validatePlugins(mutableStage.plugins)
    }

    if (mutableStage.width % 2 === 0) {
      mutableStage.width += 1
    }

    if (mutableStage.height % 2 === 0) {
      mutableStage.height += 1
    }

    const seed = mutableStage.seed === undefined || mutableStage.seed === null
      ? `${nameChance.word({ length: 7 })}-${nameChance.word({ length: 7 })}`
      : mutableStage.seed

    rng = new Chance(seed)
    _seed = seed

    bindStage(mutableStage)
    fill('wall')
    _addRooms()

    for (let y = 1; y < mutableStage.height; y += 2) {
      for (let x = 1; x < mutableStage.width; x += 2) {
        if (getTile(x, y).type === 'floor') {
          continue
        }
        _growMaze(x, y)
      }
    }

    _connectRegions()
    _removeDeadEnds()

    if (mutableStage.plugins) {
      _applyPlugins(mutableStage.plugins, seed)
    }

    return {
      rooms: _rooms,
      tiles: _tiles,
      seed,
      toJS: _toJS
    }
  }

  return {
    build
  }
}

const build = (options: BuildOptions): DungeonOutput => {
  return Dungeon().build(options)
}

module.exports = {
  build,
  plugins: {
    addChokePoints
  }
}
