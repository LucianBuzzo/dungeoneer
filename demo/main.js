const dungeoneer = require('..')
const packageJSON = require('../package')

const WIDTH = 51
const HEIGHT = 51

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

ctx.imageSmoothingEnabled = false

const create = function (width, height) {
  const cellSize = 4
  const dungeon = dungeoneer.build({
    width: width,
    height: height
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
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
}

document.querySelector('#dice-svg svg').addEventListener('mousedown', function () {
  document.querySelector('#dice-svg svg').classList.add('mousedown')
}, false)

document.querySelector('#dice-svg svg').addEventListener('mouseup', function () {
  document.querySelector('#dice-svg svg').classList.remove('mousedown')
  create(WIDTH, HEIGHT)
}, false)

create(WIDTH, HEIGHT)

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
