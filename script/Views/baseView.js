// global namespace
var VIEWS = VIEWS || {};

//Namespace for handling the shared functionality of the Data(validation/Error) and solution view.
VIEWS.SharedFunctionality = (function(){
	
	/***	Internal methods for the Static class***/
	var createCustomMouseEvent = function(type, x, y,bShiftKey) {
		var e = {bubbles: true, cancelable: (type != "mousemove"), view: window, detail: 0, screenX: x, screenY: y,clientX: x,clientY: y, ctrlKey: false,altKey: false, shiftKey: bShiftKey, metaKey: false, button: 0,relatedTarget: undefined };
		var event = document.createEvent("MouseEvents");
		event.initMouseEvent(type, e.bubbles, e.cancelable, e.view, e.detail, e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, document.body.parentNode);
		return event;
	};
	
	var triggerCustomDrag = function(Node,X,Y) {	
		var node, xMouseDown, yMouseDown, xMouseMove, yMouseMove, xMouseUp, yMouseUp;
		node = d3.select('.node').node();
		xMouseDown = xMouseMove = xMouseUp = 0.1;
		yMouseDown = yMouseMove = yMouseUp = 0.1;
		node.dispatchEvent(createCustomMouseEvent('mousedown', xMouseDown,yMouseDown,false));
		node.dispatchEvent(createCustomMouseEvent('mousemove', xMouseMove,yMouseMove,false));
		node.dispatchEvent(createCustomMouseEvent('mouseup', xMouseUp,yMouseUp,false));
	};
		
	var graphBounds = function(withCola) {
		var x = Number.POSITIVE_INFINITY, X=Number.NEGATIVE_INFINITY, y=Number.POSITIVE_INFINITY, Y=Number.NEGATIVE_INFINITY;	
		if(withCola) {
			myCola.nodes().forEach(function (v) {
				x = Math.min(x, v.x - VIEWS.SharedFunctionality.R * 2);
				X = Math.max(X, v.x);
				y = Math.min(y, v.y  - VIEWS.SharedFunctionality.R * 4);
				Y = Math.max(Y, v.y  + VIEWS.SharedFunctionality.R * 5);
			});
		}
		else {
				d3.selectAll('.node').each(function (v) {
				x = Math.min(x, v.x - VIEWS.SharedFunctionality.R * 2);
				X = Math.max(X, v.x);
				y = Math.min(y, v.y  - VIEWS.SharedFunctionality.R * 4);
				Y = Math.max(Y, v.y  + VIEWS.SharedFunctionality.R * 5);
			});
		}
			return { x: x, X: X, y: y, Y: Y };
	};
	
	var redraw = function(transition) {
		if (VIEWS.SharedFunctionality.nodeMouseDown) return;
		var vis = d3.select("g");
		(transition ? vis.transition() : vis)
			.attr("transform", "translate(" + zoom.translate() + ") scale(" + zoom.scale() + ")");
	};
	
	//The Methods mentioned in the return are exposed as public methods for the Class (Implemented as pure Static).
	return {
		R :15,
		autoLayout:true,
		hasNodeLocationData:false,
		goToInitialStateTriggered: false,
		nodeMouseDown:false,
		
		createMouseEvent :function(type,x,y,bShiftKey) {
			return createCustomMouseEvent(type,x,y,bShiftKey);
		},
		
		createCustomDrag : function(node,x,y) {
			triggerCustomDrag(node,x,y);
		},
		
		switchTabs : function(event) {
			var activeTabIndex = -1;
			var tabNames = ["dataView","dataValidationView"];
			
			for(var i = 0; i < tabNames.length;i++) {
				if(event.target.id == tabNames[i]) {
					activeTabIndex = i;
				} else {
					$("#"+tabNames[i]).removeClass("activeButton");
				}
			}
			$("#"+tabNames[activeTabIndex]).addClass("activeButton");
			
			if(activeTabIndex === 0) {
				VIEWS.DataView.returnToView();
			}
			else if(activeTabIndex === 1) {
				VIEWS.ValidationView.performValidation();
			}	
			else {
				//handling of switching tab for the Solution View.
			}
		},
		
		zoomToFit : function(withCola) {
			var cw = (window.innerWidth * .98) - 160 - (VIEWS.SharedFunctionality.R * 2);
			var ch = (window.innerHeight *.85) + (VIEWS.SharedFunctionality.R * 1);
			var b = graphBounds(withCola);
			var w = b.X - b.x, h = b.Y - b.y;
			var s = Math.min(cw / w, ch / h);
			var tx = (-b.x * s + (cw / s - w) * s / 2);
			var ty = (-b.y * s + (ch / s - h) * s / 2);
			zoom.translate([tx, ty]).scale(s);
			redraw(true);
		},
		
		/** Toggles the auto layout for the Graphs - If Auto layout is false and the Graph has Node locations then as per functionality sets the fixed position to false.**/
		toggleAutoLayout : function() {
				if(VIEWS.SharedFunctionality.autoLayout) {
					$("#autoLayoutToggle").toggleClass("activeButton");
					d3.selectAll(".busIcon").attr("isFixed", function (d) { 
						d.px = d.x;d.py = d.y;
						d.fixed |= 8;
					});
					VIEWS.SharedFunctionality.autoLayout = false;
				}
				else {
					$("#autoLayoutToggle").toggleClass("activeButton");
					
					d3.selectAll(".busIcon").attr("isFixed", function (d) {
						d.px = d.x; d.py = d.y;
						d.fixed &= ~8
					});
					triggerCustomDrag();
					VIEWS.SharedFunctionality.autoLayout = true;
				}
		},
			
		showLayout : function() {	
			var positionObj = {};
			var nodePositions = []
			
			//d3.selectAll(".node").each(function(d){
			myCola.nodes().forEach(function(d){
				if (d) { 
					var pos = {
									"bus_i": d.bus_i,
									"x": d.x,
									"y": d.y
									};
					nodePositions.push(pos);
					positionObj["nodePositions"] = nodePositions;
				}
			});
			//Creating the string object simultaneously.
			var posStringObj = "%% bus location\n";
			posStringObj = posStringObj + "%" + "\t" + "bus_i" + "\t" + "x" + "\t" + "y" + "\n";
			posStringObj = posStringObj + "mpc.buslocation = [\n";
			
			for(var i = 0; i < positionObj.nodePositions.length; i++) {
				var pos = positionObj.nodePositions[i];
				var txt = "\t";
				var objLen = Object.keys(pos).length;
				var index = 1;
				for (x in pos) {
					if(index === objLen) {
						txt += pos[x];
					}
					else {
						txt += pos[x] + "\t";
					}
					index++;
				}
				txt = txt + ";";
				txt = (txt + "\n");
				posStringObj = posStringObj + txt;
			}
			posStringObj = posStringObj + "];";
			$("#AutoDownloadLayout").attr("href", "data:text/plain;charset=ASCII," + encodeURIComponent(posStringObj));
		},
		
		toggleFixedPosition : function() {
			if (VIEWS.SharedFunctionality.hasNodeLocationData) {
				VIEWS.SharedFunctionality.goToInitialStateTriggered = true;
				$("#fixedPosition").removeClass('activeButton');
				triggerCustomDrag();
				var event = document.createEvent("SVGEvents");
				event.initEvent("dragged",true,true);
				($(".node")[0]).dispatchEvent(event);
			}
			else {
				alert("The input network file had no Bus Location Data.");
				/*Investigative Code - Update Initial Position Region begins
				var bRet = confirm("The input network file had no Bus Location Data.\nDo you want to save the current State as the Initial State for the Network.\nPlease note you will have to download the Layout and save it.");
				if(bRet) {
					var positionObj = {};
					var nodePositions = []
					
					//d3.selectAll(".node").each(function(d){
					myCola.nodes().forEach(function(d){
						if (d) { 
							var pos = {
											"bus_i": d.bus_i,
											"x": d.x,
											"y": d.y
											};
							nodePositions.push(pos);
							positionObj["dataObjList"] = nodePositions;
						}
					});
					VIEWS.SharedFunctionality.hasNodeLocationData = true;
					NETWORK_OBJECTS["busLocation"] = positionObj;
				}
				else {
					//log that the user did not want to save the data.
				}
				Investigative Region Ends*/
			}
		},
		
		buttonZoom : function(bShiftKey) {
			var svg = d3.select(".background");
			var CenterX = svg.node().getBBox().width/2;
			var CenterY = svg.node().getBBox().height /2;
			var evt = createCustomMouseEvent('dblclick',CenterX,CenterY,bShiftKey);
			svg.node().dispatchEvent(evt);
		},
		
		getVector : function (x1,y1,x2,y2) {
			return { "x" :x1-x2, "y": y1-y2 };
		},
		
		getNormalizedOrthoVector : function(x,y) {
			var vector = {"x" :x ,"y": y};
		
			var vectorLen = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
			// normalize vector
			vector.x /= vectorLen;
			vector.y /= vectorLen;
		
			return vector;
		},
		
		zoomOnElement : function(eleID) {			
			var neighbourNodes = [];
			var ele = d3.select("#" + eleID);
			var eleData = ele.node().__data__;
			
			if(typeof eleData.DOMID !== 'undefined') {
				eleID = eleData.DOMID;
				d3.selectAll(".edge").each(function(d){
					if(d.source.DOMID === eleID || d.target.DOMID === eleID) {
						neighbourNodes.push(d.source);
						neighbourNodes.push(d.target);
					}
				});
			}
			//Get both the target and the source nodes for a link
			else {
				eleID = eleData.source.DOMID;
				var eleTargetID = eleData.target.DOMID;
				d3.selectAll(".edge").each(function(d){
					if(d.source.DOMID === eleID || d.target.DOMID === eleID || d.source.DOMID === eleTargetID || d.target.DOMID === eleTargetID) {
						neighbourNodes.push(d.source);
						neighbourNodes.push(d.target);
					}
				});
			}
			
			var cw = (window.innerWidth * .98) - 160 - (VIEWS.SharedFunctionality.R * 2);
			var ch = (window.innerHeight *.85) + (VIEWS.SharedFunctionality.R * 1);
			var b;
			
			var x = Number.POSITIVE_INFINITY, X=Number.NEGATIVE_INFINITY, y=Number.POSITIVE_INFINITY, Y=Number.NEGATIVE_INFINITY;	
			neighbourNodes.forEach(function (v) {
				x = Math.min(x, v.x - VIEWS.SharedFunctionality.R * 2);
				X = Math.max(X, v.x);
				y = Math.min(y, v.y  - VIEWS.SharedFunctionality.R * 2);
				Y = Math.max(Y, v.y  + VIEWS.SharedFunctionality.R * 5);
			});

			var b = { x: x, X: X, y: y, Y: Y };
			var w = b.X - b.x, h = b.Y - b.y;
			var s = Math.min(cw / w, ch / h);
			var tx = (-b.x * s + (cw / s - w) * s / 2);
			var ty = (-b.y * s + (ch / s - h) * s / 2);
			zoom.translate([tx, ty]).scale(s);
			
			var vis = d3.select("g");
			vis .transition().duration(750) .attr("transform", "translate(" + zoom.translate() + ") scale(" + zoom.scale() + ")");
		},
	};
})();