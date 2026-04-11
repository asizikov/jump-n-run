// Define a GameEngine class to encapsulate the game logic
class GameEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      this.ctx = this.canvas.getContext('2d');
      this.objects = [];
      this.dashOffset = 0;
      this.grassTufts = [];
      this.bgObjects = [];
    }

    start() {
      this.generateClouds();
      this.generateGrass();
      this.generateBgObjects();
      setInterval(() => {
        this.update();
        this.render();
      }, 16);
    }

    // ── Background (distant fields) ──────────────────────────────────────────

    _bgLayout() {
      const groundY  = this.canvas.height * 0.9;
      const bgHeight = this.canvas.height * 0.28;
      return { groundY, bgHeight, bgTopY: groundY - bgHeight };
    }

    generateBgObjects() {
      for (let i = 0; i < 40; i++) {
        this.bgObjects.push(this._newBgObject(Math.random() * this.canvas.width));
      }
      // Pre-sort so far objects draw first (painter's algorithm)
      this.bgObjects.sort((a, b) => a.baseY - b.baseY);
    }

    _newBgObject(x) {
      const { groundY, bgHeight, bgTopY } = this._bgLayout();
      // t=0 → top of strip (far away, small), t=1 → bottom of strip (close, large)
      const t = Math.random();
      const baseY = bgTopY + t * bgHeight;
      const kind = Math.random() < 0.45 ? 'tree' : 'bush';

      // Quadratic scaling: near objects are much larger than far ones
      const minSize = kind === 'tree' ? 14 : 7;
      const maxSize = kind === 'tree' ? 145 : 45;
      const size = minSize + t * t * (maxSize - minSize);

      // Near objects move faster (stronger parallax), far objects barely move
      const speed = 0.2 + t * t * 2.2;

      return { kind, x, baseY, size, speed, t };
    }

    _renderBgObject(ctx, obj) {
      // Atmospheric fade: far objects are more muted/blue-tinted
      const fade = obj.t; // 0=far(muted), 1=near(vivid)

      if (obj.kind === 'tree') {
        const trunkW = Math.max(2, obj.size * 0.15);
        const trunkH = obj.size * 0.5;
        const canopyR = obj.size * 0.44;
        const trunkX  = obj.x - trunkW / 2;
        const trunkY  = obj.baseY - trunkH;

        // Trunk — desaturate toward grey-brown for distant trees
        const trunkL = Math.round(35 + (1 - fade) * 30);
        ctx.fillStyle = `hsl(25,${Math.round(40 * fade)}%,${trunkL}%)`;
        ctx.fillRect(trunkX, trunkY, trunkW, trunkH);

        // Canopy layers — shift toward cool grey-green for distant trees
        const sat  = Math.round(35 + fade * 30);
        const lite = Math.round(22 + (1 - fade) * 18);
        ctx.fillStyle = `hsl(110,${sat}%,${lite}%)`;
        ctx.beginPath();
        ctx.arc(obj.x, trunkY - canopyR * 0.55, canopyR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsl(115,${sat + 8}%,${lite + 6}%)`;
        ctx.beginPath();
        ctx.arc(obj.x - canopyR * 0.35, trunkY - canopyR * 0.3, canopyR * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obj.x + canopyR * 0.35, trunkY - canopyR * 0.2, canopyR * 0.68, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const r   = obj.size * 0.52;
        const sat  = Math.round(30 + fade * 32);
        const lite = Math.round(24 + (1 - fade) * 16);
        ctx.fillStyle = `hsl(112,${sat}%,${lite}%)`;
        ctx.beginPath();
        ctx.arc(obj.x, obj.baseY - r * 0.6, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsl(118,${sat + 6}%,${lite + 5}%)`;
        ctx.beginPath();
        ctx.arc(obj.x - r * 0.62, obj.baseY - r * 0.35, r * 0.76, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obj.x + r * 0.62, obj.baseY - r * 0.3, r * 0.72, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    renderBackground() {
      const { groundY, bgHeight, bgTopY } = this._bgLayout();
      const ctx = this.ctx;

      // Distant field strip
      ctx.fillStyle = '#7a9e5f';
      ctx.fillRect(0, bgTopY, this.canvas.width, bgHeight);

      // Atmospheric haze: semi-transparent sky gradient fades at the top
      const grad = ctx.createLinearGradient(0, bgTopY, 0, groundY);
      grad.addColorStop(0, 'rgba(173,216,230,0.55)');
      grad.addColorStop(0.6, 'rgba(173,216,230,0.1)');
      grad.addColorStop(1, 'rgba(173,216,230,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, bgTopY, this.canvas.width, bgHeight);

      // Clip bg objects to the strip
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, bgTopY, this.canvas.width, bgHeight + 2);
      ctx.clip();

      // Already sorted far→near; just render in order
      for (const obj of this.bgObjects) {
        this._renderBgObject(ctx, obj);
      }

      ctx.restore();
    }

    // ── Foreground ground ────────────────────────────────────────────────────

    generateGrass() {
      const groundY = this.canvas.height * 0.9;
      const fieldHeight = this.canvas.height - groundY;
      for (let i = 0; i < 40; i++) {
        this.grassTufts.push(this._newGrassTuft(
          Math.random() * this.canvas.width,
          groundY,
          fieldHeight
        ));
      }
    }

    _newGrassTuft(x, groundY, fieldHeight) {
      return {
        x,
        y: groundY + 4 + Math.random() * (fieldHeight * 0.5),
        size: 6 + Math.random() * 10,
        speed: 1.5 + Math.random() * 1.5,
        blades: Math.floor(3 + Math.random() * 3),
      };
    }

    update() {
      this.dashOffset = (this.dashOffset + 4) % 70;

      // Animate background objects (slow parallax, perspective-scaled speed)
      for (const obj of this.bgObjects) {
        obj.x -= obj.speed;
        if (obj.x + obj.size * 2 < 0) {
          obj.x = this.canvas.width + obj.size * 2;
          // Respawn at same depth row (keep t, recompute size/speed variance slightly)
          const minSize = obj.kind === 'tree' ? 14 : 7;
          const maxSize = obj.kind === 'tree' ? 145 : 45;
          obj.size = minSize + obj.t * obj.t * (maxSize - minSize) * (0.85 + Math.random() * 0.3);
        }
      }

      // Animate foreground grass tufts
      const groundY = this.canvas.height * 0.9;
      const fieldHeight = this.canvas.height - groundY;
      for (const tuft of this.grassTufts) {
        tuft.x -= tuft.speed;
        if (tuft.x + tuft.size < 0) {
          tuft.x = this.canvas.width + tuft.size;
          tuft.y = groundY + 4 + Math.random() * (fieldHeight * 0.5);
          tuft.size = 6 + Math.random() * 10;
          tuft.speed = 1.5 + Math.random() * 1.5;
        }
      }

      for (const obj of this.objects) {
        obj.move(this.canvas.width);
      }
    }

    renderGround() {
      const groundY = this.canvas.height * 0.9;
      const asphaltHeight = 18;
      const ctx = this.ctx;

      // Green field
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);

      // Grass tufts
      ctx.fillStyle = '#2e7d32';
      for (const tuft of this.grassTufts) {
        const bladeAngleStep = Math.PI / (tuft.blades + 1);
        for (let b = 0; b < tuft.blades; b++) {
          const angle = -Math.PI + bladeAngleStep * (b + 1);
          const tipX = tuft.x + Math.cos(angle) * tuft.size;
          const tipY = tuft.y + Math.sin(angle) * tuft.size;
          ctx.beginPath();
          ctx.moveTo(tuft.x - 2, tuft.y);
          ctx.lineTo(tuft.x + 2, tuft.y);
          ctx.lineTo(tipX, tipY);
          ctx.fill();
        }
      }

      // Black asphalt strip
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, groundY, this.canvas.width, asphaltHeight);

      // Animated white dashed centre line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([40, 30]);
      ctx.lineDashOffset = this.dashOffset;
      ctx.beginPath();
      ctx.moveTo(0, groundY + asphaltHeight / 2);
      ctx.lineTo(this.canvas.width, groundY + asphaltHeight / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }

    render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.renderBackground(); // distant fields + trees/bushes (slow)
      this.renderGround();     // asphalt + foreground grass (fast)
      for (const obj of this.objects) {
        obj.render(this.ctx);
      }
    }

    addObject(obj) {
      this.objects.push(obj);
    }

    generateClouds() {
      for (let i = 0; i < 3; i++) {
        const width = this.canvas.width * 0.25;
        const height = this.canvas.height * 0.15;
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height * 0.35;
        const cloud = new Cloud(x, y, width, height, this.canvas.height);
        this.addObject(cloud);
      }
    }
  }
    
  // Create an instance of the game engine and start the game
  const gameEngine = new GameEngine('gameCanvas');
  gameEngine.start();
  