var BubbleVisualDebug = (function(){
	var hexwidth = Math.sqrt(3)*25;
	var hexheight = 50;
	var circleradius = hexwidth;
	var mousex, mousey, bubblex, bubbley;
	var getMouseAngle = function() {
		Math.atan2(mousey-bubbley,mousex,bubblex);
	};

	var init = function() {
		jQuery("#bubblegrid").css("width",(8*hexwidth)+(0.5*hexwidth)+"px").css("min-height",(6*1.5*hexheight)+(0.25*hexheight)+"px").css("background-color","gray");
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
		var centerw = (((8*hexwidth)+(0.5*hexwidth)) / 2) - (0.5*hexwidth);
		var style = "bottom:0px;left:"+centerw+"px;background-color:red;";
		jQuery("#bubblegrid").append("<div id='loaded' class='circle' style='"+style+"'></div>");
		var style = "bottom:0px;left:0px;";
		jQuery("#bubblegrid").append("<div id='next' class='circle' style='"+style+"'></div>");
	};

	return {
		"init":init,
		"renderBubbles":renderBubbles
	};
})();

BubbleVisualDebug.init();