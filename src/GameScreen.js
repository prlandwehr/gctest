/*
 * The game screen is a singleton view that consists of
 * a scoreboard and a collection of molehills.
 */

import animate;
import ui.View;
import ui.ImageView;
import ui.resource.Image as Image;
import ui.TextView;
import src.MoleHill as MoleHill;

/* Some game constants.
 */
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
var score = 0;
var high_score = 19;
var hit_value = 1;
var mole_interval = 600;
var game_on = false;
var game_length = 20000; //20 secs
var countdown_secs = game_length / 1000;
var lang = 'en';

/* The GameScreen view is a child of the main application.
 * By adding the scoreboard and the molehills as it's children,
 * everything is visible in the scene graph.
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
		var hexwidth = Math.sqrt(3)*15;
		var hexheight = 30;
		var circleradius = hexwidth / 2;
		var activeTick = 0;
		var debug_gridwidth = (g_gridsizex*hexwidth)+(0.5*hexwidth);
		var debug_gridheight = (0.75*hexheight*g_gridsizey)+(0.25*hexheight);

		BubbleGame.initGrid();
		var grid = BubbleGame.getGrid();
		
		for(var x = 0; x < grid.length; x++) {
			for(var y = 0; y < grid[x].length; y=y+2) {
				//circles
				var cx = hexwidth*x;
				var cy = 0.75*hexheight*y;
				var cimg = bubbleImages[grid[x][y].color];
				if(grid[x][y].isNull) {
					//style += "display:none";
				} else {
					new ui.ImageView({
						superview: this,
						image: cimg,
						x: cx,
						y: cy,
						width: hexwidth,
						height: hexheight
					});
				}
				// odd
				cx = hexwidth*(x+0.5);
				cy = 0.75*hexheight*(y+1);
				cimg = bubbleImages[grid[x][y+1].color];
				if(grid[x][y+1].isNull) {
					//style += "display:none";
				} else {
					new ui.ImageView({
						superview: this,
						image: cimg,
						x: cx,
						y: cy,
						width: hexwidth,
						height: hexheight
					});
				}
			}
		}
	};

	/*
	 * Layout the scoreboard and molehills.
	 */
	this.build = function () {
		/* The start event is emitted from the start button via the main application.
		 */
		this.on('app:start', start_game_flow.bind(this));

		/* The scoreboard displays the "ready, set, go" message,
		 * the current score, and the end game message. We'll set
		 * it as a hidden property on our class since we'll use it
		 * throughout the game.
		 */
		this._scoreboard = new ui.TextView({
			superview: this,
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

		var x_offset = 5;
		var y_offset = 160;
		var y_pad = 25;
		var layout = [[1, 0, 1], [0, 1, 0], [1, 0, 1]];

		this.style.width = 320;
		this.style.height = 480;

		//bubble
		this.initBubbleGame();
		/*new ui.ImageView({
			superview: this,
			image: img_bbl_r,
			x: 0,
			y: 0,
			width: 50,
			height: 50
		});*/


		this._molehills = [];

		for (var row = 0, len = layout.length; row < len; row++) {
			for (var col = 0; col < len; col++) {
				if (layout[row][col] !== 0) {
					var molehill = new MoleHill();
					molehill.style.x = x_offset + col * molehill.style.width;
					molehill.style.y = y_offset + row * (molehill.style.height + y_pad);
					this.addSubview(molehill);
					this._molehills.push(molehill);

					//update score on hit event
					molehill.on('molehill:hit', bind(this, function () {
						if (game_on) {
							score = score + hit_value;
							this._scoreboard.setText(score.toString());
						}
					}));
				}
			}
		}

		//Set up countdown timer
		this._countdown = new ui.TextView({
			superview: this._scoreboard,
			visible: false,
			x: 260,
			y: -5,
			width: 50,
			height: 50,
			size: 24,
			color: '#FFFFFF',
			opacity: 0.7
		});
	};
});

/*
 * Game play
 */

/* Manages the intro animation sequence before starting game.
 */
function start_game_flow () {
	var that = this;

	animate(that._scoreboard).wait(1000)
		.then(function () {
			that._scoreboard.setText("ready");
		}).wait(1500).then(function () {
			that._scoreboard.setText("set");
		}).wait(1500).then(function () {
			that._scoreboard.setText("go");
			//start game ...
			game_on = true;
			play_game.call(that);
		});
}

/* With everything in place, the actual game play is quite simple.
 * Summon a non-active mole every n seconds. If it's hit, an event
 * handler on the molehill updates the score. After a set timeout,
 * stop calling the moles and proceed to the end game.
 */
function play_game () {
	var i = setInterval(tick.bind(this), mole_interval);
	var	j = setInterval(update_countdown.bind(this), 1000);

	setTimeout(bind(this, function () {
		game_on = false;
		clearInterval(i);
		clearInterval(j);
		setTimeout(end_game_flow.bind(this), mole_interval * 2);
		this._countdown.setText(":00");
	}), game_length);

	//Make countdown timer visible, remove start message if still there.
	setTimeout(bind(this, function () {
		this._scoreboard.setText(score.toString());
		this._countdown.style.visible = true;
	}), game_length * 0.25);

	//Running out of time! Set countdown timer red.
	setTimeout(bind(this, function () {
		this._countdown.updateOpts({color: '#CC0066'});
	}), game_length * 0.75);
}

/* Pick a random, non-active, mole from our molehills.
 */
function tick () {
	var len = this._molehills.length;
	var molehill = this._molehills[Math.random() * len | 0];

	while (molehill.activeMole) {
		molehill = this._molehills[Math.random() * len | 0];
	}
	molehill.showMole();
}

/* Updates the countdown timer, pad out leading zeros.
 */
function update_countdown () {
	countdown_secs -= 1;
	this._countdown.setText(":" + (("00" + countdown_secs).slice(-2)));
}

/* Check for high-score and play the ending animation.
 * Add a click-handler to the screen to return to the title
 * screen so we may play again.
 */
function end_game_flow () {
	var isHighScore = (score > high_score),
			end_msg = "done";

	this._countdown.setText(''); //clear countdown text
	//resize scoreboard text to fit everything
	this._scoreboard.updateOpts({
		text: '',
		x: 10,
		fontSize: 17,
		verticalAlign: 'top',
		textAlign: 'left',
		multiline: true
	});

	//check for high-score and do appropriate animation
	if (isHighScore) {
		high_score = score;
		this._molehills.forEach(function (molehill) {
			molehill.endAnimation();
		});
	} else {
		var i = (this._molehills.length-1) / 2 | 0; //just center mole
		this._molehills[i].endAnimation(true);
	}

	this._scoreboard.setText(end_msg);

	//slight delay before allowing a tap reset
	setTimeout(emit_endgame_event.bind(this), 2000);
}

/* Tell the main app to switch back to the title screen.
 */
function emit_endgame_event () {
	this.once('InputSelect', function () {
		this.emit('gamescreen:end');
		reset_game.call(this);
	});
}

/* Reset game counters and assets.
 */
function reset_game () {
	score = 0;
	countdown_secs = game_length / 1000;
	this._scoreboard.setText('');
	this._molehills.forEach(function (molehill) {
		molehill.resetMole();
	});
	this._scoreboard.updateOpts({
		x: 0,
		fontSize: 38,
		verticalAlign: 'middle',
		textAlign: 'center',
		multiline: false
	});
	this._countdown.updateOpts({
		visible: false,
		color: '#fff'
	});
}


/******************************************************************************************************
*******************************************************************************************************
*******************************************************************************************************
*******************************************************************************************************/

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