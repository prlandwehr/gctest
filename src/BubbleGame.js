var g_gridsizex = 8;
var g_gridsizey = 12; //last row is kill row
var g_hexwidth = Math.sqrt(3)*0.5;
var g_hexheight = 0.5*2;
var g_gridwidth = (g_gridsizex*g_hexwidth)+(0.5*g_hexwidth);
var g_gridheight = (0.75*g_hexheight*g_gridsizey)+(0.25*g_hexheight);
var g_hexradius = g_hexwidth/2; //inner circle radius
var g_shotspeed = 0.2; //amount hex moves per tick/frame
var level1test = [
	["r","r","r","","","","","","","","",""],
	["r","r","r","","","","","","","","",""],
	["b","b","b","","","","","","","","",""],
	["b","b","b","","","","","","","","",""],
	["g","g","","","","","","","","","",""],
	["g","g","","","","","","","","","",""],
	["y","y","","","","","","","","","",""],
	["y","y","","","","","","","","","",""]];

//BubbleGame Model
var BubbleGame = (function(){
	var grid = []; //odd-r horizontal layout offset coords
	var validColors = ["b","g","p","r","y"]; //blue green purple red yellow
	var loadedBubble = null; //bubble about to be shot or in flight
	var nextBubble = null;
	var playerAngle = 0;
	var score = 0;
	var activeTick = 0;
	var bouncedLeft = false;
	var bouncedRight = false;

	var initGrid = function() {
		grid = [];
		for(var x = 0; x < g_gridsizex; x++) {
			grid.push([]);
			for(var y = 0; y < g_gridsizey; y++) {
				grid[x].push(new Bubble("b",x,y));
				grid[x][y].isNull = true;
				var coord = grid[x][y].getXY();
				grid[x][y].activex = coord[0];
				grid[x][y].activey = coord[1];
			}
		}
		loadLevelArray(level1test);
		setNextBubble();
		reloadActiveBubble();
		setNextBubble();
	};

	var loadLevelArray = function(arr) {
		for(var x = 0; x < g_gridsizex; x++) {
			//grid.push([]);
			for(var y = 0; y < g_gridsizey; y++) {
				if(arr[x][y] == "") {
					grid[x][y].isNull = true;
					grid[x][y].color = "";
				} else {
					grid[x][y].isNull = false;
					grid[x][y].color = arr[x][y];
				}
			}
		}
	};

	var getGrid = function() {
		return grid;
	};

	//find all same color connected bubbles for the given coordinant
	var getPoppingBubbles = function(hx,hy,color) {
		if(typeof color === "undefined") {
			color = grid[hx][hy].color;
		}
		var bubbleArray = [grid[hx][hy]];
		grid[hx][hy].isChecked = true;
		//var links = grid[hx][hy].getNeighborCoordsArray();
		var itterateBubbles = function(hx,hy,color) {
			var links = grid[hx][hy].getNeighborCoordsArray();
			for(var i = 0; i < links.length; i++) {
				var cBubble = grid[ links[i][0] ][ links[i][1] ];
				if(!cBubble.isNull && cBubble.color == color && !cBubble.isChecked) {
					grid[hx][hy].isChecked = true;
					bubbleArray.push(cBubble);
					itterateBubbles(cBubble.hx,cBubble.hy,cBubble.color);
				}
			}
		};
		itterateBubbles(hx,hy,color);
		//reset checked status
		for(var i = 0; i < bubbleArray.length; i++) {
			bubbleArray[i].isChecked = false;
		}
		return bubbleArray;
	};

	//remove bubbles that are floating after a pop
	var removeFloatingBubbles = function() {
		var numPopped = 0;
		for(var y = 1; y < g_gridsizey; y++) {
			var group = [];
			//itterate over rows starting from the top
			for(var x = 0; x < g_gridsizex; x++) {
				//find groups of bubbles with horizontal connection
				if(!grid[x][y].isNull) {
					group.push(grid[x][y]);
				}
				//upon finding a group
				if( (grid[x][y].isNull || x == g_gridsizex - 1) && group.length > 0){
					var nolinks = true;
					//check for an upwards link
					for(var i = 0; i < group.length; i++) {
						var links = group[i].getUpperCoordsArray();
						for(var z = 0; z < links.length; z++) {
							var isbubblenull = grid[ links[z][0] ][ links[z][1] ].isNull;
							if(!isbubblenull) {
								nolinks = false;
								break;
							}
						}
					}
					//if no upwards links found nullify those bubbles
					if(nolinks) {
						for(var i = 0; i < group.length; i++) {
							group[i].isNull = true;
							numPopped++;
						}
					}
					group = [];
				}
			}
		}
		return numPopped;
	};

	//Create the next bubble to be shot from an active color
	var setNextBubble = function() {
		var activecolors = [];
		for(var i = 0; i < grid.length; i++) {
			for(var j = 0; j < grid[i].length; j++) {
				if(!grid[i][j].isNull) {
					if(activecolors.indexOf(grid[i][j].color) == -1) {
						activecolors.push(grid[i][j].color);
					}
				}
			}
		}
		var randindex = Math.floor(Math.random()*activecolors.length);
		if(activecolors.length == 0) {
			nextBubble = null;
		} else {
			nextBubble = new Bubble(activecolors[randindex],-1,-1);
		}
	};
	//
	var reloadActiveBubble = function() {
		if(nextBubble != null) {
			loadedBubble = nextBubble;
			setNextBubble();
			loadedBubble.activex = (g_gridwidth / 2) - g_hexradius;
			loadedBubble.activey = grid[g_gridsizex-1][g_gridsizey-1].activey;
		}
	};
	//
	var shootBubble = function(angle) {
		if(activeTick != 0) {
			return;
		}

		loadedBubble.activex = (g_gridwidth / 2) - g_hexradius;
		loadedBubble.activey = grid[g_gridsizex-1][g_gridsizey-1].activey;

		loadedBubble.vx = g_shotspeed * Math.cos(angle);
		loadedBubble.vy = -Math.abs(g_shotspeed * Math.sin(angle));
		activeTick = setInterval(tick,16);
	};
	//
	var tick = function() {
		//move bubble
		loadedBubble.activex += loadedBubble.vx;
		loadedBubble.activey +=  loadedBubble.vy;
		//left/right wall collision
		if(loadedBubble.activex < 0 && !bouncedLeft) {
			loadedBubble.vx = -loadedBubble.vx;
			bouncedLeft = true;
			bouncedRight = false;
		}
		if(loadedBubble.activex >= g_gridwidth - g_hexwidth && !bouncedRight) {
			loadedBubble.vx = -loadedBubble.vx;
			bouncedRight = true;
			bouncedLeft = false;
		}
		//top wall collision
		if(loadedBubble.activey - g_hexradius <= 0) {
			stick();
			clearInterval(activeTick);
			activeTick = 0;
			return;
		}
		//bubble collision
		for(var y = 0; y < g_gridsizey; y++) {
			//itterate over rows starting from the top
			for(var x = 0; x < g_gridsizex; x++) {
				if(!grid[x][y].isNull) {
					var cBubbleCoord = grid[x][y].getXY();
					var bubbledist = Math.sqrt( Math.pow(cBubbleCoord[0]-loadedBubble.activex,2) + Math.pow(cBubbleCoord[1]-loadedBubble.activey,2) );
					if(bubbledist <= g_hexradius*2) {
						stick();
						clearInterval(activeTick);
						activeTick = 0;
						break;
					}
				}
			}
		}
	};
	//
	var stick = function() {
		var closest = [null,1000];//bubble, dist
		for(var y = 0; y < g_gridsizey; y++) {
			//itterate over rows starting from the top
			for(var x = 0; x < g_gridsizex; x++) {
				var cBubbleCoord = grid[x][y].getXY();
				var bubbledist = Math.sqrt( Math.pow(cBubbleCoord[0]-loadedBubble.activex,2) + Math.pow(cBubbleCoord[1]-loadedBubble.activey,2) );
				if(closest[0] == null) {
					closest = [grid[x][y], bubbledist];
				} else if(bubbledist < closest[1]) {
					closest = [grid[x][y], bubbledist];
				}
			}
		}
		loadedBubble.hx = closest[0].hx;
		loadedBubble.hy = closest[0].hy;
		grid[closest[0].hx][closest[0].hy] = loadedBubble;
		//pop
		var toPop = getPoppingBubbles(loadedBubble.hx,loadedBubble.hy,loadedBubble.color);
		if(toPop.length > 2) {
			for(var i = 0; i < toPop.length; i++) {
				toPop[i].isNull = true;
				score += 100;
			}
			score += 100 * removeFloatingBubbles();
		}
		bouncedRight = false;
		bouncedLeft = false;
		if(loadedBubble.hy == g_gridsizey - 1) {
			//game over here
		}
		reloadActiveBubble();
		BubbleVisualDebug.renderBubbles();
	};

	var getLoadedBubble = function() {
		return loadedBubble;
	};

	var getNextBubble = function() {
		return nextBubble;
	};

	var getScore = function() {
		return score;
	};

	return {
		"initGrid": initGrid,
		"getGrid": getGrid,
		"getPoppingBubbles": getPoppingBubbles,
		"removeFloatingBubbles": removeFloatingBubbles,
		"tick":tick,
		"stick":stick,
		"shootBubble":shootBubble,
		"getLoadedBubble": getLoadedBubble,
		"getNextBubble": getNextBubble,
		"getScore": getScore
	};
})();