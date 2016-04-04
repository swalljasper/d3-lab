window.onload = setMap();

function setMap(){
	var width = 960,
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

		// var graticule = d3.geo.graticule()
		// 	.step([0.01, 0.01]);

		// var gratBackground = map.append("path")
		// 	.datum(graticule.outline())
		// 	.attr("class", "gratBackground")
		// 	.attr("d", path)

		// var gratLines = map.selectAll(".gratLines")
		// 	.data(graticule.lines())
		// 	.enter()
		// 	.append("path")
		// 	.attr("class", "gratLines")
		// 	.attr("d", path);

		var hydro = topojson.feature(water, water.objects.Water),
            censusTracts = topojson.feature(tracts, tracts.objects.censusTracts).features;

        var mplsCensusTracts = map.selectAll(".regions")
        	.data(censusTracts)
        	.enter()
        	.append("path")
        	.attr("class", function(d){
        		return "mplsCensusTracts " + d.properties.adm1_code;
        	})
        	.attr("d", path);

        var lakesRivers = map.append("path")
        	.datum(hydro)
        	.attr("class", "lakesRivers")
        	.attr("d", path);

        var attrArray = ["frn_brn", "pvrty", "rent", "unemp", "unins"];

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

        var colorScale = makeColorScale(csvData);

        setEnumerationUnits(censusTracts, map, path, colorScale);

        

        console.log(csvData)
        console.log(censusTracts)
		
	}

}

function makeColorScale(data){
        	var colorClasses = [
        		"#D4B9DA",
        		"#C994C7",
        		"#DF65B0",
        		"#DD1C77",
        		"#980043"
    		];

    		var colorScale = d3.scale.quantile()
    			.range(colorClasses);

    		

    		var domainArray = [];
    		for (var i=0; i<data.length; i++){
    			console.log(data[i]);
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

	var cenTract = map.selectAll(".regions")
		.data(censusTracts)
		.enter()
		.append("path")
		.attr("class", function(d){
			return "censusTracts " + d.properties.ID;
		})
		.attr("d", path)
		.style("fill", function(d){
			return colorScale(d.properties[expressed]);
		});
};






