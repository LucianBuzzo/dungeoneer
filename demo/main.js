const dungeoneer = require('..')
const packageJSON = require('../package')

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

ctx.imageSmoothingEnabled = false

const $seed = document.getElementById('seed')
const $stats = document.getElementById('stats')
const $seedHistory = document.getElementById('seed-history')
const HISTORY_KEY = 'dungeoneer-seed-history-v1'
const HISTORY_LIMIT = 8

const PRESETS = {
  classic: {
    width: 51,
    height: 51
  },
  dense: {
    width: 51,
    height: 51,
    constraints: {
      minRooms: 24,
      maxRooms: 38,
      minRoomSize: 3,
      maxRoomSize: 7
    },
    plugins: {
      regions: true,
      chokes: true,
      chokeInverse: 7,
      chokeMax: 20
    }
  },
  sparse: {
    width: 51,
    height: 51,
    constraints: {
      minRooms: 8,
      maxRooms: 14,
      minRoomSize: 5,
      maxRoomSize: 11,
      maxDeadEnds: 12
    }
  },
  labyrinth: {
    width: 71,
    height: 71,
    constraints: {
      minRooms: 6,
      maxRooms: 12,
      minRoomSize: 3,
      maxRoomSize: 5,
      maxDeadEnds: 2
    },
    plugins: {
      chokes: true,
      chokeInverse: 5,
      chokeMax: 30
    }
  },
  'secret-heavy': {
    width: 51,
    height: 51,
    constraints: {
      minRooms: 14,
      maxRooms: 24,
      minRoomSize: 3,
      maxRoomSize: 9
    },
    plugins: {
      secrets: true,
      secretsInverse: 5,
      secretsMax: 20,
      regions: true
    }
  }
}

const parseBool = (value) => value === '1' || value === 'true'

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

const setNumber = (id, value) => {
  document.getElementById(id).value = value === undefined ? '' : String(value)
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

const applyUrlState = () => {
  const params = new URLSearchParams(window.location.search)

  setNumber('width', Number(params.get('w')) || 51)
  setNumber('height', Number(params.get('h')) || 51)

  const useSeed = parseBool(params.get('us'))
  document.getElementById('use-seed').checked = useSeed
  document.getElementById('seed-input').value = params.get('seed') || ''

  document.getElementById('show-region-colors').checked = parseBool(params.get('rc'))
  document.getElementById('plugin-chokes').checked = parseBool(params.get('pc'))
  document.getElementById('plugin-secrets').checked = parseBool(params.get('ps'))
  document.getElementById('plugin-regions').checked = parseBool(params.get('pr'))

  setNumber('minRooms', params.get('minRooms') ? Number(params.get('minRooms')) : undefined)
  setNumber('maxRooms', params.get('maxRooms') ? Number(params.get('maxRooms')) : undefined)
  setNumber('minRoomSize', params.get('minRoomSize') ? Number(params.get('minRoomSize')) : undefined)
  setNumber('maxRoomSize', params.get('maxRoomSize') ? Number(params.get('maxRoomSize')) : undefined)
  setNumber('maxDeadEnds', params.get('maxDeadEnds') ? Number(params.get('maxDeadEnds')) : undefined)

  setNumber('chokeInverse', params.get('chokeInverse') ? Number(params.get('chokeInverse')) : 8)
  setNumber('chokeMax', params.get('chokeMax') ? Number(params.get('chokeMax')) : 12)
  setNumber('secretsInverse', params.get('secretsInverse') ? Number(params.get('secretsInverse')) : 12)
  setNumber('secretsMax', params.get('secretsMax') ? Number(params.get('secretsMax')) : 8)
}

const writeUrlState = () => {
  const params = new URLSearchParams()
  const options = buildOptionsFromControls()

  params.set('w', String(options.width))
  params.set('h', String(options.height))

  if (document.getElementById('use-seed').checked) {
    params.set('us', '1')
    const seed = document.getElementById('seed-input').value
    if (seed) {
      params.set('seed', seed)
    }
  }

  if (document.getElementById('show-region-colors').checked) params.set('rc', '1')
  if (document.getElementById('plugin-chokes').checked) params.set('pc', '1')
  if (document.getElementById('plugin-secrets').checked) params.set('ps', '1')
  if (document.getElementById('plugin-regions').checked) params.set('pr', '1')

  for (const key of ['minRooms', 'maxRooms', 'minRoomSize', 'maxRoomSize', 'maxDeadEnds', 'chokeInverse', 'chokeMax', 'secretsInverse', 'secretsMax']) {
    const value = getNumber(key)
    if (value !== undefined) {
      params.set(key, String(value))
    }
  }

  const query = params.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
}

const loadSeedHistory = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]')
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((seed) => typeof seed === 'string').slice(0, HISTORY_LIMIT)
  } catch (_) {
    return []
  }
}

