import Room from '../room'
import Tile from '../tile'

type PluginContext = {
  rooms: Room[];
  tiles: Array<Tile[]>;
}

type RegionKind = 'room' | 'corridor'
type CorridorFlavor = 'hub' | 'branch' | 'dead-end-cluster'

type AddRegionTagsOptions = {
  roomPrefix?: string;
  corridorPrefix?: string;
}

type RegionAnalysis = {
  id: number;
  tiles: Tile[];
  kind: RegionKind;
  flavor?: CorridorFlavor;
}

const getCardinalPassableNeighbours = (tile: Tile): Tile[] => {
  const neighbours = [tile.neighbours.n, tile.neighbours.e, tile.neighbours.s, tile.neighbours.w]
  return neighbours.filter((n): n is Tile => Boolean(n && n.type !== 'wall'))
}

const classifyCorridorFlavor = (tiles: Tile[]): CorridorFlavor => {
  if (tiles.length === 0) {
    return 'branch'
  }

  let deadEnds = 0
  let junctions = 0

  for (const tile of tiles) {
    const degree = getCardinalPassableNeighbours(tile).length
    if (degree <= 1) {
      deadEnds++
    }
    if (degree >= 3) {
      junctions++
    }
  }

  const deadEndRatio = deadEnds / tiles.length

  if (deadEndRatio >= 0.2) {
    return 'dead-end-cluster'
  }

  if (junctions > 0) {
    return 'hub'
  }

  return 'branch'
}

const buildRegions = (tiles: Array<Tile[]>, rooms: Room[]): RegionAnalysis[] => {
  const visited = new Set<string>()
  const regions: RegionAnalysis[] = []
  let regionId = 1

  const keyFor = (tile: Tile): string => `${tile.x},${tile.y}`
  const isRoomTile = (tile: Tile): boolean => Boolean(rooms.find((room) => room.containsTile(tile.x, tile.y)))

  for (const row of tiles) {
    for (const tile of row) {
      if (tile.type === 'wall') {
        continue
      }

      const startKey = keyFor(tile)
      if (visited.has(startKey)) {
        continue
      }

      const kind: RegionKind = isRoomTile(tile) ? 'room' : 'corridor'

      const queue: Tile[] = [tile]
      const component: Tile[] = []

      visited.add(startKey)

      while (queue.length > 0) {
        const current = queue.shift() as Tile
        component.push(current)

        const neighbours = getCardinalPassableNeighbours(current)
        for (const neighbour of neighbours) {
          if (isRoomTile(neighbour) !== (kind === 'room')) {
            continue
          }

          const key = keyFor(neighbour)
          if (visited.has(key)) {
            continue
          }
          visited.add(key)
          queue.push(neighbour)
        }
      }

      const region: RegionAnalysis = {
        id: regionId,
        tiles: component,
        kind
      }

      if (kind === 'corridor') {
        region.flavor = classifyCorridorFlavor(component)
      }

      regions.push(region)
      regionId++
    }
  }

  return regions
}

const addRegionTags = (options: AddRegionTagsOptions = {}) => {
  const roomPrefix = options.roomPrefix ?? 'room'
  const corridorPrefix = options.corridorPrefix ?? 'corridor'

  return ({ rooms, tiles }: PluginContext): void => {
    const regions = buildRegions(tiles, rooms)

    for (const region of regions) {
      const base = region.kind === 'room'
        ? `${roomPrefix}:${region.id}`
        : `${corridorPrefix}:${region.id}`

      const suffix = region.kind === 'corridor' && region.flavor
        ? `:${region.flavor}`
        : ''

      for (const tile of region.tiles) {
        tile.regionId = region.id
        tile.regionTag = `${base}${suffix}`
      }
    }
  }
}

export default addRegionTags
