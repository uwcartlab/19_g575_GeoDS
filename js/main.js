/* GEOG 575 Final Project by GeoDS, April 24, 2019 */


//function to instantiate the Leaflet map

var income_highest = 100000;
var rent_highest = 100000;
var unemploy_highest = 100000;

function createMap(){
    //create the map
    var map = L.map('map', {
        center: [45,-90.5],
        zoom: 7,
        maxZoom: 13,
        minZoom: 6,
        maxBounds: [[40, -85], [50, -95]]
    });
	
	
    //add OSM base tilelayer
   L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' +'<br>Data sources: United States Census Bureau <br> Creator: Yunlei Liang; Yuhao Kang'
    }).addTo(map);

	
	//initial map with the proportional symbol map
    getDataChoro(map);

	CreateLegend(map);
	//create the map title
	//createTitle(map); 

	//create the refresh button
	L.Control.Refresh = L.Control.extend(
	{
		options:
		{
			position:'topright',
		},
		onAdd: function(map) {
			var img = L.DomUtil.create('img');

			img.src = '/img/logo.png';
			img.style.width = '40px';

			L.DomEvent.addListener(img,'click',function(){
				refreshMap(map);
			});			
			return img;
		},

		onRemove: function(map) {
			// Nothing to do here
		}
	});

	L.control.Refresh = function(opts) {
		return new L.Control.Refresh(opts);
	}

	L.control.Refresh({ position: 'topright' }).addTo(map);
	

	//get the data for generate the histogram
	d3.csv("/data/travel_distance_WI_his.csv").then(callback);
	
	expressed = "distance_from_home";
	function callback(data){
		var colorScale = makeColorScale(data);

		setChart(data,colorScale);
	};
	
};



function refreshMap(map){
	removeLayers(map);
	getDataChoro(map);
}

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
		'#FFEDA0',
		'#FED976',
		'#FEB24C',
		"#FD8D3C",
		"#FC4E2A",
		"#E31A1C",
		"#BD0026",
        "#800026"			
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i]["Count_of_distance_from_home"]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
	interval = colorScale.quantiles();
	
    return colorScale;
};

//function to create coordinated bar chart
function setChart(csvData,colorScale){

	var w = window.innerWidth * 0.55, h = window.innerHeight * 0.20,
		translate = "translate(" + 3 + "," + 5 + ")";
    //Example 1.5 line 1...container block
    var chart = d3.select("#vis_travel") //get the <body> element from the DOM
        .append("svg") //put a new svg in the body
        .attr("width", w) //assign the width
        .attr("height", h) //assign the height
        .attr("class", "chart"); //assign a class name
	
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", w*0.95)
        .attr("height", h); //svg background color	

	
    var bars = chart.selectAll(".bar_distance")
        .data(csvData)
        .enter()
        .append("rect")
		.style("stroke-width","0")
        .attr("class", function(d){
            return "bar_distance"+ d.RowLabels;
        })
        .attr("width",w/csvData.length-5)
		.on("mouseover", highlight)
        .on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
	
	
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    var chartTitle = chart.append("text")
        .attr("x", w-450)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("The Histogram of Average Travel Distance");
		
	var yScale = d3.scaleLinear()
	.range([150,0])
	.domain([0, 1645]);       
 
 //create vertical axis generator
    var yAxis = d3.axisRight()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
		.attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", w*0.95)
        .attr("height", h*0.96)
		.attr("transform", translate);
		
	//set bar positions, heights and colors
	updateChart(bars, csvData.length, colorScale);

};

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
	//chart frame dimensions
	var chartWidth = window.innerWidth * 0.5,
	chartHeight = window.innerHeight * 0.20,
	leftPadding = 1,
	rightPadding = 1,
	topBottomPadding = 5,
	chartInnerWidth = chartWidth - leftPadding - rightPadding,
	chartInnerHeight = chartHeight - topBottomPadding,
	translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
	
	//create a scale to size bars proportionally to frame
	var yScale = d3.scaleLinear()
	.range([100,0])
	.domain([0, 1645]);
	
	expressed="Count_of_distance_from_home";

    //position bars
    bars.attr("x", function(d, i){
            return i * (chartWidth/ n-2) + leftPadding+ 40;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
		.style("fill", function(d){
            return choropleth(d, colorScale);
        });;

};

//function to highlight enumeration units and bars
function highlight(props){

    //change stroke
	//console.log(props.RowLabels);
    var selected = d3.selectAll(".bar_distance"+props.RowLabels)
        .style("stroke","blue")
		.style("stroke-width","2")
	setLabel(props);
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "data range:"+props.RowLabels;
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.RowLabels + "_label")
        .html(labelAttribute);
    console.log(infolabel);

	var datarange = 'frequency:' + props["Count_of_distance_from_home"];
    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(datarange);
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
	    .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY + 40,
        x2 = d3.event.clientX - labelWidth + 10,
        y2 = d3.event.clientY - 80;
	console.log(d3.event.clientX,d3.event.clientY);
    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth*0.5 - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 680 ? y1 : y2; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll(".bar_distance"+props.RowLabels)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
	
	d3.select(".infolabel")
        .remove();
};


