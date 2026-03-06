export type TileType = 'wall' | 'floor' | 'door';
export type TileNeighbours = {
    n?: Tile;
    ne?: Tile;
    e?: Tile;
    se?: Tile;
    s?: Tile;
    sw?: Tile;
    w?: Tile;
    nw?: Tile;
};
export type PlainTile = {
    x: number;
    y: number;
    type: TileType;
    regionId?: number;
    regionTag?: string;
};
export default class Tile {
    type: TileType;
    neighbours: TileNeighbours;
    x: number;
    y: number;
    region?: number;
    regionId?: number;
    regionTag?: string;
    constructor(type: TileType, x: number, y: number);
    setNeighbours(neighbours: TileNeighbours): Tile;
    toJS(): PlainTile;
}
