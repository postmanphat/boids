var canvas = document.getElementById("html-canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var context = canvas.getContext("2d");

//Initial parameters set

var numBoids = 150;
var boids = [];
var sensingRadius = 120;
var separationRadius = 30;
var wallDisplacement = 65;
var maxSpeed = 5;

var cohesionCo = 2000;
var separationCo = 7;
var alignmentCo = 100;

var debugging = false;
var walls = true;


class Boid {
	constructor(xPos, yPos, xVel, yVel, colour) {
		this.xPos = xPos;
		this.yPos = yPos;
		this.xVel = xVel;
		this.yVel = yVel;
		this.colour = colour;
	}
	
	update() {
		let localBoids = []
		for (let boid of boids) {
			let dist = eucDist(this.xPos, boid.xPos, this.yPos, boid.yPos)
			if (dist < sensingRadius && dist > 0) {
				localBoids.push(boid)
			}
			
		}
		//For debugging
		// if (this == boids[0]) {
			// console.log(localBoids.length)
		// }
		
		if (localBoids.length > 0) {
			//If boids nearby, apply rules
			this.alignment(localBoids);
			this.cohesion(localBoids);
			this.separation(localBoids);
			this.walls();
			
		}
		//Adding noise to direction
		this.xVel += (Math.random()-0.5)/10;
		this.yVel += (Math.random()-0.5)/10;
		
		//Normalising velocities 
		let mag = Math.sqrt((this.xVel*this.xVel) + (this.yVel*this.yVel));
		if (mag > maxSpeed) {
			this.xVel = maxSpeed * this.xVel/mag;
			this.yVel = maxSpeed * this.yVel/mag;
		}
		
		this.colour = colourFromVel(Math.min(mag, maxSpeed));

		this.xPos += this.xVel;
		this.yPos += this.yVel;
		
		//Temporary bodge solution for edges
		if (this.xPos > canvas.width) {
			this.xPos = 0;
		}
		if (this.xPos < 0) {
			this.xPos = canvas.width;
		}
		if (this.yPos > canvas.height) {
			this.yPos = 0;
		}
		if (this.yPos < 0) {
			this.yPos = canvas.height;
		}
	}

	separation(localBoids) {
		let cX = 0;
		let cY = 0;
		let sum = [0, 0];
		let count = 0;
		for (let boid of localBoids) {
			let sep = eucDist(this.xPos, boid.xPos, this.yPos, boid.yPos);
			if (sep < separationRadius) {
				cX = this.xPos - boid.xPos;
				cY = this.yPos - boid.yPos;
				let normDiff = normalise(cX, cY);
				normDiff.map(x => x / sep);
				sum[0] += normDiff[0];
				sum[1] += normDiff[1];
				count++;				
			}
		}		
		if (count > 0) {
			sum[0] = sum[0]/(count*separationCo);
			sum[1] = sum[1]/(count*separationCo);
			this.xVel += sum[0];
			this.yVel += sum[1];
		}
			
	}
	
	alignment(localBoids) {
		//Take the average heading of nearby boids and steer towards
		let xVelMean = 0;
		let yVelMean = 0;
		for (let boid of localBoids) {
			xVelMean += boid.xVel;
			yVelMean += boid.yVel;
		}
		xVelMean = xVelMean / localBoids.length;
		yVelMean = yVelMean / localBoids.length;
		let deltaX = (xVelMean - this.xVel)/alignmentCo;
		let deltaY = (yVelMean - this.yVel)/alignmentCo;
		this.xVel += deltaX;
		this.yVel += deltaY;
	}
	
	cohesion(localBoids) {
		//Take the average position of nearby boids and steer towards
		let xMean = 0;
		let yMean = 0;
		for (let boid of localBoids) {
			xMean += boid.xPos;
			yMean += boid.yPos;
		}
		xMean = xMean/localBoids.length;
		yMean = yMean/localBoids.length;
		let deltaX = (xMean - this.xPos)/cohesionCo;
		let deltaY = (yMean - this.yPos)/cohesionCo;
		this.xVel += deltaX;
		this.yVel += deltaY;
	}
	
	walls() {
		if (walls) {
			if (this.yPos < wallDisplacement) {
				this.yVel += (wallDisplacement - this.yPos)/100;
			}
			else if (this.yPos > canvas.height-wallDisplacement) {
				this.yVel += -(this.yPos - (canvas.height-wallDisplacement))/100;
			}
			if (this.xPos < wallDisplacement) {
				this.xVel += (wallDisplacement - this.xPos)/100;
			}
			else if (this.xPos > canvas.width-wallDisplacement) {
				this.xVel += -(this.xPos - (canvas.width-wallDisplacement))/100;
			}
		}		
	}
}



function eucDist(x1, x2, y1, y2) {
	let deltaX = x2 - x1;
	let deltaY = y2 - y1;
	return Math.sqrt((deltaX*deltaX) + (deltaY*deltaY))
}

function normalise(x, y) {
	let mag = eucDist(0, x, 0, y);
	return ([x/mag, y/mag]);
}

function colourFromVel(vel) {
	let delta = (vel/maxSpeed)* 255
	let r = 255 - delta;
	let g = 0 + delta;
	let b = 0;
	return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function setup() {
	for (let i = 0; i < numBoids; i++) {
		boids.push(new Boid(Math.random()*canvas.width,
		Math.random()*canvas.height,
		(Math.random()-0.5)*maxSpeed,
		(Math.random()-0.5)*maxSpeed,
		'rgb(255, 255, 255)'));
	}
}

//Listeners

document.addEventListener("keypress", function(event) {
  if (event.key == 'd') {
    debugging = !debugging;
  }
});

document.addEventListener("keypress", function(event) {
  if (event.key == 'w') {
    walls = !walls;
  }
});

function draw() {

	context.fillStyle = '#000000';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.lineWidth = 2;
	
	for (let boid of boids) {		
		boid.update();
		context.fillStyle = boid.colour;
		context.beginPath();
		context.arc(boid.xPos, boid.yPos, 2, 0, 2*Math.PI);
	
		context.fill();
		
	}
	
	// highlight boid for debugging
	if (debugging) {
		context.fillStyle = '#FF0000';
		context.strokeStyle = '#FF0000';
		context.beginPath();
		context.arc(boids[0].xPos, boids[0].yPos, 2, 0, 2*Math.PI);
		context.fill();
		context.beginPath();
		context.arc(boids[0].xPos, boids[0].yPos, sensingRadius, 0, 2*Math.PI);
		context.stroke()
		context.beginPath();
		context.arc(boids[0].xPos, boids[0].yPos, 30, 0, 2*Math.PI);
		context.stroke()
	}
	
	
	window.requestAnimationFrame(draw);
}

setup();

draw();
