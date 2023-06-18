// Define a GameEngine class to encapsulate the game logic
class GameEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      this.ctx = this.canvas.getContext('2d');
      this.objects = []; // Array to store game objects
      // Initialize other properties as needed
    }
  
    start() {
      this.generateClouds();
      // Start the game loop
      setInterval(() => {
        this.update();
        this.render();
      }, 16); // Run at approximately 60 frames per second
    }
  
    update() {
      // Update game object positions and perform any necessary calculations
      for (const obj of this.objects) {
        obj.move();
      }
    }
  
    render() {
      // Clear the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
      // Render game objects
      for (const obj of this.objects) {
        obj.render(this.ctx);
      }
    }
  
    addObject(obj) {
      // Add a game object to the objects array
      this.objects.push(obj);
    }

    generateClouds() {
        // Generate 3 clouds initially
        for (let i = 0; i < 3; i++) {
          const width = this.canvas.width * 0.25;
          const height = this.canvas.height * 0.15;
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height * 0.35; // Position the cloud in the top 35% of the screen
          const cloud = new Cloud(x, y, width, height);
          this.addObject(cloud);
        }
      }
  }
    
  class Character extends GameObject {
    constructor(x, y, width, height) {
      super(x, y, width, height, 'red');
      this.shoeColor = ['black', 'darkgrey']; // Array to store shoe colors
      this.frameCount = 0; // Counter to manage shoe swapping animation
    }
  
    render(ctx) {
      // Render the character's body as a red rectangle
      // ctx.fillStyle = this.color;
      // ctx.fillRect(this.x, this.y, this.width, this.height);
    
      // Render the character's head as a pink circle
      const headRadius = this.width / 2;
      ctx.fillStyle = 'pink';
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y - headRadius, headRadius, 0, Math.PI * 2);
      ctx.fill();
    
      // Render the character's shoes
      const shoeWidth = this.width / 3;
      const shoeHeight = this.height / 4;
      for (let i = 0; i < 2; i++) {
        const shoeX = this.x + (i === 0 ? 0 : this.width - shoeWidth);
        const shoeY = this.y + this.height - shoeHeight; // Adjust the shoe's Y position to be within the character's body
        // Use the frame count to swap shoe colors
        const colorIndex = this.frameCount % 2 === 0 ? i : 1 - i;    
        console.log(colorIndex + " for shue " + i + " frame: " + this.frameCount);
        ctx.fillStyle = this.shoeColor[colorIndex];
        ctx.fillRect(shoeX, shoeY, shoeWidth, shoeHeight);
      }
    }
    
  
    update() {
      // Update the frame count
      this.frameCount++;
      // Implement other update logic as necessary
    }
  }
  

  // Create an instance of the game engine and start the game
  const gameEngine = new GameEngine('gameCanvas');
  gameEngine.start();
  