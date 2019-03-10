/**
 * @author: theo
 */

var overlays = new Set();
var baseMaps;
var overlayMaps;

var storage = sessionStorage; // or localStorage?

function addOverlay(e) {
	overlays.add(e.name);
	storage.setItem('overlays', JSON.stringify(Array.from(overlays)));
}

function removeOverlay(e) {
	overlays.delete(e.name);
	storage.setItem('overlays', JSON.stringify(Array.from(overlays)));
}

function changeBaseLayer(e) {
	storage.setItem("baselayer", e.name);
}

function restoreMap(map) {
	succes = false;
	var items = storage.getItem('overlays');
	if (items) {
		overlays = new Set(JSON.parse(items));
		overlays.forEach(item => {
			overlayMaps[item].addTo(map);
			succes = true;
		});
	}
	else {
		overlays = new Set();
	}
	var name = storage.getItem('baselayer');
	if (name) {
		baseMaps[name].addTo(map);
		succes = true;
	}
	return succes;
}

function saveBounds(map) {
	var b = map.getBounds();
	storage.setItem('bounds',b.toBBoxString());
}

function restoreBounds(map) {
	var b = storage.getItem('bounds');
	if (b) {
		corners = b.split(',').map(Number);
		map.fitBounds([[corners[1],corners[0]],[corners[3],corners[2]]]);
		return true;
	}
	return false;
}

var redBullet = L.icon({
    iconUrl: '/static/img/red_marker16.png',
    iconSize: [12, 12],
    iconAnchor: [6,6],
    popupAnchor: [0, 0],
});

var theMap = null;
var markers = []; // Should be associative array: {} ??

function addMarker(map, item) {
	const coords = item.location.coordinates;
	marker = L.marker([coords[1],coords[0]],{title: item.name, icon: redBullet});
	markers[item.id] = marker;
	marker.bindPopup("Loading...",{maxWidth: "auto"});
	if(item.latest) {
		marker.bindTooltip(item.latest.value.toPrecision(3),{permanent:true,className:"label",opacity:0.7,direction:"top",offset:[0,-10]});
	}
	marker.addTo(map);
	marker.closeTooltip();
	return marker;
}

var hilite = null;
var hiliteVisible = false;

function showHilite(marker) {
	
	if (marker == null || theMap == null)
		return;
	
	if (!hilite) {
		hilite= new L.circleMarker(marker.getLatLng(),{radius:20,color:"green"})
			.addTo(theMap);
	}
	else {
		hilite.setLatLng(marker.getLatLng());
		if (!hiliteVisible) {
			theMap.addLayer(hilite);
		}
	}
	hiliteVisible = true;
}

function hideHilite() {
	if (hiliteVisible) {
		hilite.remove();
		hiliteVisible = false;
	}
}

var panTimeoutId = undefined;

function panToMarker(marker) {
	theMap.panTo(marker.getLatLng());
}

function clearPanTimer() {
	window.clearTimeout(panTimeoutId);
	panTimeoutId = undefined;
}

function showMarker(m) {
	marker = markers[m];
	showHilite(marker);
	panTimeoutId = window.setTimeout(panToMarker,1000,marker);
}

function hideMarker() {
	hideHilite();
	clearPanTimer();
}

L.Control.LabelControl = L.Control.extend({
    onAdd: map => {
    	var container = L.DomUtil.create('div','leaflet-bar leaflet-control leaflet-control-custom');
        var img = L.DomUtil.create('a','fas fa-tag',container);
    	img.title = 'Toggle labels';
        img.setAttribute('role','button');
        img.setAttribute('aria-label','Toggle Labels');

    	L.DomEvent.on(container, 'click', e => {
        	toggleLabels();
            L.DomEvent.preventDefault();
            L.DomEvent.stopPropagation();
        });
        
        return container;
    },

    onRemove: map => {
        // Nothing to do here
    },
    
});

L.control.labelcontrol = function(opts) {
    return new L.Control.LabelControl(opts);
}

var labelsShown = false;

function showLabels() {
	if (!labelsShown) {
		if (markers) {
			markers.forEach(marker => {
				marker.openTooltip();
			});
		} 
		labelsShown = true;
	}
}

function hideLabels() {
	if (labelsShown) {
		if (markers) {
			markers.forEach(marker => {
				marker.closeTooltip();
			}); 
		} 
		labelsShown = false;
	}
}

function toggleLabels() {
	if (labelsShown) {
		hideLabels();
	}
	else {
		showLabels();
	}
}

/**
 * Initializes leaflet map
 * @param div where map will be placed
 * @options initial centerpoint and zoomlevel
 * @returns the map
 */
function initMap(div,options) {
	var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
 		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	});
	
	var topo = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri'
	});
	
	var imagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri'
	});
	
	var ahn35 = L.esri.imageMapLayer({
		url: 'https://ahn.arcgisonline.nl/arcgis/rest/services/Hoogtebestand/AHN3_5m/ImageServer',
		opacity: 0.5})
		.bindPopup((err, results, response) => {
			const value = results.pixel.properties.value;
			return (value) ? 'Maaiveldhoogte: ' + value : false;
		});

	var legger = L.tileLayer.wms('http://maps.acaciadata.com/geoserver/BMW/wms', {
		layers: 'BMW:Watergangen HHNK, BMW:Watergangen Wetterskip, BMW:Watergangen Noorderzijlvest',
		format: 'image/png',
		transparent: true,
		tiled: true,
		opacity: 1.0,
	});
		
	var map = L.map(div,options);

 	baseMaps = {'Openstreetmap': osm, 'ESRI wegenkaart': topo, 'ESRI satelliet': imagery};
	overlayMaps = {'AHN3 maaiveld': ahn35, 'Watergangen': legger};
	L.control.layers(baseMaps, overlayMaps).addTo(map);
	
	if (!restoreMap(map)) {
		// use default map
		osm.addTo(map);
	}
	
	restoreBounds(map);
	
	var control = L.control.labelcontrol({ position: 'topleft' }).addTo(map);

	map.on('baselayerchange',e => {changeBaseLayer(e);});
 	map.on('overlayadd',e => {addOverlay(e);});
 	map.on('overlayremove',e => {removeOverlay(e);});
 	map.on('zoomend',() => {saveBounds(map);});
 	map.on('moveend',() => {saveBounds(map);});
 	
 	return theMap = map;

}
