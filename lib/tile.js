'use strict'

/**
 * @desc Class for a single tilein a dungeon
 * @constructor
 *
 * @param {String} type - The type of tile, e.g. 'wall', 'floor'
 */
export default class Tile {
  constructor (type, x, y) {
    this.type = type
    this.neighbours = []
    this.x = x
    this.y = y
    this.loot = false
    this.bigLoot = false
  }
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

/**
 * @desc Returns a simple POJO representing this tile
 *
 * @returns {Object} - A POJO
 */
Tile.prototype.toJS = function toJS () {
  return {
    x: this.x,
    y: this.y,
    type: this.type,
    loot: this.loot,
    bigLoot: this.bigLoot
  }
}
