var map = L.map('map');
var userMark, userPos;

var userData = {

  data: {
    "sounds": []
  },

  load: function () {
    var data = JSON.parse(localStorage.getItem("userData"));
    if (data) this.data = data;
    return this.data;
  },

  save: function () {
    localStorage.setItem("userData", JSON.stringify(this.data));
  },

  delete: function () {
    localStorage.removeItem("userData");
  }

}

var trophy = {

  fileName: "data/trophy.json",

  reload: function () {
    $.getJSON(this.fileName, function(data) {
      console.log("TROPHY: loaded");
      $('#trophy-list').html("");
      for (var i = 0; i < data.length; i++) {
        var trophy = $("<li></li>").addClass('trophy');
        var img    = $("<img>").attr('src', data[i].img);
        var div    = $("<div></div>");
        var title  = $("<h1></h1>").text(data[i].title);
        var desc   = $("<p></p>").text(data[i].desc);

        switch (data[i].condition) {
          case 'nsl':
          if (userData.data.sounds.length < data[i].value)
          trophy.addClass('disabled');
          break;

          case 'ntsl':
          var sound = userData.data.sounds.find(function(value) { return value.nbEcoute >= this.value }, data[i]);
          if (!sound)
          trophy.addClass('disabled');
          break;

          default:
          trophy.addClass('disabled');
        }

        div.append(title).append(desc);
        trophy.append(img).append(div);
        $('#trophy-list').append(trophy);
      }
    });
  },

  delete: function() {
    userData.delete();
    this.reload();
  }

}

userData.load();
trophy.reload();

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
    userPos = L.circle(e.latlng, { radius: 4, color: '#FF0000' }).addTo(map);
    map.setView(e.latlng, 20);
  }
}

function onLocationError(e) {
  alert(e.message);
}

map.on('locationerror', onLocationError);
map.on('locationfound', onLocationFound);
map.on('click', function(e) { drawer.hide(); sidebar.close(); });
drawer.on('hidden', function() { document.getElementById('audio').pause(); });

map.setView([0, 0], 0);
map.locate({watch: true});

function onEachFeature(feature, layer) {
  if (feature.properties.isSound) {
    layer.on('click', function (e) {
      drawer.hide();
      if (userPos && userPos.getBounds().contains(e.latlng)) {
        // Play sound
        var audio = $('#audio')[0];
        audio.pause();
        audio.src = feature.properties.src;
        audio.play();

        // Show info
        drawer.setContent("<h1>" + feature.properties.title + "</h1><p>" + feature.properties.description + "</p>");
        drawer.show();

        // Add it to the userData
        var sound = userData.data.sounds.find(function(value) { return value.id === this.properties.id }, feature);
        if (sound) {
          sound.nbEcoute += 1;
        } else {
          userData.data.sounds.push({ "id": feature.properties.id, "nbEcoute": 1 });
        }
        userData.save();
        trophy.reload();
      } else {
        alert("Vous devez marcher à proximité du son pour pouvoir l'ecouter");
      }
    });
  }
}

var query = "data/data.json";
$.getJSON(query, function(data) {
  console.log("DATA: loaded");
  var pointsGeoJSON = [];
  for (var i = 0; i < data.results.bindings.length; i++) {
    var e = data.results.bindings[i];
    var p = {};

    p.type = "Feature";
    p.properties = {};
    p.properties.id = i;
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