//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props["Count_of_distance_from_home"]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//add the title to the map
function createTitle(map){
	//add a new control to the map to show the text content
    var TitleControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'title-container');
			
			//specify the title content
			var content = "Social Mobility in Wisconsin";

			//replace legend content
			$(container).append(content);
			
			//disable click inside the container
			L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new TitleControl());

};



//specify the color based on a give value
function getColor(d) {
    return d < 7949 ? '#800026' :
           d < 9874 ? '#BD0026' :
           d < 15255  ? '#E31A1C' :
           d < 30296  ? '#FC4E2A' :
           d < 72341 ? '#FD8D3C' :
           d < 189868  ? '#FEB24C' :
           d < 518393  ? '#FED976' :
                     '#FFEDA0';
}

//a customized function to style the new feature 
function style(feature, attributes){

	var attribute = attributes[0];
   
    return {
        fillColor: getColor(feature.properties[attribute]),
        weight: 0.4,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function removeLayers(map){
	
	map.eachLayer(function (layer) {
		map.removeLayer(layer);
	});
	
	//add OSM base tilelayer
   L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' +'<br>Data sources: United States Census Bureau <br> Creator: Yunlei Liang, Yuhao Kang'
	}).addTo(map);

	
};

//a customized function for each feature in the polygon of the choropleth map
function onEachFeatureInitial(feature,attributes,map,layer){

	var attribute = attributes[0];		
	var popupContent = "<p><b>County:</b> " + feature.properties.travel_d_3 + "</p>";
	popupContent += "<p><b>CensusBlock:</b> " + feature.properties.travel_d_4 + "</p>";
    popupContent += "<p><b>AverageTravelDistance:</b>"  + feature.properties[attribute]+ " meters";
	
	layer.bindPopup(popupContent);
	
    layer.on({
        mouseover: function(){
			this.openPopup();
		},
		mouseout: function(){
			this.closePopup();
		},
		click: function(){

			removeLayers(map);
			
			var cbg_d = this.feature.properties.WI_cbgs_Ce;
			
			d3.csv("/data/cbg_alldata.csv").then(callback);
	
			function callback(data){
				var HighlightData = [];
				for (i =0; i<data.length; i++){
					if (cbg_d == data[i]["cbg_d"]){
						HighlightData.push(data[i]);
					}
				}
				console.log("Highlighted data:",HighlightData);
				if (HighlightData.length == 0){
					alert("The cbg you just cliced has no connected cbg in the dataset. Please try others.");
				}
				HighlightFeatures(HighlightData,map,cbg_d);
				//AddGrayFeatures(map);
				
			};
		//console.log(this.getBounds().getCenter());
		this.addTo(map);
		map.setView(this.getBounds().getCenter(),10);
		}
			
    });

};

