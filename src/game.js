const IDLE_SPEED = 180;
const START_SPEED = 360;
const MAX_SPEED = 820;

class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.hud = {
      score: document.getElementById('score'),
      best: document.getElementById('best'),
      panel: document.getElementById('panel'),
      title: document.getElementById('panelTitle'),
      text: document.getElementById('panelText'),
    };

    this.state = 'ready'; // ready | playing | over
    this.speed = IDLE_SPEED;
    this.distance = 0;
    this.dashOffset = 0;
    this.best = Number(localStorage.getItem('jumpnrun.best')) || 0;
    this.clouds = [];
    this.obstacles = [];
    this.bgObjects = [];
    this.grassTufts = [];
    this.nextSpawn = 0;
    this.lastTime = 0;
    this.shake = 0;

    this.resize();
    this.character = new Character(this);
    this.generateClouds();
    this.hud.best.textContent = this.best;

    window.addEventListener('resize', () => this.resize(true));
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        if (!e.repeat) this.action();
      }
    });
    this.canvas.addEventListener('pointerdown', () => this.action());
  }

  start() {
    requestAnimationFrame((t) => this.frame(t));
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  resize(rebuild = false) {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.unit = Math.max(0.6, Math.min(1.5, this.height / 650));
    this.groundY = this.height * 0.8;
    this.roadH = 30 * this.unit;
    this.floorY = this.groundY + this.roadH * 0.7;

    this.generateBgObjects();
    this.generateGrass();
    if (rebuild && this.character) {
      this.character.layout();
      this.obstacles = [];
      this.clouds.forEach((c) => { c.y = Math.min(c.y, this.height * 0.3); });
    }
  }

  // ── Game flow ─────────────────────────────────────────────────────────────

  action() {
    if (this.state === 'ready') this.begin();
    else if (this.state === 'over') {
      if (performance.now() - this.overAt > 400) this.begin();
    } else this.character.jump();
  }

  begin() {
    this.state = 'playing';
    this.speed = START_SPEED;
    this.distance = 0;
    this.obstacles = [];
    this.nextSpawn = 900;
    this.character.reset();
    this.hud.panel.classList.add('hidden');
    this.character.jump();
  }

  gameOver() {
    this.state = 'over';
    this.overAt = performance.now();
    this.character.crashed = true;
    this.shake = 0.3;
    const score = this.score;
    if (score > this.best) {
      this.best = score;
      localStorage.setItem('jumpnrun.best', String(score));
      this.hud.best.textContent = score;
      this.hud.title.textContent = 'New best!';
    } else {
      this.hud.title.textContent = 'Crashed!';
    }
    this.hud.text.textContent = `You rode ${score} points. Press jump to try again.`;
    this.hud.panel.classList.remove('hidden');
  }

  get score() {
    return Math.floor(this.distance / 40);
  }

  // ── Loop ──────────────────────────────────────────────────────────────────

  frame(time) {
    const dt = Math.min(0.05, (time - (this.lastTime || time)) / 1000);
    this.lastTime = time;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt) {
    if (this.state === 'playing') {
      this.speed = Math.min(MAX_SPEED, this.speed + 6 * dt);
      this.distance += this.speed * dt;
      this.hud.score.textContent = this.score;
    } else if (this.state === 'over') {
      this.speed = Math.max(0, this.speed - 1400 * dt);
    } else {
      this.speed = IDLE_SPEED;
    }
    this.shake = Math.max(0, this.shake - dt);

    this.dashOffset = (this.dashOffset + this.speed * dt) % 70;
    this.updateScenery(dt);
    this.clouds.forEach((c) => c.update(dt, this));
    this.character.update(dt, this);

    if (this.state === 'playing') {
      this.nextSpawn -= this.speed * dt;
      if (this.nextSpawn <= 0) this.spawnObstacle();
      for (const o of this.obstacles) {
        o.update(dt, this);
        if (this.character.intersects(o)) this.gameOver();
      }
      this.obstacles = this.obstacles.filter((o) => !o.offscreen);
    }
  }

  spawnObstacle() {
    const types = Object.keys(OBSTACLE_TYPES);
    this.obstacles.push(new Obstacle(types[Math.floor(Math.random() * types.length)], this));
    // Gap always leaves room for a full jump arc at the current speed
    const airtime = (2 * JUMP_VELOCITY) / GRAVITY;
    this.nextSpawn = this.speed * (airtime + 0.25) + Math.random() * this.speed * 0.9;
  }

  // ── Scenery ───────────────────────────────────────────────────────────────

  generateClouds() {
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const width = this.width * (0.16 + Math.random() * 0.12);
      this.clouds.push(new Cloud(
        Math.random() * this.width,
        Math.random() * this.height * 0.28,
        width,
        width * 0.45,
        this
      ));
    }
  }

  get stripLayout() {
    const bgHeight = this.height * 0.2;
    return { bgHeight, bgTopY: this.groundY - bgHeight };
  }

  generateBgObjects() {
    this.bgObjects = [];
    const count = Math.round(this.width / 40);
    for (let i = 0; i < count; i++) this.bgObjects.push(this._newBgObject(Math.random() * this.width));
    this.bgObjects.sort((a, b) => a.baseY - b.baseY);
  }

  _newBgObject(x) {
    const { bgHeight, bgTopY } = this.stripLayout;
    const t = Math.random();
    const kind = Math.random() < 0.45 ? 'tree' : 'bush';
    const min = kind === 'tree' ? 14 : 7;
    const max = kind === 'tree' ? 120 : 40;
    return {
      kind, x, t,
      baseY: bgTopY + t * bgHeight,
      size: (min + t * t * (max - min)) * (this.unit * 0.9 + 0.1),
      parallax: 0.04 + t * t * 0.5,
    };
  }

  generateGrass() {
    this.grassTufts = [];
    const fieldH = this.height - this.groundY - this.roadH;
    for (let i = 0; i < Math.round(this.width / 35); i++) {
      this.grassTufts.push({
        x: Math.random() * this.width,
        y: this.groundY + this.roadH + 6 + Math.random() * Math.max(fieldH - 10, 1),
        size: (6 + Math.random() * 10) * this.unit,
        blades: 3 + Math.floor(Math.random() * 3),
      });
    }
  }

  updateScenery(dt) {
    for (const o of this.bgObjects) {
      o.x -= this.speed * o.parallax * dt;
      if (o.x + o.size * 2 < 0) {
        o.x = this.width + o.size * 2 + Math.random() * 60;
      }
    }
    for (const t of this.grassTufts) {
      t.x -= this.speed * 1.0 * dt;
      if (t.x + t.size < 0) t.x = this.width + t.size;
    }
    this.hillOffset = ((this.hillOffset || 0) + this.speed * 0.02 * dt);
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  render() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) {
      const m = this.shake * 30;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    this.renderSky();
    this.clouds.forEach((c) => c.render(ctx));
    this.renderHills();
    this.renderBackground();
    this.renderGround();
    this.obstacles.forEach((o) => o.render(ctx));
    this.character.render(ctx);
    ctx.restore();
  }

  renderSky() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.groundY);
    g.addColorStop(0, '#4aa8ec');
    g.addColorStop(0.7, '#a8dcf7');
    g.addColorStop(1, '#fdf1d0');
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, this.width + 40, this.height + 40);

    const sx = this.width * 0.82, sy = this.height * 0.16, sr = 46 * this.unit;
    const glow = ctx.createRadialGradient(sx, sy, sr * 0.3, sx, sy, sr * 3.5);
    glow.addColorStop(0, 'rgba(255,244,190,0.9)');
    glow.addColorStop(1, 'rgba(255,244,190,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - sr * 4, sy - sr * 4, sr * 8, sr * 8);
    ctx.fillStyle = '#fff6c9';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  renderHills() {
    const ctx = this.ctx;
    const layers = [
      { color: '#9cc7d8', amp: 0.09, freq: 0.0028, speed: 1, base: 0.3 },
      { color: '#7fb6a4', amp: 0.06, freq: 0.0045, speed: 2.5, base: 0.15 },
    ];
    const { bgTopY } = this.stripLayout;
    for (const l of layers) {
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(0, this.groundY);
      const shift = (this.hillOffset || 0) * l.speed * 10;
      for (let x = 0; x <= this.width + 8; x += 8) {
        const y = bgTopY - this.height * l.base * 0.25
          - Math.sin((x + shift) * l.freq) * this.height * l.amp * 0.5
          - Math.sin((x + shift) * l.freq * 2.3 + 1) * this.height * l.amp * 0.2;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(this.width, this.groundY);
      ctx.closePath();
      ctx.fill();
    }
  }

  renderBackground() {
    const ctx = this.ctx;
    const { bgHeight, bgTopY } = this.stripLayout;
    ctx.fillStyle = '#7a9e5f';
    ctx.fillRect(-20, bgTopY, this.width + 40, bgHeight + 2);

    const haze = ctx.createLinearGradient(0, bgTopY, 0, this.groundY);
    haze.addColorStop(0, 'rgba(173,216,230,0.55)');
    haze.addColorStop(1, 'rgba(173,216,230,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(-20, bgTopY, this.width + 40, bgHeight);

    for (const o of this.bgObjects) this._renderBgObject(ctx, o);
  }

  _renderBgObject(ctx, o) {
    const fade = o.t;
    if (o.kind === 'tree') {
      const trunkW = Math.max(2, o.size * 0.15);
      const trunkH = o.size * 0.5;
      const canopyR = o.size * 0.44;
      const trunkY = o.baseY - trunkH;
      ctx.fillStyle = `hsl(25,${Math.round(40 * fade)}%,${Math.round(35 + (1 - fade) * 30)}%)`;
      ctx.fillRect(o.x - trunkW / 2, trunkY, trunkW, trunkH);
      const sat = Math.round(35 + fade * 30), lite = Math.round(22 + (1 - fade) * 18);
      ctx.fillStyle = `hsl(110,${sat}%,${lite}%)`;
      this._circle(ctx, o.x, trunkY - canopyR * 0.55, canopyR);
      ctx.fillStyle = `hsl(115,${sat + 8}%,${lite + 6}%)`;
      this._circle(ctx, o.x - canopyR * 0.35, trunkY - canopyR * 0.3, canopyR * 0.72);
      this._circle(ctx, o.x + canopyR * 0.35, trunkY - canopyR * 0.2, canopyR * 0.68);
    } else {
      const r = o.size * 0.52;
      const sat = Math.round(30 + fade * 32), lite = Math.round(24 + (1 - fade) * 16);
      ctx.fillStyle = `hsl(112,${sat}%,${lite}%)`;
      this._circle(ctx, o.x, o.baseY - r * 0.6, r);
      ctx.fillStyle = `hsl(118,${sat + 6}%,${lite + 5}%)`;
      this._circle(ctx, o.x - r * 0.62, o.baseY - r * 0.35, r * 0.76);
      this._circle(ctx, o.x + r * 0.62, o.baseY - r * 0.3, r * 0.72);
    }
  }

  _circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  renderGround() {
    const ctx = this.ctx;
    const { groundY, roadH } = this;

    const field = ctx.createLinearGradient(0, groundY, 0, this.height);
    field.addColorStop(0, '#5cb860');
    field.addColorStop(1, '#3d9442');
    ctx.fillStyle = field;
    ctx.fillRect(-20, groundY, this.width + 40, this.height - groundY + 20);

    ctx.fillStyle = '#2e7d32';
    for (const t of this.grassTufts) {
      const step = Math.PI / (t.blades + 1);
      for (let b = 0; b < t.blades; b++) {
        const a = -Math.PI + step * (b + 1);
        ctx.beginPath();
        ctx.moveTo(t.x - 2, t.y);
        ctx.lineTo(t.x + 2, t.y);
        ctx.lineTo(t.x + Math.cos(a) * t.size, t.y + Math.sin(a) * t.size);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#2a2d34';
    ctx.fillRect(-20, groundY, this.width + 40, roadH);
    ctx.fillStyle = '#c9ccd2';
    ctx.fillRect(-20, groundY, this.width + 40, 2);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([40, 30]);
    ctx.lineDashOffset = this.dashOffset;
    ctx.beginPath();
    ctx.moveTo(0, groundY + roadH / 2);
    ctx.lineTo(this.width, groundY + roadH / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
