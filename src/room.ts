export type BoundingBox = {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type PlainRoom = {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class Room {
  x: number
  y: number
  width: number
  height: number

  constructor (x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  getBoundingBox (): BoundingBox {
    return {
      top: this.y,
      right: this.x + this.width - 1,
      bottom: this.y + this.height - 1,
      left: this.x
    }
  }

  containsTile (x: number, y: number): boolean {
    const boundingBox = this.getBoundingBox()
    return !(
      x < boundingBox.left ||
      x > boundingBox.right ||
      y < boundingBox.top ||
      y > boundingBox.bottom
    )
  }

  intersects (other: { getBoundingBox: () => BoundingBox }): boolean {
    if (!other.getBoundingBox) {
      throw new Error('Given entity has no method getBoundingBox')
    }

    const r1 = this.getBoundingBox()
    const r2 = other.getBoundingBox()

    return !(r2.left > r1.right ||
      r2.right < r1.left ||
      r2.top > r1.bottom ||
      r2.bottom < r1.top)
  }

  toJS (): PlainRoom {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }
}