function highlightCBG(e,map){
	
	//var layer = e.target;
	e.addTo(map);
	
};


function HighlightFeatures(data,map,cbg_d){
	$.ajax("data/WI_cbg_TravelDis.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response,"travel_d_4");
			//get the generated map layer
			AddHighlight(response,map,attributes,data,cbg_d);
        }
    });

};


//create the choropleth map
function AddHighlight(response, map, attributes,data,cbg_d){
	
    //create a Leaflet GeoJSON layer
    L.geoJson(response, {
		onEachFeature: function(feature,layer){
			return onEachFeatureHighlight(feature,attributes,map,layer,data)
		},
		style: function (feature) {		
			return styleHightlighted(feature,attributes,data,cbg_d);			
		}	
    }).addTo(map);

};


function onEachFeatureHighlight(feature,attributes,map,layer,data){

	for (i=0; i<data.length; i++){
		if (feature.properties.travel_d_4 == data[i]["cbg_o"]){
            //console.log(data[i]);
			var popupContent = "<p><b>Origin CensusBlock:</b> " + data[i]["cbg_d"] + "</p>";
			popupContent += "<p><b>Total Visits: </b>"  + data[i]["number"]+ " times";
			//popupContent += "<p><b>Income: </b>$"  + data[i]["income"]+ "00/year";
			//popupContent += "<p><b>Housing Rent: </b>$"  + data[i]["rent"]+ "/month";
			//popupContent += "<p><b>Unemployment Ratio: </b>"  + data[i]["unemploy_ratio"]+ "%";
			layer.bindPopup(popupContent);
			
			layer.on({
				mouseover: function(){
					this.openPopup();
				},
				mouseout: function(){
					this.closePopup();
				}
					
			});
		};
		
	}
	layer.on({
		click: function(){

			removeLayers(map);
			
			var cbg_d = this.feature.properties.WI_cbgs_Ce;
			
			d3.csv("/data/cbg_alldata.csv").then(callback);
	
			function callback(data){
				var HighlightData = [];
				for (i =0; i<data.length; i++){
					if (cbg_d == data[i]["cbg_d"]){
						HighlightData.push(data[i]);
					}
				}
				console.log("Highlight data:", HighlightData);
				if (HighlightData.length == 0){
					alert("The cbg you just cliced has no connected cbg in the dataset. Please try others.");
				}
				HighlightFeatures(HighlightData,map,cbg_d);
				//AddGrayFeatures(map);
				
			};
		//console.log(this.getBounds().getCenter());
		this.addTo(map);
		map.setView(this.getBounds().getCenter(),10);
		}
			
	});

};

function styleHightlighted(feature,attributes,data,cbg_d){

//	var checkExistence = checkExistence(feature.properties.travel_d_4,data);
	
	for (i=0; i<data.length; i++){
		if (feature.properties.travel_d_4 == data[i]["cbg_o"]&&(parseFloat(data[i]["income"])<income_highest)&&(parseFloat(data[i]["rent"])<rent_highest)&&(parseFloat(data[i]["unemploy_ratio"])<unemploy_highest)){			
			return {
			fillColor: "#FFFF00",
			weight: 0.4,
			stroke: '#999',
			opacity: 1,
			color: 'gray',
			fillOpacity: 10
		} 
		};
		
	}
	if (feature.properties.travel_d_4 == cbg_d){
		return {
			fillColor: "#B22222",
			weight: 0.4,
			stroke: '#999',
			opacity: 1,
			color: 'gray',
			fillOpacity: 0.8
		}
		
	}
	return {
			fillColor: "#CCC",
			weight: 0.4,
			opacity: 1,
			color: 'white',
			fillOpacity: 0.4
		} 	

};




