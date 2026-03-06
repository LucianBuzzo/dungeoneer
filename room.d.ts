export type BoundingBox = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};
export type PlainRoom = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export default class Room {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number);
    getBoundingBox(): BoundingBox;
    containsTile(x: number, y: number): boolean;
    intersects(other: {
        getBoundingBox: () => BoundingBox;
    }): boolean;
    toJS(): PlainRoom;
}
