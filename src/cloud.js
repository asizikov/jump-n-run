class Cloud extends GameObject {
    constructor(x, y, width, height, color = 'white') {
      super(x, y, width, height, color);
      this.circles = this.generateCircles();
    }
  
    generateCircles() {
      // Generate between 3 and 5 random circles inside the cloud
      const circles = [];
      const numCircles = Math.floor(Math.random() * 3) + 3;
  
      for (let i = 0; i < numCircles; i++) {
        const radiusX = this.height / 5;  // Specify your lower radius limit here
        const radiusY = this.height / 3;  // Specify your upper radius limit here
        const radius = radiusX + Math.random() * (radiusY - radiusX);
        const x = Math.random() * (this.width - 2 * radius) + radius;
        const y = Math.random() * (this.height - 2 * radius) + radius;
        circles.push({ x, y, radius });
      }
  
      return circles;
    }
  
    move() {
      // Move the cloud from right to left
      this.x -= 1;
      if (this.x + this.width < 0) {
        // The cloud has moved off the left side of the screen
        // Remove this cloud and generate a new one on the right side of the screen
        this.x = gameEngine.canvas.width;
        this.y = Math.random() * gameEngine.canvas.height * 0.35;
      }
    }
  
    render(ctx) {
      // Render the cloud as a series of circles
      ctx.fillStyle = this.color;
      for (const circle of this.circles) {
        ctx.beginPath();
        ctx.arc(this.x + circle.x, this.y + circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  