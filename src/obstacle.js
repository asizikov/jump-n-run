// Obstacles are drawn in "unit" coordinates (origin at bottom-centre) and scaled by game.unit.
const OBSTACLE_TYPES = {
  rock: { w: 46, h: 34 },
  crate: { w: 42, h: 42 },
  cone: { w: 28, h: 46 },
};

class Obstacle extends GameObject {
  constructor(type, game) {
    const def = OBSTACLE_TYPES[type];
    const u = game.unit;
    super(game.width + def.w * u, game.floorY - def.h * u, def.w * u, def.h * u);
    this.type = type;
    this.unit = u;
  }

  update(dt, game) {
    this.x -= game.speed * dt;
  }

  get offscreen() {
    return this.x + this.width < -20;
  }

  get bounds() {
    const inset = 0.14;
    return {
      x: this.x + this.width * inset,
      y: this.y + this.height * inset,
      w: this.width * (1 - inset * 2),
      h: this.height * (1 - inset),
    };
  }

  render(ctx) {
    const u = this.unit;
    const def = OBSTACLE_TYPES[this.type];
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height);
    ctx.scale(u, u);

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, def.w * 0.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'rock') this._rock(ctx, def);
    else if (this.type === 'crate') this._crate(ctx, def);
    else this._cone(ctx, def);
    ctx.restore();
  }

  _rock(ctx, { w, h }) {
    ctx.fillStyle = '#7d8590';
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w * 0.42, -h * 0.6);
    ctx.lineTo(-w * 0.1, -h);
    ctx.lineTo(w * 0.28, -h * 0.85);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a3abb5';
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.6);
    ctx.lineTo(-w * 0.1, -h);
    ctx.lineTo(w * 0.28, -h * 0.85);
    ctx.lineTo(0, -h * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  _crate(ctx, { w, h }) {
    ctx.fillStyle = '#b9772f';
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeStyle = '#6e4217';
    ctx.lineWidth = 4;
    ctx.strokeRect(-w / 2 + 2, -h + 2, w - 4, h - 4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 3, -h + 3);
    ctx.lineTo(w / 2 - 3, -3);
    ctx.moveTo(w / 2 - 3, -h + 3);
    ctx.lineTo(-w / 2 + 3, -3);
    ctx.stroke();
  }

  _cone(ctx, { w, h }) {
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(-w / 2, -5, w, 5);
    ctx.fillStyle = '#ff6a1f';
    ctx.beginPath();
    ctx.moveTo(-w * 0.38, -5);
    ctx.lineTo(-w * 0.08, -h);
    ctx.lineTo(w * 0.08, -h);
    ctx.lineTo(w * 0.38, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-w * 0.26, -h * 0.4);
    ctx.lineTo(-w * 0.17, -h * 0.65);
    ctx.lineTo(w * 0.17, -h * 0.65);
    ctx.lineTo(w * 0.26, -h * 0.4);
    ctx.closePath();
    ctx.fill();
  }
}
