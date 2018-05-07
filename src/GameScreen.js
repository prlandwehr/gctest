/*
 * The game screen is a singleton view
 */

import animate;
import ui.View;
import ui.ImageView;
import ui.resource.Image as Image;
import ui.TextView;

//Visual resource constants
var img_bbl_r = new Image({url: "resources/images/ball_red.png"});
var img_bbl_b = new Image({url: "resources/images/ball_blue.png"});
var img_bbl_g = new Image({url: "resources/images/ball_green.png"});
var img_bbl_p = new Image({url: "resources/images/ball_purple.png"});
var img_bbl_y = new Image({url: "resources/images/ball_yellow.png"});
var bubbleImages = {
	"r": img_bbl_r,
	"b": img_bbl_b,
	"g": img_bbl_g,
	"p": img_bbl_p,
	"y": img_bbl_y,
};
//BubbleGame Module constants
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
	["y","y","","","","","","","","","",""]
];
//BubbleGame Screen constants
var hexwidth = Math.sqrt(3)*21;
var hexheight = 21*2;
var circleradius = hexwidth / 2;
var debug_gridwidth = (g_gridsizex*hexwidth)+(0.5*hexwidth);
var debug_gridheight = (0.75*hexheight*g_gridsizey)+(0.25*hexheight);
//non-constants
var gameComplete = false;
var gameCompleteTextView = null;
var activeTick = 0; //interval ID for bubble movement
var LoadedBubble = null; //game scene loaded bubble
var NextBubble = null; //game scene next bubble
var ActiveGrid = [ //keeps track of bubbles in the game scene
	[null,null,null,null,null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null,null,null,null,null]
];

/* The GameScreen view is a child of the main application.
 */
