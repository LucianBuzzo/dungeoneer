"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tile {
    constructor(type, x, y) {
        this.type = type;
        this.neighbours = {};
        this.x = x;
        this.y = y;
    }
    setNeighbours(neighbours) {
        this.neighbours = neighbours;
        return this;
    }
    toJS() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            ...(this.regionId !== undefined ? { regionId: this.regionId } : {}),
            ...(this.regionTag !== undefined ? { regionTag: this.regionTag } : {})
        };
    }
}
exports.default = Tile;
