/**
 * Based on Bob Nystrom's procedural dungeon generation logic that he wrote for Hauberk
 * http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
 */

var _ = require('underscore');
var Room = require('./room');
var Tile = require('./tile');

/**
 * @desc The random dungeon generator.
 *
 * Starting with a stage of solid walls, it works like so:
 *
 * 1. Place a number of randomly sized and positioned rooms. If a room
 *    overlaps an existing room, it is discarded. Any remaining rooms are
 *    carved out.
 * 2. Any remaining solid areas are filled in with mazes. The maze generator
 *    will grow and fill in even odd-shaped areas, but will not touch any
 *    rooms.
 * 3. The result of the previous two steps is a series of unconnected rooms
 *    and mazes. We walk the stage and find every tile that can be a
 *    "connector". This is a solid tile that is adjacent to two unconnected
 *    regions.
 * 4. We randomly choose connectors and open them or place a door there until
 *    all of the unconnected regions have been joined. There is also a slight
 *    chance to carve a connector between two already-joined regions, so that
 *    the dungeon isn't single connected.
 * 5. The mazes will have a lot of dead ends. Finally, we remove those by
 *    repeatedly filling in any open tile that's closed on three sides. When
 *    this is done, every corridor in a maze actually leads somewhere.
 *
 * The end result of this is a multiply-connected dungeon with rooms and lots
 * of winding corridors.
 *
 * @constructor
 */
