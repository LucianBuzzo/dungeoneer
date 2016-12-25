'use strict';

/**
 * @desc Helper class for drawing rooms when generating dungeons
 * @constructor
 *
 * @param {Number} x - The x coordinate of the top side of the room
 * @param {Number} y - The y coordinate of the left hand side of the room
 * @param {Number} width - The width of the room
 * @param {Number} height - The height of the room
 */
const Room = function Room(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

/**
 * @desc Returns the bounding box for this room
 * @function
 *
 * @returns {Object} - Bounding box object containing a top, right, bottom and
 * left value.
 */
Room.prototype.getBoundingBox = function getBoundingBox() {
  return {
    top: this.y,
    right: this.x + this.width,
    bottom: this.y + this.height,
    left: this.x
  };
};

/**
 * @desc Compares this room with an entity that has a bounding box method to see
 * if they intersect.
 *
 * @param {Object} other - An object with a getBoundingBox() method
 *
 * @returns {Boolean} - true if there is an intersection
 */
Room.prototype.intersects = function intersects(other) {
  if (!other.getBoundingBox) {
    throw new Error('Given entity has no method getBoundingBox');
  }
  var r1 = this.getBoundingBox();
  var r2 = other.getBoundingBox();

  return !(r2.left > r1.right ||
           r2.right < r1.left ||
           r2.top > r1.bottom ||
           r2.bottom < r1.top);
};

module.exports = Room;
