'use strict'

/**
 * @desc Class for a single tilein a dungeon
 * @constructor
 *
 * @param {String} type - The type of tile, e.g. 'wall', 'floor'
 */
const Tile = function Tile (type, x, y) {
  this.type = type
  this.neighbours = []
  this.x = x
  this.y = y
}

/**
 * @desc Sets an array containing this tiles immediate neighbours
 *
 * @param {Object[]} neighbours - An array of neighbouring Tiles
 *
 * @return {Object} - returns the Tile object, useful for chaining
 */
Tile.prototype.setNeighbours = function (neighbours) {
  this.neighbours = neighbours
  return this
}

module.exports = Tile
