//Use CommonJS style via browserify to load other modules

var L = require("leaflet");
var $ = require("jquery");

var map = L.map('map').setView([47.6097, -122.3331], 11);

L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
  maxZoom: 14
}).addTo(map);

$.ajax({
  url: "assets/district_shapes.geojson",
  dataType: "json"
}).then(function(data) {
  var layer = L.geoJson(data, {
    style: function(feature) {
      var district = districtData[feature.properties.dist_name]
      return {color: district.color};
    },
    onEachFeature: function (feature, layer) {
      var district = districtData[feature.properties.dist_name]
      layer.bindPopup(district.name);
    }
  });
  layer.addTo(map);
});