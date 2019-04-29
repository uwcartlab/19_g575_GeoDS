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

	
	//create the map title
	createTitle(map);   

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
			highlightCBG(this,map);
			map.eachLayer(function (layer) {
				map.removeLayer(layer);
			});
			
			//add OSM base tilelayer
		   L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' +'<br>Data sources: United States Census Bureau <br> Creator: Yunlei Liang'
			}).addTo(map);
			
			AddGrayFeatures(map);			
		}
			
    });

}

function highlightCBG(e,map){
	
	console.log(e);
	e.addTo(map);
	//var layer = e.target;
	
	
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
	
	//return the geojson layer for display
	return geojson1;

};



//build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("travel_d_1") > -1){
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
            var attributes = processData(response);
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

