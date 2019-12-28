declare module "dungeoneer" {
  type PlainTile = {
    // An object containing the tiles immediately surrounding this tile.
    nesw: {
      n?: Tile;
      ne?: Tile;
      e?: Tile;
      se?: Tile;
      s?: Tile;
      sw?: Tile;
      w?: Tile;
      nw?: Tile;
    };
    x: number;
    y: number;

    // 'floor' and 'door' are passable terrain and a wall is impassable terrain.
    type: "wall" | "floor" | "door";
  };

  interface Tile extends PlainTile {
    toJS(): PlainTile;
  }

  type PlainRoom = {
    height: number;
    width: number;
    x: number;
    y: number;
  };

  interface Room extends PlainRoom {
    getBoundingBox(): {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    containsTile(x: number, y: number): boolean;
    toJS(): PlainRoom;
    intersects(other: Room): boolean;
  }

  type Dungeon = {
    rooms: Room[];
    tiles: Array<Tile[]>;
    seed: string | number;
  };

  function build(options: {
    width: number;
    height: number;
    seed?: string | number;
  }): Dungeon;
}
