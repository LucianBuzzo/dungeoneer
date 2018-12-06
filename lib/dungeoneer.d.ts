declare module 'dungeoneer' {
  type Tile = {
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
    seed: string | number;
  }

  function build = (options: {
    width: number;
    height: number;
    seed?: string | number;
  }): Dungeon;

  export = build;
}