//generate the choropleth map data and the two layer control
function getDataChoro(map){
    //load the data
    $.ajax("data/WI_cbg_TravelDis.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response,"travel_d_1");
			//get the generated map layer
			createChoropleth(response, map, attributes);
        }
    });
	
};


//create the choropleth map
function createChoropleth(response, map, attributes){

    //create a Leaflet GeoJSON layer
    var geojson1 = L.geoJson(response, {
		onEachFeature: function(feature,layer){
			return onEachFeatureInitial(feature,attributes,map,layer)
		},
		style: function (feature) {		
			return style(feature, attributes);			
		}
    });
    
    geojson1.addTo(map);

	//return the geojson layer for display
	return geojson1;

};

function CreateLegend(map){
	//generate the legend for the choropleth map
	var legend1 = L.control({position: 'topleft'});

	legend1.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend'),
			grades = [7949, 9874, 15255, 30296, 72341, 189868, 518393, 1436719],
			labels = [];
			
		var content = "Average Travel Distance (meters)<br>";
		$(div).append(content);

		// loop through our density intervals and generate a label with a colored square for each interval
		for (var i = 0; i < grades.length; i++) {
			div.innerHTML +=
				'<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
				grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
		}			

		return div;
	};
	legend1.addTo(map);	

};



//build an attributes array from the data
function processData(data,field){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf(field) > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};


//generate the choropleth map data and the two layer control
function getDataChoro(map){
    //load the data
    $.ajax("data/WI_cbg_TravelDis.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response,"travel_d_1");
			//get the generated map layer
			createChoropleth(response, map, attributes);
        }
    });
	
};

function AddGrayFeatures(map){
    $.ajax("data/WI_cbg_TravelDis.geojson", {
        dataType: "json",
        success: function(response){
			//create a Leaflet GeoJSON layer
			var geojson1 = L.geoJson(response, {
				style: function (feature) {		
					return style1(feature);			
				}
			});
			
			geojson1.addTo(map);
        }
    });
			
};

