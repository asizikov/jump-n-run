class Cloud extends GameObject {
  constructor(x, y, width, height, canvasHeight) {
    super(x, y, width, height, 'white');
    this.canvasHeight = canvasHeight;
    this.puffs = this._generatePuffs();
  }

  _generatePuffs() {
    const puffs = [];
    const count = 4 + Math.floor(Math.random() * 4); // 4–7 main puffs

    // Main row: bell-curve distribution — taller in the middle, smaller at edges
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const edge = Math.sin(t * Math.PI);          // 0 at ends → 1 at centre
      const radius = this.height * (0.26 + edge * 0.3 + Math.random() * 0.07);
      const x = this.width * (0.08 + t * 0.84);
      const y = this.height * 0.7 - radius;        // anchor puffs to a flat base
      puffs.push({ x, y, radius });
    }

    // A few extra puffs on top for lumpy texture
    const extras = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < extras; i++) {
      const x = this.width * (0.2 + Math.random() * 0.6);
      const radius = this.height * (0.14 + Math.random() * 0.18);
      const y = this.height * 0.42 - radius;
      puffs.push({ x, y, radius });
    }

    return puffs;
  }

  move(canvasWidth) {
    this.x -= 0.6;
    if (this.x + this.width < 0) {
      this.x = canvasWidth;
      this.y = Math.random() * this.canvasHeight * 0.35;
      this.puffs = this._generatePuffs();
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // ── Shadow on the underside ──────────────────────────────────────────────
    const shadowGrad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.78, 0,
      this.width * 0.5, this.height * 0.78, this.width * 0.46
    );
    shadowGrad.addColorStop(0,   'rgba(140,160,195,0.28)');
    shadowGrad.addColorStop(0.6, 'rgba(140,160,195,0.10)');
    shadowGrad.addColorStop(1,   'rgba(140,160,195,0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // ── Main body: one soft radial gradient per puff ─────────────────────────
    for (const p of this.puffs) {
      const g = ctx.createRadialGradient(
        p.x, p.y - p.radius * 0.15, p.radius * 0.05,   // bright centre (top)
        p.x, p.y + p.radius * 0.12, p.radius * 1.1     // fades outward
      );
      g.addColorStop(0,    'rgba(255,255,255,0.96)');
      g.addColorStop(0.45, 'rgba(245,250,255,0.88)');
      g.addColorStop(0.78, 'rgba(225,235,250,0.45)');
      g.addColorStop(1,    'rgba(210,225,248,0)');

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.12, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Specular highlight: small bright spot toward upper-left of each puff ─
    for (const p of this.puffs) {
      const hx = p.x - p.radius * 0.22;
      const hy = p.y - p.radius * 0.38;
      const h = ctx.createRadialGradient(hx, hy, 0, hx, hy, p.radius * 0.55);
      h.addColorStop(0,   'rgba(255,255,255,0.55)');
      h.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = h;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

  