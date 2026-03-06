import Room from '../room'
import Tile from '../tile'

type PluginContext = {
  rooms: Room[];
  tiles: Array<Tile[]>;
  randBetween: (min: number, max: number) => number;
  oneIn: (num: number) => boolean;
}

type AddChokePointsOptions = {
  inverseChance?: number;
  maxCount?: number;
}

const isCorridorTile = (tile: Tile, rooms: Room[]): boolean => {
  if (tile.type !== 'floor') {
    return false
  }

  if (rooms.find((room) => room.containsTile(tile.x, tile.y))) {
    return false
  }

  const neighbours = [tile.neighbours.n, tile.neighbours.e, tile.neighbours.s, tile.neighbours.w]
  const exits = neighbours.filter((n) => n && n.type !== 'wall')

  if (exits.length !== 2) {
    return false
  }

  const a = exits[0] as Tile
  const b = exits[1] as Tile

  const horizontal = a.x !== b.x && a.y === b.y
  const vertical = a.x === b.x && a.y !== b.y

  return horizontal || vertical
}

const addChokePoints = (options: AddChokePointsOptions = {}) => {
  const inverseChance = options.inverseChance ?? 8
  const maxCount = options.maxCount ?? Number.POSITIVE_INFINITY

  return ({ rooms, tiles, oneIn }: PluginContext): void => {
    let added = 0

    for (const row of tiles) {
      for (const tile of row) {
        if (added >= maxCount) {
          return
        }

        if (!isCorridorTile(tile, rooms)) {
          continue
        }

        if (oneIn(inverseChance)) {
          tile.type = 'door'
          added++
        }
      }
    }
  }
}

export default addChokePoints
