var map = L.map('map');
var userMark, userPos;

L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo( map );

var sidebar = L.control.sidebar('sidebar').addTo(map);
var drawer = L.control.drawer('drawer', { position: 'right' });
map.addControl(drawer);
drawer.hide();


function onLocationFound(e) {
  if (userMark) {
    userMark.setLatLng(e.latlng);
    userPos.setLatLng(e.latlng);
  } else {
    userMark = L.marker(e.latlng).addTo(map);
    userPos = L.circle(e.latlng, { radius: e.accuracy * 1.5, color: '#FF0000' }).addTo(map);
  }
}

function onLocationError(e) {
  alert(e.message);
}

map.on('locationerror', onLocationError);
map.on('locationfound', onLocationFound);
map.on('click', function(e) { drawer.hide(); sidebar.close(); });
drawer.on('hidden', function() { document.getElementById('audio').pause(); });

map.locate({watch: true, setView: true, maxZoom: 20});

function onEachFeature(feature, layer) {
  if (feature.properties.isSound) {
    layer.on('click', function (e) {
      drawer.hide();
      if (userPos && userPos.getBounds().contains(e.latlng)) {
        $('#audio').pause();
        $('#audio').src = feature.properties.src;
        $('#audio').play();
        drawer.setContent("<h1>" + feature.properties.title + "</h1><p>" + feature.properties.description + "</p>");
        drawer.show();
      } else {
        alert("Vous devez marcher à proximité du son pour pouvoir l'ecouter");
      }
    });
  }
}

$.getJSON("data/trophy.json", function(data) {
  console.log("TROPHY: loaded");
  for (var i = 0; i < data.length; i++) {
    var trophy = $("<li></li>").addClass('trophy disabled');
    var img    = $("<img>").attr('src', data[i].src);
    var div    = $("<div></div>");
    var title  = $("<h1></h1>").text(data[i].title);
    var desc   = $("<p></p>").text(data[i].desc);

    div.append(title).append(desc);
    trophy.append(img).append(div);
    $('#trophy-list').append(trophy);
  }
});

var query = "data/data.json";
$.getJSON(query, function(data) {
  console.log("DATA: loaded");
  var pointsGeoJSON = [];
  for (var i = 0; i < data.results.bindings.length; i++) {
    var e = data.results.bindings[i];
    var p = {};

    p.type = "Feature";
    p.properties = {};
    p.properties.title = e.title.value;
    p.properties.description = e.description.value;
    p.properties.isSound = true;
    p.properties.src = e.src.value;
    p.geometry = {};
    p.geometry.type = "Point";
    p.geometry.coordinates = [];
    p.geometry.coordinates[0] = parseFloat(e.long.value);
    p.geometry.coordinates[1] = parseFloat(e.lat.value);

    pointsGeoJSON.push(p);
  }

  console.log("GeoJSON: created");
  var markers = L.markerClusterGroup();
  markers.addLayer(L.geoJSON(pointsGeoJSON, {onEachFeature: onEachFeature}));
  map.addLayer(markers);
  console.log("GeoJSON: loaded");
});