const Dungeon = function Dungeon() {
  var numRoomTries = 50;

  // The inverse chance of adding a connector between two regions that have
  // already been joined. Increasing this leads to more loosely connected
  // dungeons.
  var extraConnectorChance = 50;

  // Increasing this allows rooms to be larger.
  var roomExtraSize = 0;

  var windingPercent = 0;

  var _rooms = [];

  // The index of the current region being carved.
  var _currentRegion = -1;

  var stage;

  const bindStage = (givenStage) => {
    stage = givenStage;
  };

  let _tiles = [];

  /**
   * @desc returns a tile at the provided coordinates
   *
   * @param {Number} x - The x coordinate to retrieve
   * @param {Number} y - The y coordinate to retrieve
   *
   * @returns {Object} - A Tile object
   */
  const getTile = (x, y) => {
    return _tiles[x][y];
  };

  /**
   * @desc Sets a tile's type and region
   *
   * @param {Number} x - The x coordinate of the tile to set
   * @param {Number} y - The y coordinate of the tile to set
   * @param {String} type - The type to set on the tile
   *
   * @returns {Object} - The Tile object or null if the tile was not found
   *
   */
  const setTile = (x, y, type) => {
    if (_tiles[x] && _tiles[x][y]) {
      _tiles[x][y].type = type;
      _tiles[x][y].region = _currentRegion;

      return _tiles[x][y];
    }

    return null;
  };

  /**
   * @desc Generates tile data to the dimension of the stage.
   *
   * @param {String} type - The tile type to set on newly created tiles
   *
   * @returns {Array} - The _tiles array
   */
  const fill = (type) => {
    let neighbours = [];
    let nesw = {};
    var x;
    var y;

    for (x = 0; x < stage.width; x++) {
      _tiles.push([]);
      for (y = 0; y < stage.height; y++) {
        _tiles[x].push(new Tile(type));
      }
    }

    for (x = 0; x < stage.width; x++) {
      for (y = 0; y < stage.height; y++) {
        neighbours = [];
        nesw = {};
        if (_tiles[x][y - 1]) {
          neighbours.push(_tiles[x][y - 1]);
          nesw.north = _tiles[x][y - 1];
        }
        if (_tiles[x + 1] && _tiles[x + 1][y - 1]) {
          neighbours.push(_tiles[x + 1][y - 1]);
        }
        if (_tiles[x + 1] && _tiles[x + 1][y]) {
          neighbours.push(_tiles[x + 1][y]);
          nesw.east = _tiles[x + 1][y];
        }
        if (_tiles[x + 1] && _tiles[x + 1][y + 1]) {
          neighbours.push(_tiles[x + 1][y + 1]);
        }
        if (_tiles[x] && _tiles[x][y + 1]) {
          neighbours.push(_tiles[x][y + 1]);
          nesw.south = _tiles[x][y + 1];
        }
        if (_tiles[x - 1] && _tiles[x - 1][y + 1]) {
          neighbours.push(_tiles[x - 1][y + 1]);
        }
        if (_tiles[x - 1] && _tiles[x - 1][y]) {
          neighbours.push(_tiles[x - 1][y]);
          nesw.west = _tiles[x - 1][y];
        }
        if (_tiles[x - 1] && _tiles[x - 1][y - 1]) {
          neighbours.push(_tiles[x - 1][y - 1]);
        }
        _tiles[x][y].setNeighbours(neighbours);
        _tiles[x][y].nesw = nesw;
      }
    }

    return _tiles;
  };

  /**
   * @desc Master function for generating a dungeon
   *
   * @param {Object} stage - An object with a width key and a height key. Used
   * to determine the size of the dungeon. Must be odd with and height.
   *
   * @returns {Object} - Tile information for the dungeon
   */
  const generate = (stage) => {
    let startDate = Date.now();
    if (stage.width % 2 === 0 || stage.height % 2 === 0) {
      throw new Error('The stage must be odd-sized.');
    }

    bindStage(stage);

    fill('wall');

    _addRooms();

    // Fill in all of the empty space with mazes.
    for (var y = 0; y < stage.height; y++) {
      for (var x = 0; x < stage.width; x++) {
        // Skip the maze generation if the tile is already carved
        if (getTile(x, y).type === 'floor') {
          continue;
        }
        _growMaze(x, y);
      }
    }


    _connectRegions();

    _removeDeadEnds();

    let endDate = Date.now();

    console.log('Dungeon generated in ' + (endDate - startDate) + 'ms');

    return {
      rooms: _rooms,
      tiles: _tiles,
    };
  };

  /**
   * @desc Implementation of the "growing tree" algorithm from here:
   * http://www.astrolog.org/labyrnth/algrithm.htm.
   *
   * @param {Number} startX - The x coordinate to start at
   * @param {Number} startY - The y coordinate to start at
   *
   * @returns {void}
   */
  const _growMaze = (startX, startY) => {
    var cells = [];
    var lastDir;

    if (_tiles[startX][startY].neighbours.filter(x => x.type === 'floor').length > 0) {
      return;
    }

    _startRegion();

    cells.push({x: startX, y: startY });
    let count = 0;
    while (cells.length && count < 500) {
      count++;
      var cell = cells[cells.length - 1];
      var x = cell.x;
      var y = cell.y;

      // See which adjacent cells are open.
      var unmadeCells = [];

      if (
        _canCarve(x, y - 1) &&
        _canCarve(x, y - 2) &&
        _canCarve(x - 1, y - 1) &&
        _canCarve(x - 1, y - 2) &&
        _canCarve(x + 1, y - 1) &&
        _canCarve(x + 1, y - 2)
      ) {
        unmadeCells.push(x + ':' + (y - 1));
      }
      if (
        _canCarve(x + 1, y) &&
        _canCarve(x + 2, y) &&
        _canCarve(x + 1, y - 1) &&
        _canCarve(x + 2, y - 2) &&
        _canCarve(x + 1, y + 1) &&
        _canCarve(x + 2, y + 2)
      ) {
        unmadeCells.push(x + 1 + ':' + y);
      }
      if (
        _canCarve(x, y + 1) &&
        _canCarve(x, y + 2) &&
        _canCarve(x - 1, y + 1) &&
        _canCarve(x - 2, y + 2) &&
        _canCarve(x + 1, y + 1) &&
        _canCarve(x + 2, y + 2)
      ) {
        unmadeCells.push(x + ':' + (y + 1));
      }
      if (
        _canCarve(x - 1, y) &&
        _canCarve(x - 2, y) &&
        _canCarve(x - 1, y - 1) &&
        _canCarve(x - 2, y - 2) &&
        _canCarve(x - 1, y - 1) &&
        _canCarve(x - 2, y - 2)
      ) {
        unmadeCells.push(x - 1 + ':' + y);
      }

      if (unmadeCells.length) {
        // Based on how "windy" passages are, try to prefer carving in the
        // same direction.
        var dir;
        if (unmadeCells.indexOf(lastDir) > -1 && _.random(1, 100) > windingPercent) {
          dir = lastDir;
        } else {
          dir = unmadeCells[_.random(0, unmadeCells.length - 1)];
        }

        let [dirX, dirY] = dir.split(':').map(Number);

        _carve(cell.x, cell.y);
        _carve(dirX, dirY);

        cells.push({ x: dirX, y: dirY });
        lastDir = dir;
      } else {
        // No adjacent uncarved cells.
        cells.pop();

        // This path has ended.
        lastDir = null;
      }
    }
  };

  /**
   * @desc Creates rooms in the dungeon by repeatedly creating random rooms and
   * seeing if they overlap. Rooms that overlap are discarded. This process is
   * repeated until it hits the maximum tries determined by the 'numRoomTries'
   * variable.
   *
   * @returns {void}
   */
  const _addRooms = () => {
    for (var i = 0; i < numRoomTries; i++) {
      // Pick a random room size. The funny math here does two things:
      // - It makes sure rooms are odd-sized to line up with maze.
      // - It avoids creating rooms that are too rectangular: too tall and
      //   narrow or too wide and flat.
      var size = _.random(1, 3 + roomExtraSize) * 2 + 1;
      var rectangularity = _.random(0, 1 + Math.floor(size / 2)) * 2;
      var width = size;
      var height = size;
      if (_oneIn(2)) {
        width += rectangularity;
      } else {
        height += rectangularity;
      }

      var x = _.random(0, Math.floor((stage.width - width) / 2)) * 2 + 1;
      var y = _.random(0, Math.floor((stage.height - height) / 2)) * 2 + 1;

      var room = new Room(x, y, width, height);

      var overlaps = false;

      for (var other of _rooms) {
        if (room.intersects(other)) {
          overlaps = true;
          break;
        }
      }

      if (overlaps) {
        continue;
      }

      _rooms.push(room);

      _startRegion();

      // Convert room tiles to floor
      carveArea(x, y, width, height);
    }
  };

  /**
   * @desc converts an area of tiles to floor type
   *
   * @param {Number} x - The starting x coordinate
   * @param {Number} y - The starting y coordinate
   * @param {Number} width - The width of the area to carve
   * @param {Number} height - The height of the area to carve
   *
   * @returns {void}
   */
  const carveArea = (x, y, width, height) => {
    for (var i = x; i < x + width; i++) {
      for (var j = y; j < y + height; j++) {
        _carve(i, j);
      }
    }
  };

  /**
   * @desc Creates doorways between each generated region of tiles
   *
   * @return {void}
   */
  const _connectRegions = () => {
    let regionConnections = {};
    _tiles.forEach(row => {
      row.forEach(tile => {
        if (tile.type === 'floor') {
          return;
        }

        let tileRegions = _.unique(
          _.values(tile.nesw).map(x => x.region)
          .filter(x => !_.isUndefined(x))
        );
        if (tileRegions.length <= 1) {
          return;
        }

        let key = tileRegions.join('-');
        if (!regionConnections[key]) {
          regionConnections[key] = [];
        }
        regionConnections[key].push(tile);

      });
    });

    _.each(regionConnections, (connections) => {
      let index = _.random(0, connections.length - 1);
      connections[index].type = 'door';
      connections.splice(index, 1);

      // Occasional open up additional connections
      connections.forEach(conn => {
        if (_oneIn(extraConnectorChance)) {
          conn.type = 'door';
        }
      });
    });
  };

  /**
   * @desc Helper function for calculating random chance. The higher the number
   * provided the less likely this value is to return true.
   *
   * @param {Number} num - The ceiling number that could be calculated
   *
   * @returns {Boolean} - True if the function rolled a one
   *
   * @example
   * _oneIn(50); // - Has a 1 in 50 chance of returning true
   */
  const _oneIn = (num) => {
    return _.random(1, num) === 1;
  };

  /**
   * @desc Fills in dead ends in the dungeon with wall tiles
   *
   * @returns {void}
   */
  const _removeDeadEnds = () => {
    var done = false;

    const cycle = () => {
      let done = true;
      _tiles.forEach((row) => {
        row.forEach((tile) => {
          // If it only has one exit, it's a dead end --> fill it in!
          if (tile.type === 'wall') {
            return;
          }
          if (_.values(tile.nesw).filter(t => t.type !== 'wall').length <= 1) {
            tile.type = 'wall';
            done = false;
          }
        });
      });

      return done;
    };

    while (!done) {
      done = true;
      done = cycle();
    }
  };

  /**
   * @desc Checks if a tile at given coordinates can be carved
   *
   * @param {Number} x - The x coordinate to check
   * @param {Number} y - The y coordinate to check
   *
   * @returns {Boolean} - true if the tile can be carved
   */
  const _canCarve = (x, y) => {
    // Must end in bounds.
    if (!_tiles[x] || !_tiles[x][y]) {
      return false;
    }

    // Destination must not be open.
    return getTile(x, y).type !== 'floor';
  };

  /**
   * @desc Increments the current region. Typically called every time a new area
   * starts being carved
   *
   * @returns {Number} - The current region number
   */
  const _startRegion = () => {
    _currentRegion++;
    return _currentRegion;
  };

  /**
   * @desc Changes the Tile at a given coordinate to a provided type. Typically
   * used to change the type to 'floor'
   *
   * @param {Number} x - The x coordinate to change
   * @param {Number} y - The y coordinate to change
   * @param {String} type - The type to change the tile to. Defaults to 'floor'
   *
   * @returns {void}
   */
  const _carve = (x, y, type = 'floor') => {
    setTile(x, y, type);
  };

  return {
    generate,
  };
};

module.exports = Dungeon;
