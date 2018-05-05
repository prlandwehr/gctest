//Bubble Model
var Bubble = class {
	constructor(color, hx, hy) {
		this.isNull = false; //for unused spaces in game grid
		this.isChecked = false; //for match checking
		this.color = color; //character indicating bubble color
		//hex coordinant system
		this.hx = hx;
		this.hy = hy;
		//regular coordinant system [upper-left bubble coord]
		this.activex;
		this.activey;
		//velocity
		this.vx = 0;
		this.vy = 0;
		//hex width and height
		this.width = Math.sqrt(3)*0.5;
		this.height = 0.5*2;
	}
	//Return neighboring hexes in a corner to hcoordinant mapping
	getNeighborCoords(gridx, gridy) {
		//set bounds
		if(typeof gridx === "undefined"){gridx = g_gridsizex;}
		if(typeof gridy === "undefined"){gridy = g_gridsizey;}
		if(this.hy %2 == 0) {
			//get neighbor coords even row
			var neighbors = { 
				"l": [this.hx-1,this.hy],
				"ul": [this.hx-1,this.hy-1],
				"ur": [this.hx,this.hy-1],
				"r": [this.hx+1,this.hy],
				"dr": [this.hx,this.hy+1],
				"dl": [this.hx-1,this.hy+1]
			};
		} else {
			//get neighbor coords odd row
			var neighbors = { 
				"l": [this.hx-1,this.hy],
				"ul": [this.hx,this.hy-1],
				"ur": [this.hx+1,this.hy-1],
				"r": [this.hx+1,this.hy],
				"dr": [this.hx+1,this.hy+1],
				"dl": [this.hx,this.hy+1]
			};
		}
		//remove invalid coords
		var nkeys = Object.getOwnPropertyNames(neighbors);
		for(var i = 0; i < nkeys.length; i++) {
			var coord = neighbors[nkeys[i]];
			if(coord[0] < 0 || coord[1] < 0) {
				delete neighbors[nkeys[i]];
			} else if(coord[0] > gridx || coord[1] > gridy) {
				delete neighbors[nkeys[i]];
			}
		}
		return neighbors;
	}
	//Return array of neighboring hexs' coordinants
	getNeighborCoordsArray(gridx,gridy) {
		//set bounds
		if(typeof gridx === "undefined"){gridx = g_gridsizex;}
		if(typeof gridy === "undefined"){gridy = g_gridsizey;}
		if(this.hy %2 == 0) {
			//get neighbor coords even row
			var neighbors = [
				[this.hx-1,this.hy],
				[this.hx-1,this.hy-1],
				[this.hx,this.hy-1],
				[this.hx+1,this.hy],
				[this.hx,this.hy+1],
				[this.hx-1,this.hy+1]
			];
		} else {
			//get neighbor coords odd row
			var neighbors =  [
				[this.hx-1,this.hy],
				[this.hx,this.hy-1],
				[this.hx+1,this.hy-1],
				[this.hx+1,this.hy],
				[this.hx+1,this.hy+1],
				[this.hx,this.hy+1]
			];
		}
		//remove invalid coords
		for(var i = 0; i < neighbors.length; i++) {
			var coord = neighbors[i];
			if(coord[0] < 0 || coord[1] < 0) {
				neighbors.splice(i,1);
				i--;
			} else if(coord[0] > gridx-1 || coord[1] > gridy-1) {
				neighbors.splice(i,1);
				i--;
			}
		}
		return neighbors;
	}
	//Return upper left and upper right neighbors
	getUpperCoords(gridx, gridy) {
		//set bounds
		if(typeof gridx === "undefined"){gridx = g_gridsizex;}
		if(typeof gridy === "undefined"){gridy = g_gridsizey;}
		if(this.hy %2 == 0) {
			//get neighbor coords even row
			var neighbors = { 
				"ul": [this.hx-1,this.hy-1],
				"ur": [this.hx,this.hy-1]
			};
		} else {
			//get neighbor coords odd row
			var neighbors = { 
				"ul": [this.hx,this.hy-1],
				"ur": [this.hx+1,this.hy-1]
			};
		}
		//remove invalid coords
		var nkeys = Object.getOwnPropertyNames(neighbors);
		for(var i = 0; i < nkeys.length; i++) {
			var coord = neighbors[nkeys[i]];
			if(coord[0] < 0 || coord[1] < 0) {
				delete neighbors[nkeys[i]];
			} else if(coord[0] > gridx || coord[1] > gridy) {
				delete neighbors[nkeys[i]];
			}
		}
		return neighbors;
	}
	//Return upper left and upper right neighbors
	getUpperCoordsArray(gridx, gridy) {
		//set bounds
		if(typeof gridx === "undefined"){gridx = g_gridsizex;}
		if(typeof gridy === "undefined"){gridy = g_gridsizey;}
		var neighbors = [];
		if(this.hy %2 == 0) {
			//get neighbor coords even row
			if(this.hy > 0 && this.hx > 0) {
				neighbors.push([this.hx-1,this.hy-1]);
			}
			if(this.hy > 0) {
				neighbors.push([this.hx,this.hy-1]);
			}
		} else {
			//get neighbor coords odd row
			if(this.hy > 0) {
				neighbors.push([this.hx,this.hy-1]);
			}
			if(this.hy > 0 && this.hx < gridx - 1) {
				neighbors.push([this.hx+1,this.hy-1]);
			}
		}
		return neighbors;
	}
	//get XY coord for the center of the hexagon
	getCenterXY() {
		var centery = (0.5*this.height)+(0.75*this.height*this.hy);
		if(this.hy % 2 == 0) {
			var centerx = 0.5*this.width*this.hx;
		} else {
			var centerx = (0.5*this.width) + (0.5*this.width*this.hx);
		}
		return [centerx,centery];
	}
	//get XY coord for the upper left of the hex's containing box
	getXY() {
		var y = (0.75*this.height*this.hy);
		if(this.hy % 2 == 0) {
			var x = this.width*this.hx;
		} else {
			var x = (0.5*this.width) + (this.width*this.hx);
		}
		return [x,y];
	}
	//get the full color name of this bubble
	getColorName() {
		var colorname = "";
		switch(this.color) { //["b","g","p","r","y"]
			case "b":
				colorname = "blue";
				break;
			case "g":
				colorname = "green";
				break;
			case "p":
				colorname = "purple";
				break;
			case "r":
				colorname = "red";
				break;
			case "y":
				colorname = "yellow";
				break;
		}
		return colorname;
	}
};