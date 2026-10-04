class GameObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  update(_dt, _game) {}

  render(_ctx) {}

  get bounds() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  intersects(other) {
    const a = this.bounds;
    const b = other.bounds;
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
}
