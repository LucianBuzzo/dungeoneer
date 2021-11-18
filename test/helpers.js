exports.walkDungeon = (dungeon) => {
  let start
  const visited = []

  for (let x = 0; x < dungeon.tiles.length; x++) {
    if (!visited[x]) {
      visited[x] = []
    }

    for (let y = 0; y < dungeon.tiles[x].length; y++) {
      visited[x].push(false)

      if (!start && match(dungeon.tiles[x][y])) {
        start = dungeon.tiles[x][y]
      }
    }
  }

  const stack = [start]

  while (stack.length) {
    const tile = stack.shift()

    visit(tile)

    for (const dir in tile.neighbours) {
      const neighbour = tile.neighbours[dir]
      if (!visited[neighbour.x][neighbour.y] && match(neighbour)) {
        stack.push(neighbour)
      }
    }
  }

  function match (tile) {
    return tile.type === 'floor' || tile.type === 'door'
  }

  function visit (tile) {
    visited[tile.x][tile.y] = true
  }

  return visited
}
