// Cyclist drawn in "unit" coordinates: origin at ground contact, +x forward, -y up.
const GRAVITY = 2600;
const JUMP_VELOCITY = 950;

class Character extends GameObject {
  constructor(game) {
    super(0, 0, 60, 96);
    this.game = game;
    this.lift = 0;      // height above the floor, in px
    this.vy = 0;
    this.wheelAngle = 0;
    this.crashed = false;
    this.layout();
  }

  layout() {
    this.unit = this.game.unit;
    this.width = 60 * this.unit;
    this.height = 96 * this.unit;
    this.x = this.game.width * 0.2;
  }

  get onGround() {
    return this.lift <= 0;
  }

  reset() {
    this.lift = 0;
    this.vy = 0;
    this.crashed = false;
  }

  jump() {
    if (this.onGround && !this.crashed) this.vy = JUMP_VELOCITY * this.unit;
  }

  update(dt, game) {
    if (!this.onGround || this.vy > 0) {
      this.vy -= GRAVITY * this.unit * dt;
      this.lift += this.vy * dt;
      if (this.lift <= 0) {
        this.lift = 0;
        this.vy = 0;
      }
    }
    this.wheelAngle += (game.speed * dt) / (20 * this.unit);
    this.y = game.floorY - this.lift - this.height;
  }

  get bounds() {
    return { x: this.x + this.width * 0.1, y: this.y + 8 * this.unit, w: this.width * 0.8, h: this.height - 8 * this.unit };
  }

  // Two-bone IK; `dir` picks which side the joint bends toward.
  static ik(ax, ay, bx, by, l1, l2, dir) {
    const dx = bx - ax, dy = by - ay;
    const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    const ux = dx / (Math.hypot(dx, dy) || 1), uy = dy / (Math.hypot(dx, dy) || 1);
    return { x: ax + ux * a - uy * h * dir, y: ay + uy * a + ux * h * dir };
  }

  render(ctx) {
    const u = this.unit;
    const cx = this.x + this.width / 2;
    const floor = this.game.floorY;

    // Ground shadow shrinks as the rider rises
    const shrink = 1 / (1 + this.lift / (120 * u));
    ctx.fillStyle = `rgba(0,0,0,${0.25 * shrink})`;
    ctx.beginPath();
    ctx.ellipse(cx, floor, 44 * u * shrink, 5 * u * shrink, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, floor - this.lift);
    ctx.scale(u, u);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.crashed) {
      ctx.rotate(-0.25);
    } else {
      // Tilt: nose up while rising, down while falling
      ctx.rotate(Math.max(-0.25, Math.min(0.25, -this.vy / 4000)));
    }

    const rear = { x: -30, y: -20 }, front = { x: 30, y: -20 };
    const bb = { x: -2, y: -22 };
    const seat = { x: -11, y: -58 };
    const head = { x: 22, y: -58 };

    this._wheel(ctx, rear.x, rear.y);
    this._wheel(ctx, front.x, front.y);

    // Frame
    ctx.strokeStyle = '#ff5a36';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rear.x, rear.y); ctx.lineTo(bb.x, bb.y); ctx.lineTo(head.x, head.y);
    ctx.lineTo(seat.x, seat.y); ctx.lineTo(rear.x, rear.y);
    ctx.moveTo(bb.x, bb.y); ctx.lineTo(seat.x, seat.y);
    ctx.moveTo(head.x, head.y); ctx.lineTo(front.x, front.y);
    ctx.stroke();

    // Saddle and handlebar
    ctx.strokeStyle = '#1b1b24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(seat.x - 8, seat.y - 4); ctx.lineTo(seat.x + 6, seat.y - 4);
    ctx.moveTo(head.x, head.y); ctx.lineTo(head.x - 2, head.y - 8); ctx.lineTo(head.x + 8, head.y - 8);
    ctx.stroke();

    // Rider
    const hip = { x: seat.x + 1, y: seat.y - 8 };
    const shoulder = { x: hip.x + 20, y: hip.y - 34 };
    const hand = { x: head.x + 7, y: head.y - 8 };
    const crank = this.wheelAngle * 0.8;

    const legs = [crank, crank + Math.PI].map((a) => {
      const foot = { x: bb.x + Math.cos(a) * 10, y: bb.y + Math.sin(a) * 10 };
      return { foot, knee: Character.ik(hip.x, hip.y, foot.x, foot.y, 28, 30, -1) };
    });

    // Far leg first so the near leg overlaps it
    const draw = (leg, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y); ctx.lineTo(leg.knee.x, leg.knee.y); ctx.lineTo(leg.foot.x, leg.foot.y);
      ctx.stroke();
      ctx.strokeStyle = '#1b1b24';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(leg.foot.x - 4, leg.foot.y + 1); ctx.lineTo(leg.foot.x + 5, leg.foot.y + 1);
      ctx.stroke();
    };
    draw(legs[1], '#1f3a6b');

    // Torso
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(shoulder.x, shoulder.y);
    ctx.stroke();

    // Arm
    const elbow = Character.ik(shoulder.x, shoulder.y, hand.x, hand.y, 20, 20, 1);
    ctx.strokeStyle = '#f2b38c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(elbow.x, elbow.y); ctx.lineTo(hand.x, hand.y);
    ctx.stroke();

    draw(legs[0], '#2c4f8f');

    // Head + helmet
    const hx = shoulder.x + 6, hy = shoulder.y - 12;
    ctx.fillStyle = '#f2b38c';
    ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8242b';
    ctx.beginPath(); ctx.arc(hx - 1, hy - 1, 9.5, Math.PI * 1.02, Math.PI * 2.05); ctx.fill();
    ctx.fillStyle = '#1b1b24';
    ctx.beginPath(); ctx.arc(hx + 4, hy, 1.4, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  _wheel(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#1b1b24';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#9aa4b2';
    ctx.lineWidth = 1;
    ctx.rotate(this.wheelAngle);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
    }
    ctx.stroke();
    ctx.restore();
  }
}
