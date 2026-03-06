const dungeoneer = require('..')
const packageJSON = require('../package')

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

ctx.imageSmoothingEnabled = false

const $seed = document.getElementById('seed')
const $stats = document.getElementById('stats')

const getNumber = (id) => {
  const raw = document.getElementById(id).value
  if (raw === '') {
    return undefined
  }

  const value = Number(raw)
  if (Number.isNaN(value)) {
    return undefined
  }

  return value
}

const hashColor = (text) => {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash |= 0
  }

  const hue = Math.abs(hash) % 360
  return `hsla(${hue}, 80%, 60%, 0.8)`
}

const countTilesByType = (dungeon, type) => {
  let count = 0
  for (const row of dungeon.tiles) {
    for (const tile of row) {
      if (tile.type === type) {
        count++
      }
    }
  }
  return count
}

const countDeadEnds = (dungeon) => {
  let count = 0

  for (const row of dungeon.tiles) {
    for (const tile of row) {
      if (tile.type === 'wall') {
        continue
      }

      const inRoom = dungeon.rooms.find((room) => room.containsTile(tile.x, tile.y))
      if (inRoom) {
        continue
      }

      const neighbours = [tile.neighbours.n, tile.neighbours.e, tile.neighbours.s, tile.neighbours.w]
      const exits = neighbours.filter((n) => n && n.type !== 'wall').length

      if (exits <= 1) {
        count++
      }
    }
  }

  return count
}

const buildOptionsFromControls = () => {
  const width = getNumber('width') || 51
  const height = getNumber('height') || 51

  const options = {
    width,
    height
  }

  if (document.getElementById('use-seed').checked) {
    const seed = document.getElementById('seed-input').value
    if (seed !== '') {
      options.seed = seed
    }
  }

  const constraints = {
    minRooms: getNumber('minRooms'),
    maxRooms: getNumber('maxRooms'),
    minRoomSize: getNumber('minRoomSize'),
    maxRoomSize: getNumber('maxRoomSize'),
    maxDeadEnds: getNumber('maxDeadEnds')
  }

  const hasConstraints = Object.values(constraints).some((value) => value !== undefined)
  if (hasConstraints) {
    options.constraints = constraints
  }

  const plugins = []

  if (document.getElementById('plugin-chokes').checked) {
    plugins.push(dungeoneer.plugins.addChokePoints({
      inverseChance: getNumber('chokeInverse') || 8,
      maxCount: getNumber('chokeMax') || 12
    }))
  }

  if (document.getElementById('plugin-secrets').checked) {
    plugins.push(dungeoneer.plugins.addSecrets({
      inverseChance: getNumber('secretsInverse') || 12,
      maxCount: getNumber('secretsMax') || 8
    }))
  }

  if (document.getElementById('plugin-regions').checked) {
    plugins.push(dungeoneer.plugins.addRegionTags())
  }

  if (plugins.length > 0) {
    options.plugins = plugins
  }

  return options
}

const renderDungeon = (dungeon, width, height) => {
  const cellSize = 4
  const colorByRegion = document.getElementById('show-region-colors').checked

  canvas.width = width * cellSize
  canvas.height = height * cellSize
  canvas.style.width = width * cellSize + 'px'
  canvas.style.height = height * cellSize + 'px'

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  for (const room of dungeon.rooms) {
    ctx.fillStyle = '#912f2f'
    ctx.fillRect(room.x * cellSize, room.y * cellSize, room.width * cellSize, room.height * cellSize)
  }

  for (let x = 0; x < dungeon.tiles.length; x++) {
    for (let y = 0; y < dungeon.tiles[x].length; y++) {
      const tile = dungeon.tiles[x][y]
      if (tile.type === 'wall') {
        continue
      }

      if (tile.type === 'door') {
        ctx.fillStyle = '#ffd43b'
      } else if (colorByRegion && tile.regionTag) {
        ctx.fillStyle = hashColor(tile.regionTag)
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      }

      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
    }
  }
}

const create = () => {
  try {
    const options = buildOptionsFromControls()
    const dungeon = dungeoneer.build(options)

    renderDungeon(dungeon, options.width, options.height)

    $seed.innerText = dungeon.seed

    const doors = countTilesByType(dungeon, 'door')
    const floors = countTilesByType(dungeon, 'floor')
    const deadEnds = countDeadEnds(dungeon)

    $stats.innerText = `rooms=${dungeon.rooms.length} floors=${floors} doors=${doors} deadEnds=${deadEnds}`

    window.ctx = ctx
    window.dungeon = dungeon
  } catch (error) {
    $stats.innerText = error.message
    console.error(error)
  }
}

document.querySelector('#dice-svg svg').addEventListener('mousedown', function () {
  document.querySelector('#dice-svg svg').classList.add('mousedown')
}, false)

document.querySelector('#dice-svg svg').addEventListener('mouseup', function () {
  document.querySelector('#dice-svg svg').classList.remove('mousedown')

  if (!document.getElementById('use-seed').checked) {
    document.getElementById('seed-input').value = ''
  }

  create()
}, false)

for (const el of document.querySelectorAll('#controls input')) {
  el.addEventListener('change', () => create())
}

create()

window.create = create

const $version = document.createElement('div')
$version.innerText = `v${packageJSON.version}`
$version.style = `
  color: white;
  position: absolute;
  top: 16px;
  left: 16px;
  font-family: monospace;
`
document.body.appendChild($version)
