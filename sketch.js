var cx, cy, frequencyCircles, laserEmitters, tune, fft, spectrum;
var mouseControlled = false;
var currentHue = 0;
var hueSpeed = 0.1;
var currentAlpha = 0;
var spinThreshold = 210;

function preload() {
  tune = loadSound('01 Know Where.mp3');
}

function setup() {
  frameRate(30);
  colorMode(HSB);
  cx = windowWidth/2;
  cy = windowHeight/2;
  createCanvas(windowWidth, windowHeight, 'webgl');
  background(0);

  tune.loop();
  fft = new p5.FFT();
  fft.smooth(0.9)

  frequencyCircles = [];

  frequencyCircles.push(new FrequencyCircle({
    radiusOffset : 0,
    totalParticles: 30,
    minTotalParticles: 20,
    laserRange: 150,
    frequency: 'bass'
  }));

  frequencyCircles.push(new FrequencyCircle({
    radiusOffset : 0,
    totalParticles: 10,
    laserRange: 100,
    frequency: 'mid'
  }));

  frequencyCircles.push(new FrequencyCircle({
    radiusOffset : 0,
    totalParticles: 5,
    laserRange: 80,
    frequency: 'treble'
  }));

  frequencyCircles.push(new FrequencyCircle({
    radiusOffset : 0,
    totalParticles: 10,
    laserRange: 60,
    frequency: 'highMid'
  }));

  laserEmitters = [];

  laserEmitters.push(new LaserEmitter({
    primary: true,
    radius: 30,
    speed: 0.2,
    rotationSpeed: -0.01,
    particleRadius: 2,
    rotation: 0.9
  }));

}

function draw() {
  background(0);
  spectrum = fft.analyze();
  currentHue += hueSpeed;
  if (currentHue > 255 || currentHue <=0) {
    hueSpeed = hueSpeed *-1;
  }

  for (var i = 0; i < frequencyCircles.length; i++) {
    frequencyCircles[i].update();
  }

  for (var i = 0; i < laserEmitters.length; i++) {
    laserEmitters[i].update();
  }
}

function mouseWheel(event) {
  event.preventDefault();
  if (mouseControlled) {
    laserEmitters[0].radius = constrain(event.deltaY+laserEmitters[0].radius, 21, 250);
  }
}

var LaserEmitter = function(settings) {
  this.radius = settings.radius || 150;
  this.totalParticles = settings.totalParticles || 10;
  this.particleRadius = settings.particleRadius || 2;
  this.speed = settings.speed || 1;
  this.rotationSpeed = settings.rotationSpeed || 0.01;
  this.rotation = settings.rotation || 0;
  this.primary = settings.primary || false;
  this.setup();
}

LaserEmitter.prototype.setup = function() {
  this.particles = [];
  for (var i = 0; i < this.totalParticles; i++) {
    var angle = i * 2 * Math.PI / this.totalParticles;
    this.particles.push({
      pos: createVector((cx + Math.cos(angle) * this.radius) - this.particleRadius / 2, (cy + Math.sin(angle) * this.radius) - this.particleRadius / 2)
    });
  }
}

LaserEmitter.prototype.randomize = function() {
  this.totalParticles = Math.round(random(3,20));
  this.setup();
}

LaserEmitter.prototype.update = function() {

  if (!mouseControlled) {
    this.radius += this.speed;
  }
  if (this.radius > 200 || this.radius <= 20) {
    if (this.radius <= 20) {
      this.randomize();
      for (var i = 0; i < frequencyCircles.length; i++) {
        frequencyCircles[i].randomize();
      }
    }
    this.speed = -1*this.speed;
  }

  this.rotation += this.rotationSpeed;
  this.draw();
}

LaserEmitter.prototype.draw = function() {
  var centerX = mouseControlled ? mouseX : cx;
  var centerY = mouseControlled ? mouseY : cy;
  noStroke();
  for (var i = 0; i < this.particles.length; i++) {
    var angle = i * 2 * Math.PI / this.totalParticles + this.rotation;
    this.particles[i].pos = createVector((centerX + Math.cos(angle) * this.radius) - this.particleRadius / 2, (centerY + Math.sin(angle) * this.radius) - this.particleRadius / 2);
    ellipse(this.particles[i].pos.x, this.particles[i].pos.y, this.particleRadius, this.particleRadius);

    for (var a = 0; a < frequencyCircles.length; a++) {
     // var radiusDistance = Math.abs(this.radius-frequencyCircles[a].radius);
      //if (radiusDistance >= frequencyCircles[a].laserRange) {
      //  continue;
      //}
      strokeWeight(1);
      for (var b = 0; b < frequencyCircles[a].particles.length; b++) {
        var distance = this.particles[i].pos.dist(frequencyCircles[a].particles[b].pos);
        var opacity = Math.abs(map(distance, 0, frequencyCircles[a].laserRange, 255, 50));
        //console.log(opacity);
        stroke(currentHue,255,255, opacity);
        if (distance <= frequencyCircles[a].laserRange) {
          line(this.particles[i].pos.x, this.particles[i].pos.y, frequencyCircles[a].particles[b].pos.x, frequencyCircles[a].particles[b].pos.y);
        }
      }
    }
  }
}

var FrequencyCircle = function(settings) {
  this.radius = settings.radius || 150;
  this.totalParticles = settings.totalParticles || 20;
  this.maxTotalParticles = settings.maxTotalParticles || settings.totalParticles || 10;
  this.minTotalParticles = settings.minTotalParticles || 5;
  this.particleRadius = settings.particleRadius || 2;
  this.radiusOffset = settings.radiusOffset || 0;
  this.frequency = settings.frequency || 'bass';
  this.laserRange = settings.laserRange || 150;
  this.setup();
}

FrequencyCircle.prototype.randomize = function() {
  this.totalParticles = Math.round(random(this.minTotalParticles, this.maxTotalParticles));
  this.laserRange = Math.round(random(50,200));
  this.setup();
}

FrequencyCircle.prototype.setup = function() {
  this.particles = [];

  for (var i = 0; i < this.totalParticles; i++) {
    var angle = i * 2 * Math.PI / this.totalParticles;
    this.particles.push({
      pos: createVector((cx + Math.cos(angle) * this.radius) - this.particleRadius / 2, (cy + Math.sin(angle) * this.radius) - this.particleRadius / 2)
    });
  }
}

FrequencyCircle.prototype.update = function() {
  this.amp = fft.getEnergy(this.frequency);
  this.radius = this.radiusOffset+this.amp;
  this.draw();
}

FrequencyCircle.prototype.draw = function() {
  fill(currentHue, 255, 255, 255);
  for (var i = 0; i < this.particles.length; i++) {
    var angle = i * 2 * Math.PI / this.totalParticles;
    this.particles[i].pos = createVector((cx + Math.cos(angle) * this.radius) - this.particleRadius / 2, (cy + Math.sin(angle) * this.radius) - this.particleRadius / 2);
    ellipse(this.particles[i].pos.x, this.particles[i].pos.y, this.particleRadius, this.particleRadius);
  }
}