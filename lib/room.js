'use strict'

/**
 * @desc Helper class for drawing rooms when generating dungeons
 * @constructor
 *
 * @param {Number} x - The x coordinate of the top side of the room
 * @param {Number} y - The y coordinate of the left hand side of the room
 * @param {Number} width - The width of the room
 * @param {Number} height - The height of the room
 */
export default class Room {
  constructor (x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
}

/**
 * @desc Returns the bounding box for this room
 * @function
 *
 * @returns {Object} - Bounding box object containing a top, right, bottom and
 * left value.
 */
Room.prototype.getBoundingBox = function getBoundingBox () {
  return {
    top: this.y,
    right: this.x + this.width - 1,
    bottom: this.y + this.height - 1,
    left: this.x
  }
}

Room.prototype.containsTile = function containsPoint (x, y) {
  const boundingBox = this.getBoundingBox()
  return !(
    x < boundingBox.left ||
    x > boundingBox.right ||
    y < boundingBox.top ||
    y > boundingBox.bottom
  )
}

/**
 * @desc Compares this room with an entity that has a bounding box method to see
 * if they intersect.
 *
 * @param {Object} other - An object with a getBoundingBox() method
 *
 * @returns {Boolean} - true if there is an intersection
 */
Room.prototype.intersects = function intersects (other) {
  if (!other.getBoundingBox) {
    throw new Error('Given entity has no method getBoundingBox')
  }
  const r1 = this.getBoundingBox()
  const r2 = other.getBoundingBox()

  return !(r2.left > r1.right + 1 ||
           r1.left > r2.right + 1 ||
           r2.top > r1.bottom + 1 ||
           r1.top > r2.bottom + 1)
}

/**
 * @desc Returns a simple POJO representing this room
 *
 * @returns {Object} - A POJO
 */
Room.prototype.toJS = function toJS () {
  return {
    x: this.x,
    y: this.y,
    width: this.width,
    height: this.height
  }
}
