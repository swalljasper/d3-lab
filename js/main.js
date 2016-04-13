(function(){

	var attrArray = ["Foreign","Poverty","Unemployed","Uninsured","Rent"];
	var expressed = attrArray[0];

	var chartWidth = window.innerWidth * 0.4,
		chartHeight = 560,
		leftPadding = 35,
		rightPadding = 2,
		topBottemPadding = 5,
		chartInnerWidth = chartWidth - leftPadding - rightPadding,
		chartInnerHeight = chartHeight - topBottemPadding * 2,
		translate = "translate(" + leftPadding + "," + topBottemPadding + ")";

	var yScale = d3.scale.linear()
		.range([0, chartHeight])
		.domain([0, 0.5]); //need to make dynamic

	var xScale = d3.scale.linear()
		.range([0, chartWidth])
		.domain([0, 118])


window.onload = setMap();

function setMap(){
	var width = window.innerWidth * 0.5,
		height = 560;

	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	var projection = d3.geo.azimuthalEquidistant()
		.center([0, 44.9686414])
		.rotate([93.27,0,0])
		.scale(200000)
		.translate([width / 2, height / 2]);

	var path = d3.geo.path()
		.projection(projection);



	d3_queue.queue()
		.defer(d3.csv, "../data/data-reconfigured.csv")
		.defer(d3.json, "../data/CensusTracts.json")
		.defer(d3.json, "../data/Water.json")
		.await(callback);

	function callback(error, csvData, tracts, water){

		var hydro = topojson.feature(water, water.objects.Water),
            censusTracts = topojson.feature(tracts, tracts.objects.censusTracts).features;

       
        censusTracts = joinData(censusTracts, csvData)

        var colorScale = makeColorScale(csvData);

        setEnumerationUnits(censusTracts, map, path, colorScale);

        setChart(csvData, colorScale);

        var lakesRivers = map.append("path")
        	.datum(hydro)
        	.attr("class", "lakesRivers")
        	.attr("d", path);

        createDropdown(csvData);

        console.log(censusTracts)
 
		
	}

}

function makeColorScale(data){
        	var colorClasses = [
        		"#eff3ff",
        		"#bdd7e7",
        		"#6baed6",
        		"#3182bd",
        		"#08519c"
    		];

    		var colorScale = d3.scale.quantile()
    			.range(colorClasses);

    		

    		var domainArray = [];
    		for (var i=0; i<data.length; i++){
    			var val = parseFloat(data[i][expressed]);
    			domainArray.push(val);
    		}

    		var clusters = ss.ckmeans(domainArray, 5);

    		domainArray = clusters.map(function(d){
    			return d3.min(d);
    		});

    		domainArray.shift();

    		colorScale.domain(domainArray);

    		return colorScale;


};



function setEnumerationUnits(censusTracts, map, path, colorScale){

	var zones = map.selectAll(".zones")
		.data(censusTracts)
		.enter()
		.append("path")
		.attr("class", function(d){
			return "zones ID" + d.properties.GEOID;
		})
		.attr("d", path)
		.style("fill", function(d){
			return choropleth(d.properties, colorScale);
		})
		.on("mouseover", function(d){
			highlight(d.properties);
		})
		.on("mouseout", function(d){
			dehighlight(d.properties);
		})
		.on("mousemove", moveLabel);

	var desc = zones.append("desc")
		.text('{"stroke": "#CCC", "stroke-width": "0.5px"}');
};

function joinData(censusTracts, csvData){

	for (var i=0; i<csvData.length; i++){
        	var csvCT = csvData[i];
        	var csvKey = csvCT.ID;

        	for (var a=0; a<censusTracts.length; a++){

        		var geojsonProps = censusTracts[a].properties;
        		var geojsonKey = geojsonProps.GEOID;

        		if (geojsonKey == csvKey){
        			attrArray.forEach(function(attr){
        				var val = parseFloat(csvCT[attr]);
        				geojsonProps[attr] = val;
        			});
        		};
        	};
        };

    return censusTracts; 

};

		
function setGraticule(map, path){

		var graticule = d3.geo.graticule()
			.step([0.01, 0.01]);

		var gratBackground = map.append("path")
			.datum(graticule.outline())
			.attr("class", "gratBackground")
			.attr("d", path)

		var gratLines = map.selectAll(".gratLines")
			.data(graticule.lines())
			.enter()
			.append("path")
			.attr("class", "gratLines")
			.attr("d", path);
};

function choropleth(props, colorScale){
	var val = parseFloat(props[expressed]);

	if (val && val != NaN){
		return colorScale(val);
	} else {
		return "#CCC"
	};
};

function setChart(csvData, colorScale){

	var chart = d3.select("body")
		.append("svg")
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("class", "chart");

	var chartBackground = chart.append("rect")
		.attr("class", "chartBackground")
		.attr("width", "chartInnerWidth")
		.attr("height", "chartInnerHeight")
		.attr("transform", "translate");

	var bars = chart.selectAll(".bars")
		.data(csvData)
		.enter()
		.append("rect")
		.sort(function(a, b){
			return b[expressed]-a[expressed]
		})
		.attr("class", function(d){
			return "bar ID" + d.ID;
		})
		.attr("width", chartInnerWidth/ csvData.length - 1)
		.on("mouseover", highlightBars)
		.on("mouseout", dehighlightBars)
		.on("mousemove", moveLabel);

	var desc = bars.append("desc")
		.text('{"stroke": "#fff", "stroke-width": "0.5px"}');
		

	var chartTitle = chart.append("text")
		.attr("x", 60)
		.attr("y", 20)
		.attr("class", "chartTitle")
		.text(expressed + " in each CensusTracts")

	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left");

	var axis = chart.append("g")
		.attr("class", "axis")
		.attr("transform", translate)
		.call(yAxis)

	updateChart(bars, csvData.length, colorScale);
 };

 function createDropdown(csvData){
 	var dropdown = d3.select("body")
 		.append("select")
 		.attr("class", "dropdown")
 		.attr("x", 10)
 		.attr("y", 100)
 		.on("change", function(){
 			changeAttribute(this.value, csvData)
 		});

 	var titleOption = dropdown.append("option")
 		.attr("class", "titleOption")
 		.attr("disabled", "true")
 		.text("Select Attribute");

 	var attrOptions = dropdown.selectAll("attrOptions")
 		.data(attrArray)
 		.enter()
 		.append("option")
 		.attr("value", function(d){ return d })
 		.text(function(d){ return d });
 };

 function changeAttribute(attribute, csvData){
 	expressed = attribute;

 	var colorScale = makeColorScale(csvData);

 	var zones = d3.selectAll(".zones")
 		.transition()
 		.duration(1000)
 		.style("fill", function(d){
 			return choropleth(d.properties, colorScale)
 		})

 	var bars = d3.selectAll(".bar")
 		.sort(function(a, b){
 			return b[expressed] - a[expressed];
 		})
 		.transition()
 		.delay(function(d,i){
 			return i * 20
 		})
 		.duration(1000);

 	updateChart(bars, csvData.length, colorScale)
 		
 }

function updateChart(bars, n, colorScale){
	bars.attr("x", function(d, i){
		return i * (chartInnerWidth / n) + leftPadding;
	})
	.attr("height", function(d, i){
		return 560 - yScale(parseFloat(d[expressed]));
	})
	.attr("y", function(d, i){
		return yScale(parseFloat(d[expressed])) + topBottemPadding;
	})
	.style("fill", function(d){
		return choropleth(d, colorScale);
	});
}

function highlight(props){
	
	var selected = d3.selectAll(".ID" + props.GEOID)
		.style({
			"stroke": "#000",
			"stroke-width": "3"
		});

	setLabel(props);

};

function dehighlight(props){
	var selected = d3.selectAll(".ID" + props.GEOID)
		.style({
			"stroke": function(){
				return getStyle(this, "stroke")
			},
			"stroke-width": function(){
				return getStyle(this, "stroke-width")
			}
		});


	function getStyle(element, styleName){
		var styleText = d3.select(element)
			.select("desc")
			.text();

		var styleObject = JSON.parse(styleText);

		return styleObject[styleName];

		d3.select(".infolabel")
			.remove();

	};


};

function highlightBars(props){
	
	var selected = d3.selectAll(".ID" + props.ID)
		.style({
			"stroke": "#000",
			"stroke-width": "3"
		});

	setLabel(props);

};

function dehighlightBars(props){
	var selected = d3.selectAll(".ID" + props.ID)
		.style({
			"stroke": function(){
				return getStyle(this, "stroke")
			},
			"stroke-width": function(){
				return getStyle(this, "stroke-width")
			}
		});


	function getStyle(element, styleName){
		var styleText = d3.select(element)
			.select("desc")
			.text();

		var styleObject = JSON.parse(styleText);

		return styleObject[styleName];

		d3.select(".infolabel")
			.remove();

	};


};

function setLabel(props){
	var labelAttribute = "<h1>" + props[expressed] +
		"</h1><b>" + expressed + "</b>";

	var infolabel = d3.select("body")
		.append("div")
		.attr({
			"class": "infolabel",
			"id": props.ID + "_label"
		})
		.html(labelAttribute);

	var regionName = infolabel.append("div")
		.attr("class", "labelname")
		.html(props.name);
};

function moveLabel(){

	var labelWidth = d3.select(".infolabel")
		.node()
		.getBoundingClientRect()
		.width;

	var x1 = d3.event.clientX + 10
	var y1 = d3.event.clientY - 75
	var x2 = d3.event.clientX - labelWidth - 10
	var y2 = d3.event.clientY + 25;

	var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;

	var y = d3.event.clientY < 75 ? y2 : y1;

	d3.select(".infolabel")
		.style({
			"left": x + "px",
			"top": y + "px"
		});
};



})();

