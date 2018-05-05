var BubbleVisualDebug = (function(){
	var hexwidth = Math.sqrt(3)*25;
	var hexheight = 50;
	var circleradius = hexwidth;
	var mousex, mousey, bubblex, bubbley;
	var activeTick = 0;

	var init = function() {
		jQuery("#bubblegrid").css("width",(8*hexwidth)+(0.5*hexwidth)+"px").css("height",(6*1.5*hexheight)+(0.25*hexheight)+"px").css("background-color","gray");
		//jQuery("#bubblegrid").css("width",(8*hexwidth)+(0.5*hexwidth)+"px").css("height",(5*1.75*hexheight)+"px").css("background-color","gray");
		BubbleGame.initGrid();
		var grid = BubbleGame.getGrid();
		for(var x = 0; x < grid.length; x++) {
			for(var y = 0; y < grid[x].length/2; y++) {
				//hexagons
				/*
				//even
				var style = "top:"+(hexheight*y+(0.5*hexheight*y))+"px;"+"left:"+(hexwidth*x)+"px;"+"background-color:"+grid[x][y].getColorName()+";";
				jQuery("#bubblegrid").append("<div id='"+x+"_"+y+"' class='hexagon' style='"+style+"'></div>");
				// odd
				var style = "top:"+(hexheight*(y+0.75)+(0.5*hexheight*y))+"px;"+"left:"+(hexwidth*(x+0.5))+"px;"+"background-color:"+grid[x][y+1].getColorName()+";";
				jQuery("#bubblegrid").append("<div id='"+x+"_"+(y+1)+"' class='hexagon' style='"+style+"'></div>");
				*/
				//circles
				var style = "top:"+(hexheight*y+(0.5*hexheight*y))+"px;"+"left:"+(hexwidth*x)+"px;"+"background-color:"+grid[x][y].getColorName()+";";
				if(grid[x][y].isNull) {
					style += "display:none";
				}
				jQuery("#bubblegrid").append("<div id='"+x+"_"+(y*2)+"' class='circle' style='"+style+"'></div>");
				// odd
				var style = "top:"+(hexheight*(y+0.75)+(0.5*hexheight*y))+"px;"+"left:"+(hexwidth*(x+0.5))+"px;"+"background-color:"+grid[x][y+1].getColorName()+";";
				if(grid[x][y+1].isNull) {
					style += "display:none";
				}
				jQuery("#bubblegrid").append("<div id='"+x+"_"+((y*2)+1)+"' class='circle' style='"+style+"'></div>");
			}
		}
		var centerw = (((8*hexwidth)+(0.5*hexwidth)) / 2) - (0.5*hexwidth);
		var style = "top:"+(hexheight*(5+0.75)+(0.5*hexheight*5))+"px;left:"+centerw+"px;background-color:red;";
		jQuery("#bubblegrid").append("<div id='loaded' class='circle' style='"+style+"'></div>");
		var style = "top:"+(hexheight*(5+0.75)+(0.5*hexheight*5))+"px;left:0px;";
		jQuery("#bubblegrid").append("<div id='next' class='circle' style='"+style+"'></div>");
	};

	var renderBubbles = function() {
		jQuery("#bubblegrid").html("");
		var grid = BubbleGame.getGrid();
		for(var x = 0; x < grid.length; x++) {
			for(var y = 0; y < grid[x].length/2; y++) {
				//circles
				var style = "top:"+(hexheight*y+(0.5*hexheight*y))+"px;"+"left:"+(hexwidth*x)+"px;"+"background-color:"+grid[x][y].getColorName()+";";
				if(grid[x][y].isNull) {
					style += "display:none";
				}
				jQuery("#bubblegrid").append("<div id='"+x+"_"+y+"' class='circle' style='"+style+"'></div>");
				// odd
				var style = "top:"+(hexheight*(y+0.75)+(0.5*hexheight*y))+"px;"+"left:"+(hexwidth*(x+0.5))+"px;"+"background-color:"+grid[x][y+1].getColorName()+";";
				if(grid[x][y+1].isNull) {
					style += "display:none";
				}
				jQuery("#bubblegrid").append("<div id='"+x+"_"+(y+1)+"' class='circle' style='"+style+"'></div>");
			}
		}
		var loadedb = BubbleGame.getLoadedBubble();
		var lx = loadedb.activex;
		var ly = loadedb.activey;
		var gridw = g_gridsizex * g_hexwidth + (g_hexwidth/2);
		var gridh = (g_gridsizey/2) * (g_hexheight*1.75);
		var xy = [lx/gridw*jQuery("#bubblegrid").width(), ly/gridh*jQuery("#bubblegrid").height()];
		//var centerw = (((8*hexwidth)+(0.5*hexwidth)) / 2) - (0.5*hexwidth);
		var style = "top:"+xy[1]+"px;left:"+xy[0]+"px;background-color:red;";
		jQuery("#bubblegrid").append("<div id='loaded' class='circle' style='"+style+"'></div>");
		var style = "bottom:0px;left:0px;";
		jQuery("#bubblegrid").append("<div id='next' class='circle' style='"+style+"'></div>");
	};

	var tick = function() {
		renderBubbles();
	};

	var clicked = function(event) {
		if(activeTick != 0) {
			return;
		}
		BubbleGame.shootBubble(event.clientX, event.clientY);
		activeTick = setInterval(tick,30);
	};

	var movement = function(event) {
		var x1 = jQuery("#loaded").css("left");
		x1 = parseFloat(x1.slice(0,x1.length-2)) + (hexwidth/2);
		var y1 = jQuery("#loaded").css("top");
		y1 = parseFloat(y1.slice(0,y1.length-2)) + (hexheight/2);
		var angleRadians = Math.atan2(event.clientY - y1, event.clientX - x1);
		var angleDeg = Math.atan2(event.clientY  - y1, event.clientX - x1) * 180 / Math.PI;
		jQuery("#mousex").html("x:"+event.clientX);
		jQuery("#mousey").html("y:"+event.clientY);
		jQuery("#anglerad").html("rad:"+angleRadians);
		jQuery("#angledeg").html("deg:"+angleDeg);
	};

	return {
		"init":init,
		"renderBubbles":renderBubbles,
		"clicked":clicked,
		"movement":movement
	};
})();

BubbleVisualDebug.init();