exports = Class(ui.View, function (supr) {
	this.init = function (opts) {
		opts = merge(opts, {
			x: 0,
			y: 0,
			width: 320,
			height: 480,
		});

		supr(this, 'init', [opts]);

		this.build();
	};

	this.initBubbleGame = function() {
		BubbleGame.initGrid();
		this.setBubbles();

		//input section
		this.on('InputSelect', bind(this, function (event) {
			var x = event.srcPoint.x;
			var y = event.srcPoint.y;
			//console.log("x:"+x+" y:"+y);

			if(activeTick != 0) {
				return;
			}
			if(gameComplete) {
				this.emit('gamescreen:end');
				reset_game.call(this);
				return;
			}
			//calculate shot angle
			var x1 = LoadedBubble.getPosition().x+(LoadedBubble.getPosition().width/2);
			var y1 = LoadedBubble.getPosition().y+(LoadedBubble.getPosition().height/2);
			var angleRadians = Math.atan2(y - y1, x - x1);
			var angleDeg = Math.atan2(y - y1, x - x1) * 180 / Math.PI;

			BubbleGame.shootBubble(angleRadians);
			activeTick = setInterval(this.bubbleTick,16);
		}));
	};

	this.setBubbles = function() {
		var grid = BubbleGame.getGrid();
		
		//create level's bubbles
		for(var x = 0; x < grid.length; x++) {
			for(var y = 0; y < grid[x].length; y=y+2) {
				//even
				var cx = hexwidth*x;
				var cy = 0.75*hexheight*y;
				var cimg = bubbleImages[grid[x][y].color];
				if(grid[x][y].isNull) {
					ActiveGrid[x][y] = null;
				} else {
					var newimage = new ui.ImageView({
						superview: this,
						image: cimg,
						x: cx,
						y: cy,
						width: hexwidth,
						height: hexheight
					});
					ActiveGrid[x][y] = newimage;
				}
				// odd
				cx = hexwidth*(x+0.5);
				cy = 0.75*hexheight*(y+1);
				cimg = bubbleImages[grid[x][y+1].color];
				if(grid[x][y+1].isNull) {
					ActiveGrid[x][y+1] = null;
				} else {
					var newimage = new ui.ImageView({
						superview: this,
						image: cimg,
						x: cx,
						y: cy,
						width: hexwidth,
						height: hexheight
					});
					ActiveGrid[x][y+1] = newimage;
				}
			}
		}

		//create loaded and next bubble
		var loadedb = BubbleGame.getLoadedBubble();
		var lx = loadedb.activex;
		var ly = loadedb.activey;
		var gridw = g_gridsizex * g_hexwidth + (g_hexwidth/2);
		var gridh = ((g_gridsizey/2)*1.5*g_hexheight)+(0.25*g_hexheight);
		var xy = [lx/gridw*debug_gridwidth, ly/gridh*debug_gridheight];
		LoadedBubble = new ui.ImageView({
			superview: this,
			image: bubbleImages[loadedb.color],
			x: xy[0],
			y: xy[1],
			width: hexwidth,
			height: hexheight
		});
		NextBubble = new ui.ImageView({
			superview: this,
			image: bubbleImages[BubbleGame.getNextBubble().color],
			x: 0,
			y: debug_gridheight-hexheight,
			width: hexwidth,
			height: hexheight
		});
	};

	this.bubbleTick = function(){
		var loadedb = BubbleGame.getLoadedBubble();
		var lx = loadedb.activex;
		var ly = loadedb.activey;

		var xy = [(lx/g_gridwidth*debug_gridwidth), (ly/g_gridheight*debug_gridheight)];
		LoadedBubble.updateOpts({x:xy[0], y:xy[1]});

		var tickResults = BubbleGame.tick();

		if(tickResults[0]) {
			clearInterval(activeTick);
			activeTick = 0;
			//
			var parents = LoadedBubble.getParents();
			var gamescr = parents[parents.length - 1];
			if(tickResults[1].length > 0) { //remove shot bubble
				gamescr.removeSubview(LoadedBubble);
			} else {
				//stick shot
				var last = BubbleGame.getLastStuck();
				if(last[1] % 2 == 0) {
					var cx = hexwidth*last[0];
					var cy = 0.75*hexheight*last[1];
				} else {
					var cx = hexwidth*(last[0]+0.5);
					var cy = 0.75*hexheight*(last[1]);
				}
				LoadedBubble.updateOpts({x:cx, y:cy});
				ActiveGrid[last[0]][last[1]] = LoadedBubble;
			}
			//remove matched bubbles
			for(var i = 0; i < tickResults[1].length; i++) {
				var currentTickResult = tickResults[1][i];
				var currentActiveBubble = ActiveGrid[currentTickResult.hx][currentTickResult.hy];
				if(currentActiveBubble != null) {
					gamescr.removeSubview(ActiveGrid[ tickResults[1][i].hx ][ tickResults[1][i].hy ]);
					ActiveGrid[ tickResults[1][i].hx ][ tickResults[1][i].hy ] = null;
				}
			}
			//check for game end
			if(BubbleGame.getGameOver()) {
				gameCompleteTextView = new ui.TextView({
					superview: gamescr,
					x: 0,
					y: 15,
					width: 320,
					height: 50,
					autoSize: false,
					size: 38,
					verticalAlign: 'middle',
					horizontalAlign: 'center',
					wrap: false,
					color: '#FFFFFF'
				});
				gameCompleteTextView.setText("GAME OVER");
				gameComplete = true;
				return;
			} else if(BubbleGame.getGameWon()) {
				gameCompleteTextView = new ui.TextView({
					superview: gamescr,
					x: 0,
					y: 15,
					width: 320,
					height: 50,
					autoSize: false,
					size: 38,
					verticalAlign: 'middle',
					horizontalAlign: 'center',
					wrap: false,
					color: '#FFFFFF'
				});
				gameCompleteTextView.setText("VICTORY");
				gameComplete = true;
				return;
			}

			//reload bubble
			loadedb = BubbleGame.getLoadedBubble();
			var lx = loadedb.activex;
			var ly = loadedb.activey;
			var gridw = g_gridsizex * g_hexwidth + (g_hexwidth/2);
			var gridh = ((g_gridsizey/2)*1.5*g_hexheight)+(0.25*g_hexheight);
			var xy = [lx/gridw*debug_gridwidth, ly/gridh*debug_gridheight];
			LoadedBubble = NextBubble;
			LoadedBubble.updateOpts({x:xy[0], y:xy[1]});
			NextBubble = new ui.ImageView({
				superview: gamescr,
				image: bubbleImages[BubbleGame.getNextBubble().color],
				x: 0,
				y: debug_gridheight-hexheight,
				width: hexwidth,
				height: hexheight
			});
		} else {
			//no collision occured
		}
	};

	this.build = function () {
		/* The start event is emitted from the start button via the main application.
		 */
		this.on('app:start', start_game_flow.bind(this));

		this.style.width = 320;
		this.style.height = 480;

		//bubble
		this.initBubbleGame();
	};
});

/*
 * Game play
 */

/* 
 */
function start_game_flow () {
	var that = this;
	play_game.call(that);
}