function style1(feature){
   
    return {
        fillColor:"#808080",
        weight: 0.4,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}



var svg_income = d3.select("#vis_income")
    .append("svg")
    .attr("width",400)
    .attr("height",200);

var svg_rent = d3.select("#vis_rent")
    .append("svg")
    .attr("width",400)
    .attr("height",200);

var svg_unemploy = d3.select("#vis_unemploy")
    .append("svg")
    .attr("width",400)
    .attr("height",200);


// Load csv data
//realize the function of flitering income histogram
d3.csv("data/geog575.csv", function(d){
    return {
    census_block_group : d.census_block_group,
    visitor_home_cbgs : d.visitor_home_cbgs,
    income : d.income,
    rent: d.rent,
    unemploy_ratio: d.unemploy_ratio
  };
}
).then(function(data){
    var income = [];
    var rent = [];
    var unemploy_ratio = [];

    data.forEach(element => {
        income.push(parseInt(element.income));
        rent.push(parseInt(element.rent));
        unemploy_ratio.push(parseFloat(element.unemploy_ratio));
    });

    var formatCount = d3.format(",.0f");

    incomeHistogram(income, formatCount);
    rentHistogram(rent, formatCount);
    unemployHistogram(unemploy_ratio, formatCount);

})

$(document).ready(createMap);

function incomeHistogram(income, formatCount) {
    //var svg = d3.select("svg"), margin = { top: 50, right: 30, bottom: 100, left: 30 }, width = +svg.attr("width") - margin.left - margin.right, height = +svg.attr("height") - margin.top - margin.bottom, g = svg_income.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var svg = d3.select("svg"), margin = { top: 20, right: 0, bottom: 50, left: 50 }, width = +svg.attr("width") - margin.left - margin.right, height = +svg.attr("height") - margin.top - margin.bottom, g = svg_income.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var x = d3.scaleLinear()
        .rangeRound([0, width])
        .domain([0, d3.max(income)]);
    var bins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(30))(income);
    var y = d3.scaleLinear()
        .domain([0, d3.max(bins, function (d) { return d.length; })])
        .range([height, 0]);
    var bar_income = g.selectAll(".bar")
        .data(bins)
        .enter().append("g")
        .attr("class", "bar_income")
        .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .style("fill", function (d) {
            return "#000";
        });
    bar_income.append("rect")
        .attr("class", "income_rect")
        .attr("x", 1)
        .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
        .attr("height", function (d) { return height - y(d.length); })
        .style("fill", function (d) {
            return "#eaeaea";
        });
    bar_income.append("text")
        //.attr("dy", "0em")
        .attr("y", -5)
        .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
        .attr("text-anchor", "middle")
        .text(function (d) { return formatCount(d.length); });
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    var currentValue = 0;
    var slider = svg_income.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + (margin.top + 150) + ")");
    slider.append("line")
        .attr("class", "track")
        //.attr("x1", x.range()[0])
        .attr("x1", function(){
            //console.log(x.range());
        })
            //.range()[0])
        .attr("x2", x.range()[1])
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function () { slider.interrupt(); })
            .on("start drag", function () {
                currentValue = d3.event.x;
                update_income(x.invert(currentValue));
            }));
    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(x.ticks(10))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function (d) {
            return d;
        });
    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);
    function update_income(h) {
        income_highest = h;
        //console.log(income_highest);
        handle.attr("cx", x(h));
		if (income_highest < 0){
			income_highest = 100000;
		}
        // filter data set and redraw plot
        var newData = income.filter(function (d) {
            return d < h;
        });
        var bar_income = d3.selectAll(".income_rect")
            .style("fill", function (d) {
                //console.log(d);
                if (d.x0 < h) {
                    return coloursIncome(d.x0);
                }
                else {
                    return "#eaeaea";
                }
            });
    }
    // set color of income histogram
    var colorClasses = [
        '#fff5eb',
        '#fee6ce',
        '#fdd0a2',
        '#fdae6b',
        '#fd8d3c',
        '#f16913',
        '#d94801',
        '#8c2d04'
    ];
    var coloursIncome = d3.scaleQuantile()
        .domain(income)
        .range(colorClasses);
}

//generate the housing rent histrogram
function rentHistogram(rent, formatCount) {
    var svg = d3.select("svg"), margin = { top: 20, right: 0, bottom: 50, left: 10 }, width = +svg.attr("width") - margin.left - margin.right, height = +svg.attr("height") - margin.top - margin.bottom, g = svg_rent.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var x = d3.scaleLinear()
        .rangeRound([0, width])
        .domain([0, d3.max(rent)]);
    var bins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(30))(rent);
    var y = d3.scaleLinear()
        .domain([0, d3.max(bins, function (d) { 
            return d.length; })])
        .range([height, 0]);
    var bar_rent = g.selectAll(".bar_rent")
        .data(bins)
        .enter().append("g")
        .attr("class", "bar_rent")
        .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .style("fill", function (d) {
            return "#000";
        });
    bar_rent.append("rect")
        .attr("class", "rent_rect")
        .attr("x", 1)
        .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
        .attr("height", function (d) { return height - y(d.length); })
        .style("fill", function (d) {
            return "#eaeaea";
        });
    bar_rent.append("text")
        //.attr("dy", "0em")
        .attr("y", -5)
        .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
        .attr("text-anchor", "middle")
        .text(function (d) { return formatCount(d.length); });
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    var currentValue = 0;

    var slider = svg_rent.append("g")
        .attr("class", "slider_rent")
        .attr("transform", "translate(" + margin.left + "," + (margin.top + 150) + ")");
    slider.append("line")
        .attr("class", "track_rent")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset_rent")
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function () { slider.interrupt(); })
            .on("start drag", function () {
                currentValue = d3.event.x;
                update_rent(x.invert(currentValue));
            }));
    slider.insert("g", ".track-overlay_rent")
        .attr("class", "ticks_rent")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(x.ticks(10))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function (d) {
            return d;
        });
    var handle = slider.insert("circle", ".track-overlay_rent")
        .attr("class", "handle_rent")
        .attr("r", 9);
    function update_rent(h) {
        rent_highest = h;
        //console.log(income_highest);
		if (rent_highest < 0){
			rent_highest = 100000;
		}
        handle.attr("cx", x(h));
        // filter data set and redraw plot
        var newData = rent.filter(function (d) {
            return d < h;
        });
        var bar_rent = d3.selectAll(".rent_rect")
            .style("fill", function (d) {
                //console.log(d);
                if (d.x0 < h) {
                    return coloursRent(d.x0);
                }
                else {
                    return "#eaeaea";
                }
            });
    }
    // set color of housing rate histogram
    var colorClasses = [
        '#f7fcf5',
        '#e5f5e0',
        '#c7e9c0',
        '#a1d99b',
        '#74c476',
        '#41ab5d',
        '#238b45',
        '#005a32'
    ];
    var coloursRent = d3.scaleQuantile()
        .domain(rent)
        .range(colorClasses);
}

