declare module 'dungeoneer' {
  type Tile = {
    // An array containing the tiles immediately surrounding this one.
    neighbours: Tile[]

    // An object containing the tiles immediately north, south, east, and west of this tile.
    nesw: {
      north?: Tile;
      east?: Tile;
      south?: Tile;
      west?: Tile;
    };

    // 'floor' and 'door' are passable terrain and a wall is impassable terrain.
    type: 'wall' | 'floor' | 'door';
  }

  type Room = {
    height: number;
    width: number;
    x: number;
    y: number;
  }

  type Dungeon = {
    rooms: Room[];
    tiles: Array<Tile[]>;
  }

  function generate = (options: {
    width: number;
    height: number;
  }): Dungeon;

  export = generate;
}
