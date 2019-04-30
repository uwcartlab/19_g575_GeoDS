/* GEOG 575 Final Project by GeoDS, April 24, 2019 */


//function to instantiate the Leaflet map

function createMap(){
    //create the map
    var map = L.map('map', {
        center: [45,-90.5],
        zoom: 7
    });
	
	
    //add OSM base tilelayer
   L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' +'<br>Data sources: United States Census Bureau <br> Creator: Yunlei Liang; Yuhao Kang'
    }).addTo(map);

	
	//initial map with the proportional symbol map
    getDataChoro(map);

	CreateLegend(map);
	//create the map title
	createTitle(map); 

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

	var w = window.innerWidth * 0.8, h = window.innerHeight * 0.20,
		translate = "translate(" + 3 + "," + 5 + ")";
    //Example 1.5 line 1...container block
    var chart = d3.select("body") //get the <body> element from the DOM
        .append("svg") //put a new svg in the body
        .attr("width", w) //assign the width
        .attr("height", h) //assign the height
        .attr("class", "chart"); //assign a class name
	
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", w*0.95)
        .attr("height", h); //svg background color	

	
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .attr("class", function(d){
            return "bar " + d.RowLabels;
        })
        .attr("width",w/csvData.length-5)
		.on("mouseover", highlight)
        .on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
	
	
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

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
	var chartWidth = window.innerWidth * 0.75,
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
    var selected = d3.selectAll("bar."+props.RowLabels)
        .style("stroke", "blue")
        .style("stroke-width", "2");
	
	setLabel(props);
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = props["Count_of_distance_from_home"] + "times";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.RowLabels + "_label")
        .html(labelAttribute);

	var datarange = 'data range:' + props.RowLabels;
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
        y1 = d3.event.clientY - 30,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 30 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");

};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("."+props.RowLabels)
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
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' +'<br>Data sources: United States Census Bureau <br> Creator: Yunlei Liang'
	}).addTo(map);

	
};

//a customized function for each feature in the polygon of the choropleth map
function onEachFeature1(feature,attributes,map,layer){

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
			
			d3.csv("/data/home_mobility_WI.csv").then(callback);
	
			function callback(data){
				var HighlightData = [];
				for (i =0; i<data.length; i++){
					if (cbg_d == data[i]["cbg_d"]){
						HighlightData.push(data[i]);
					}
				}
				console.log(HighlightData);
				HighlightFeatures(HighlightData,map);
			};
			//AddGrayFeatures(map);	
			this.addTo(map);
		}
			
    });

};

function highlightCBG(e,map){
	
	//var layer = e.target;
	e.addTo(map);
	
};


function HighlightFeatures(data,map){
	$.ajax("data/WI_cbg_TravelDis.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response,"travel_d_4");
			//get the generated map layer
			AddHighlight(response,map,attributes,data);
        }
    });

};


//create the choropleth map
function AddHighlight(response, map, attributes,data){
	
    //create a Leaflet GeoJSON layer
    L.geoJson(response, {
		onEachFeature: function(feature,layer){
			return onEachFeatureHighlight(feature,attributes,map,layer,data)
		},
		style: function (feature) {		
			return styleHightlighted(feature,attributes,data);			
		}	
    }).addTo(map);
    

};


function onEachFeatureHighlight(feature,attributes,map,layer,data){

	for (i=0; i<data.length; i++){
		if (feature.properties.travel_d_4 == data[i]["cbg_o"]){
			var popupContent = "<p><b>Destination CensusBlock:</b> " + data[i]["cbg_d"] + "</p>";
			popupContent += "<p><b>Total Visits:</b>"  + data[i]["number"]+ "times";
			
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

};

function styleHightlighted(feature,attributes,data){


//	var checkExistence = checkExistence(feature.properties.travel_d_4,data);
	for (i=0; i<data.length; i++){
		if (feature.properties.travel_d_4 == data[i]["cbg_o"]){			
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
			return onEachFeature1(feature,attributes,map,layer)
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
  

$(document).ready(createMap);