//generate the unemployment histrogram
function unemployHistogram(unemploy, formatCount) {
    var svg = d3.select("svg"), margin = { top: 20, right: 0, bottom: 50, left: 10 }, width = +svg.attr("width") - margin.left - margin.right, height = +svg.attr("height") - margin.top - margin.bottom, g = svg_unemploy.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var x = d3.scaleLinear()
        .rangeRound([0, width])
        .domain([0, d3.max(unemploy)]);
    var bins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(30))(unemploy);
    var y = d3.scaleLinear()
        .domain([0, d3.max(bins, function (d) { return d.length; })])
        .range([height, 0]);
    var bar_unemploy = g.selectAll(".bar")
        .data(bins)
        .enter().append("g")
        .attr("class", "bar_unemploy")
        .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .style("fill", function (d) {
            return "#000";
        });
    bar_unemploy.append("rect")
        .attr("class", "unemploy_rect")
        .attr("x", 1)
        .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
        .attr("height", function (d) { return height - y(d.length); })
        .style("fill", function (d) {
            return "#eaeaea";
        });
    bar_unemploy.append("text")
        //.attr("dy", "0em")
        .attr("y", -5)
        .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
        .attr("text-anchor", "middle")
        .text(function (d) { return formatCount(d.length); });
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    var currentValue = 0;
    var slider = svg_unemploy.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + (margin.top + 150) + ")");
    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function () { slider.interrupt(); })
            .on("start drag", function () {
                currentValue = d3.event.x;
                updsvg_unemploy(x.invert(currentValue));
            }));
    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(x.ticks(10))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function (d) {
            return parseInt(d*100) + "%";
        });
    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);
    function updsvg_unemploy(h) {
        unemploy_highest = h;
		if (unemploy_highest < 0){
			unemploy_highest = 100000;
		}		
        handle.attr("cx", x(h));
        // filter data set and redraw plot
        var newData = unemploy.filter(function (d) {
            return d < h;
        });
        var bar_unemploy = d3.selectAll(".unemploy_rect")
            .style("fill", function (d) {
                //console.log(d);
                if (d.x0 < h) {
                    return coloursUnemploy(d.x0);
                }
                else {
                    return "#eaeaea";
                }
            });
    }
    // set color of unemployment histogram
    var colorClasses = [
        '#f7fbff',
        '#deebf7',
        '#c6dbef',
        '#9ecae1',
        '#6baed6',
        '#4292c6',
        '#2171b5',
        '#084594'
    ];
    var coloursUnemploy = d3.scaleQuantile()
        .domain(unemploy)
        .range(colorClasses);
}