/* 
 */
function play_game () {
	//
}

/* 
 */
function end_game_flow () {
	//
}

/* Reset game counters and assets.
 */
function reset_game () {
	var parents = gameCompleteTextView.getParents();
	var gamescr = parents[parents.length - 1];
	gamescr.removeAllSubviews();
	//
	gameComplete = false;
	gameCompleteTextView = null;
	activeTick = 0;
	LoadedBubble = null;
	NextBubble = null;
	ActiveGrid = [
		[null,null,null,null,null,null,null,null,null,null,null,null],
		[null,null,null,null,null,null,null,null,null,null,null,null],
		[null,null,null,null,null,null,null,null,null,null,null,null],
		[null,null,null,null,null,null,null,null,null,null,null,null],
		[null,null,null,null,null,null,null,null,null,null,null,null],
		[null,null,null,null,null,null,null,null,null,null,null,null],
		[null,null,null,null,null,null,null,null,null,null,null,null],
		[null,null,null,null,null,null,null,null,null,null,null,null]
	];
	//
	BubbleGame.resetGame();
	this.setBubbles();
}


/******************************************************************************************************
*******************************************************************************************************
*******************************************************************************************************
*******************************************************************************************************/

//BubbleGame Model
var BubbleGame = (function(){
	var grid = []; //odd-r horizontal layout offset coords
	var validColors = ["b","g","p","r","y"]; //blue green purple red yellow
	var loadedBubble = null; //bubble about to be shot or in flight
	var nextBubble = null;
	var score = 0;
	var bouncedLeft = false;
	var bouncedRight = false;
	var lastStuck = null;
	var gameover = false;
	var gamewon = false;

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

	var resetGame = function() {
		loadedBubble = null;
		nextBubble = null;
		score = 0;
		bouncedLeft = false;
		bouncedRight = false;
		lastStuck = null;
		gameover = false;
		gamewon = false;
		initGrid();
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
		var waspopped = [];
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
							waspopped.push(group[i]);
						}
					}
					group = [];
				}
			}
		}
		return waspopped;
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
		loadedBubble.activex = (g_gridwidth / 2) - g_hexradius;
		loadedBubble.activey = grid[g_gridsizex-1][g_gridsizey-1].activey;

		loadedBubble.vx = g_shotspeed * Math.cos(angle);
		loadedBubble.vy = -Math.abs(g_shotspeed * Math.sin(angle));
	};
	//
	var tick = function() {
		var collision = [false];
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
			collision = [true, stick()];
			return collision;
		}
		//bubble collision
		for(var y = 0; y < g_gridsizey; y++) {
			//itterate over rows starting from the top
			for(var x = 0; x < g_gridsizex; x++) {
				if(!grid[x][y].isNull) {
					var cBubbleCoord = grid[x][y].getXY();
					var bubbledist = Math.sqrt( Math.pow(cBubbleCoord[0]-loadedBubble.activex,2) + Math.pow(cBubbleCoord[1]-loadedBubble.activey,2) );
					if(bubbledist <= g_hexradius*2) {
						collision = [true, stick()];
						break;
					}
				}
			}
		}
		return collision;
	};
	//
	var stick = function() {
		var waspopped = [];
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
			var floatpop = removeFloatingBubbles();
			score += 100 * floatpop.length;
			waspopped = toPop.concat(floatpop);
		} else {
			lastStuck = [closest[0].hx, closest[0].hy];
		}
		bouncedRight = false;
		bouncedLeft = false;
		//endgame check
		if(loadedBubble.hy == g_gridsizey - 1) {
			gameover = true;
		}
		gamewon = true;
		for(var i = 0; i < grid.length; i++) {
			if(!grid[i][0].isNull) {
				gamewon = false;
			}
		}
		//
		reloadActiveBubble();
		return waspopped;
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

	var getLastStuck = function() {
		return lastStuck;
	};

	var getGameOver = function() {
		return gameover;
	};

	var getGameWon = function() {
		return gamewon;
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
		"getScore": getScore,
		"getLastStuck": getLastStuck,
		"getGameOver":getGameOver,
		"getGameWon":getGameWon,
		"resetGame":resetGame
	};
})();

/******************************************************************************************************
*******************************************************************************************************
*******************************************************************************************************
*******************************************************************************************************/

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
	//Return neighboring hexs' coordinants as map
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
	//Return upper left and upper right neighbors coordinants as map
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
	//Return upper left and upper right neighbors coordinants
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