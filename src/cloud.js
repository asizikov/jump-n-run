class Cloud extends GameObject {
  constructor(x, y, width, height, game) {
    super(x, y, width, height);
    this.game = game;
    this.drift = 8 + Math.random() * 14; // px/s, independent of ground speed
    this.puffs = this._generatePuffs();
  }

  _generatePuffs() {
    const puffs = [];
    const count = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const edge = Math.sin(t * Math.PI);
      const radius = this.height * (0.26 + edge * 0.3 + Math.random() * 0.07);
      puffs.push({ x: this.width * (0.08 + t * 0.84), y: this.height * 0.7 - radius, radius });
    }

    const extras = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < extras; i++) {
      const radius = this.height * (0.14 + Math.random() * 0.18);
      puffs.push({ x: this.width * (0.2 + Math.random() * 0.6), y: this.height * 0.42 - radius, radius });
    }
    return puffs;
  }

  update(dt, game) {
    this.x -= (this.drift + game.speed * 0.03) * dt;
    if (this.x + this.width < 0) {
      this.x = game.width + Math.random() * 100;
      this.y = Math.random() * game.height * 0.3;
      this.puffs = this._generatePuffs();
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const shadow = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.78, 0,
      this.width * 0.5, this.height * 0.78, this.width * 0.46
    );
    shadow.addColorStop(0, 'rgba(140,160,195,0.28)');
    shadow.addColorStop(1, 'rgba(140,160,195,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const p of this.puffs) {
      const g = ctx.createRadialGradient(
        p.x, p.y - p.radius * 0.15, p.radius * 0.05,
        p.x, p.y + p.radius * 0.12, p.radius * 1.1
      );
      g.addColorStop(0, 'rgba(255,255,255,0.96)');
      g.addColorStop(0.45, 'rgba(245,250,255,0.88)');
      g.addColorStop(0.78, 'rgba(225,235,250,0.45)');
      g.addColorStop(1, 'rgba(210,225,248,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
