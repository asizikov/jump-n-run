class Character extends GameObject {
  constructor(x, y, width, height) {
    super(x, y, width, height, 'red');
    this.frameCount = 0;
  }

  move() {
    this.frameCount++;
  }

  render(ctx) {
    const cx = this.x + this.width / 2;  // horizontal center of the character block
    const scale = this.width / 80;       // scale factor based on width (designed at 80px wide)

    // --- Bike dimensions ---
    const wheelRadius = 18 * scale;
    const bikeY = this.y + this.height - wheelRadius; // axle height

    const rearWheelX  = cx - 20 * scale;
    const frontWheelX = cx + 20 * scale;
    const frameTopX   = cx - 5 * scale;
    const frameTopY   = bikeY - 28 * scale;  // seat/handlebar height

    // Rear wheel (red)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(rearWheelX, bikeY, wheelRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Front wheel (blue)
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.arc(frontWheelX, bikeY, wheelRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Bike frame — triangle: rear axle → seat → front axle
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.moveTo(rearWheelX, bikeY);
    ctx.lineTo(frameTopX, frameTopY);
    ctx.lineTo(frontWheelX, bikeY);
    ctx.stroke();

    // Chain stay: rear axle → bottom bracket
    ctx.beginPath();
    ctx.moveTo(rearWheelX, bikeY);
    ctx.lineTo(frameTopX + 4 * scale, frameTopY + 8 * scale);
    ctx.stroke();

    // Handlebar stem + bar
    const handlebarX = frontWheelX - 4 * scale;
    const handlebarY = frameTopY;
    ctx.beginPath();
    ctx.moveTo(handlebarX, bikeY - 5 * scale);
    ctx.lineTo(handlebarX, handlebarY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(handlebarX - 5 * scale, handlebarY - 3 * scale);
    ctx.lineTo(handlebarX + 5 * scale, handlebarY + 3 * scale);
    ctx.stroke();

    // Seat post + seat
    ctx.beginPath();
    ctx.moveTo(frameTopX, frameTopY + 8 * scale);
    ctx.lineTo(frameTopX, frameTopY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(frameTopX - 7 * scale, frameTopY);
    ctx.lineTo(frameTopX + 7 * scale, frameTopY);
    ctx.stroke();

    // --- Rider ---
    const seatX = frameTopX;
    const seatY = frameTopY;

    // Pedal animation: legs cycle using frameCount
    const pedalAngle = (this.frameCount * 0.08) % (Math.PI * 2);
    const pedalR = 12 * scale;
    const bbX = frameTopX + 4 * scale;
    const bbY = frameTopY + 8 * scale; // bottom bracket

    const leftFootX  = bbX + Math.cos(pedalAngle) * pedalR;
    const leftFootY  = bbY + Math.sin(pedalAngle) * pedalR;
    const rightFootX = bbX + Math.cos(pedalAngle + Math.PI) * pedalR;
    const rightFootY = bbY + Math.sin(pedalAngle + Math.PI) * pedalR;

    const hipX = seatX;
    const hipY = seatY + 2 * scale;

    // Left leg (thigh + shin)
    const leftKneeX = (hipX + leftFootX) / 2 - 4 * scale;
    const leftKneeY = (hipY + leftFootY) / 2 + 4 * scale;
    ctx.strokeStyle = '#3a3a8c';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(leftKneeX, leftKneeY);
    ctx.lineTo(leftFootX, leftFootY);
    ctx.stroke();

    // Right leg
    const rightKneeX = (hipX + rightFootX) / 2 + 2 * scale;
    const rightKneeY = (hipY + rightFootY) / 2 + 2 * scale;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(rightKneeX, rightKneeY);
    ctx.lineTo(rightFootX, rightFootY);
    ctx.stroke();

    // Torso (leaning forward)
    const shoulderX = seatX - 8 * scale;
    const shoulderY = seatY - 18 * scale;
    ctx.strokeStyle = '#e07b39';
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.stroke();

    // Arms reaching to handlebar
    ctx.strokeStyle = '#e07b39';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(handlebarX, handlebarY);
    ctx.stroke();

    // Head (helmet)
    const headX = shoulderX - 2 * scale;
    const headY = shoulderY - 9 * scale;
    const headR = 7 * scale;
    ctx.fillStyle = 'pink';
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.ellipse(headX, headY - headR * 0.3, headR * 1.1, headR * 0.7, -0.2, Math.PI, 0);
    ctx.fill();
  }
}
