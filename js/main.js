window.onload = setMap();

function setMap(){
	var width = 960,
		height = 460;

	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	var projection = d3.geo.azimuthalEquidistant()
		.center([-93.26208, 44.9686414])
		.rotate([0,0,0])
		.scale(125000)
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

            console.log(hydro)
            console.log(censusTracts)

        var mplsCensusTracts = map.selectAll(".regions")
        	.data(censusTracts)
        	.enter()
        	.append("path")
        	.attr("class", function(d){
        		return "mplsCensusTracts " + d.properties.adm1_code;
        	})
        	.attr("d", path);

        var lakesRivers = map.append("path")
        	.datum(censusTracts)
        	.attr("class", "lakesRivers")
        	.attr("d", path);
		
	}




}
