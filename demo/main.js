const dungeoneer = require('..')
const packageJSON = require('../package')

const LEVEL = 1

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

ctx.imageSmoothingEnabled = false

const create = function (level) {
  // first level: 21 x 21
  // 2nd: 25 x 25
  // 3rd: 31 x 31
  // 4th: 35 x 35
  // 5th: 41 x 41
  const width = (16 + ((level - 1) * 4)) * 2
  const height = (16 + ((level - 1) * 4)) * 2
  const cellSize = 4
  const dungeon = dungeoneer.build({
    level
  })

  console.log('Generated dungeon', dungeon)

  canvas.width = width * cellSize
  canvas.height = height * cellSize

  canvas.style.width = width * cellSize + 'px'
  canvas.style.height = height * cellSize + 'px'

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.fillStyle = 'red'

  dungeon.rooms.forEach((room) => {
    ctx.fillStyle = 'red'
    ctx.fillRect(room.x * cellSize, room.y * cellSize, room.width * cellSize, room.height * cellSize)
  })

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'

  for (let x = 0; x < dungeon.tiles.length; x++) {
    for (let y = 0; y < dungeon.tiles[x].length; y++) {
      if (dungeon.tiles[x][y].type === 'floor') {
        if (dungeon.tiles[x][y].loot) {
          if (dungeon.tiles[x][y].bigLoot) {
            ctx.fillStyle = 'purple'
          } else {
            ctx.fillStyle = 'orange'
          }
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        }
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
      if (dungeon.tiles[x][y].type === 'door') {
        ctx.fillStyle = 'yellow'
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }
  }

  window.ctx = ctx
  window.dungeon = dungeon

  window.border = () => {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(cellSize * width, 0)
    ctx.lineTo(cellSize * width, cellSize * height)
    ctx.lineTo(0, cellSize * height)
    ctx.lineTo(0, 0)
    ctx.strokeStyle = 'white'
    ctx.stroke()
  }

  const $seed = document.getElementById('seed')
  $seed.innerText = dungeon.seed
}

document.querySelector('#dice-svg svg').addEventListener('mousedown', function () {
  document.querySelector('#dice-svg svg').classList.add('mousedown')
}, false)

document.querySelector('#dice-svg svg').addEventListener('mouseup', function () {
  document.querySelector('#dice-svg svg').classList.remove('mousedown')
  create(LEVEL)
}, false)

create(LEVEL)

window.create = create

const $version = document.createElement('div')
$version.innerText = `v${packageJSON.version}`
$version.style = `
  color: white;
  position: absolute;
  bottom: 16px;
  left: 16px;
  font-family: monospace;
`
document.body.appendChild($version)
