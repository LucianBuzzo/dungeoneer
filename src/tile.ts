export type TileType = 'wall' | 'floor' | 'door'

export type TileNeighbours = {
  n?: Tile;
  ne?: Tile;
  e?: Tile;
  se?: Tile;
  s?: Tile;
  sw?: Tile;
  w?: Tile;
  nw?: Tile;
}

export type PlainTile = {
  x: number;
  y: number;
  type: TileType;
  regionId?: number;
  regionTag?: string;
}

export default class Tile {
  type: TileType
  neighbours: TileNeighbours
  x: number
  y: number
  region?: number
  regionId?: number
  regionTag?: string

  constructor (type: TileType, x: number, y: number) {
    this.type = type
    this.neighbours = {}
    this.x = x
    this.y = y
  }

  setNeighbours (neighbours: TileNeighbours): Tile {
    this.neighbours = neighbours
    return this
  }

  toJS (): PlainTile {
    return {
      x: this.x,
      y: this.y,
      type: this.type,
      ...(this.regionId !== undefined ? { regionId: this.regionId } : {}),
      ...(this.regionTag !== undefined ? { regionTag: this.regionTag } : {})
    }
  }
}
