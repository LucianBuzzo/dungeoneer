import Room from '../room'
import Tile from '../tile'

type PluginContext = {
  rooms: Room[];
  tiles: Array<Tile[]>;
  oneIn: (num: number) => boolean;
}

type AddSecretsOptions = {
  inverseChance?: number;
  maxCount?: number;
}

const isRoomBoundaryWall = (tile: Tile, rooms: Room[]): boolean => {
  if (tile.type !== 'wall') {
    return false
  }

  const cardinalNeighbours = [tile.neighbours.n, tile.neighbours.e, tile.neighbours.s, tile.neighbours.w]

  let adjacentRoomFloor = 0
  let adjacentCorridorFloor = 0

  for (const neighbour of cardinalNeighbours) {
    if (!neighbour || neighbour.type !== 'floor') {
      continue
    }

    const inRoom = rooms.find((room) => room.containsTile(neighbour.x, neighbour.y))
    if (inRoom) {
      adjacentRoomFloor++
    } else {
      adjacentCorridorFloor++
    }
  }

  return adjacentRoomFloor >= 1 && adjacentCorridorFloor >= 1
}

const addSecrets = (options: AddSecretsOptions = {}) => {
  const inverseChance = options.inverseChance ?? 12
  const maxCount = options.maxCount ?? Number.POSITIVE_INFINITY

  return ({ rooms, tiles, oneIn }: PluginContext): void => {
    let added = 0

    for (const row of tiles) {
      for (const tile of row) {
        if (added >= maxCount) {
          return
        }

        if (!isRoomBoundaryWall(tile, rooms)) {
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

export default addSecrets