let seedHistory = loadSeedHistory()

const saveSeedHistory = () => {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(seedHistory))
}

const renderSeedHistory = () => {
  $seedHistory.innerHTML = ''
  if (seedHistory.length === 0) {
    return
  }

  const label = document.createElement('span')
  label.innerText = 'Recent seeds:'
  $seedHistory.appendChild(label)

  for (const seed of seedHistory) {
    const button = document.createElement('button')
    button.type = 'button'
    button.innerText = seed
    button.addEventListener('click', () => {
      document.getElementById('use-seed').checked = true
      document.getElementById('seed-input').value = seed
      create()
    })
    $seedHistory.appendChild(button)
  }
}

const addSeedToHistory = (seed) => {
  if (!seed) {
    return
  }

  seedHistory = [seed, ...seedHistory.filter((item) => item !== seed)].slice(0, HISTORY_LIMIT)
  saveSeedHistory()
  renderSeedHistory()
}

const applyPreset = (name) => {
  const preset = PRESETS[name]
  if (!preset) {
    return
  }

  setNumber('width', preset.width)
  setNumber('height', preset.height)

  setNumber('minRooms', preset.constraints ? preset.constraints.minRooms : undefined)
  setNumber('maxRooms', preset.constraints ? preset.constraints.maxRooms : undefined)
  setNumber('minRoomSize', preset.constraints ? preset.constraints.minRoomSize : undefined)
  setNumber('maxRoomSize', preset.constraints ? preset.constraints.maxRoomSize : undefined)
  setNumber('maxDeadEnds', preset.constraints ? preset.constraints.maxDeadEnds : undefined)

  document.getElementById('plugin-chokes').checked = !!(preset.plugins && preset.plugins.chokes)
  document.getElementById('plugin-secrets').checked = !!(preset.plugins && preset.plugins.secrets)
  document.getElementById('plugin-regions').checked = !!(preset.plugins && preset.plugins.regions)

  setNumber('chokeInverse', preset.plugins && preset.plugins.chokeInverse ? preset.plugins.chokeInverse : 8)
  setNumber('chokeMax', preset.plugins && preset.plugins.chokeMax ? preset.plugins.chokeMax : 12)
  setNumber('secretsInverse', preset.plugins && preset.plugins.secretsInverse ? preset.plugins.secretsInverse : 12)
  setNumber('secretsMax', preset.plugins && preset.plugins.secretsMax ? preset.plugins.secretsMax : 8)

  create()
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

    addSeedToHistory(String(dungeon.seed))
    writeUrlState()

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

for (const button of document.querySelectorAll('#presets button')) {
  button.addEventListener('click', () => applyPreset(button.dataset.preset))
}

applyUrlState()
renderSeedHistory()
create()

window.create = create

const $version = document.createElement('div')
const shortSha = (process.env.DEMO_GIT_SHA || 'local').slice(0, 7)
$version.innerText = `v${packageJSON.version} (${shortSha})`
$version.style = `
  color: white;
  position: absolute;
  top: 16px;
  left: 16px;
  font-family: monospace;
`
document.body.appendChild($version)
