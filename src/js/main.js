//Use CommonJS style via browserify to load other modules

var L      = require("leaflet");
var $      = require("jquery");
var wolf   = require("wherewolf")();
var locate = require("./geolocation");
var findMe = require("./findMe");

var map = L.map('map').setView([47.6097, -122.3331], 11);

L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
  maxZoom: 15,
  minZoom: 11
}).addTo(map);

var districtTag = "Seattle City Council Districts";

var request = $.ajax({
  url: "assets/district_shapes.geojson",
  dataType: "json"
}).then(function(data) {
  wolf.add(districtTag, data);

  var layer = L.geoJson(data, {
    style: function(feature) {
      var district = districtData[feature.properties.dist_name];
      return {color: district.color};
    },
    onEachFeature: function (feature, layer) {
      var district = districtData[feature.properties.dist_name];
      layer.bindPopup(district.name);
    }
  });
  layer.addTo(map);
});

var location = locate();

$.when(location, request).then(function(position) {
  findMe(position, map, wolf);
}, function(err) {
  console.error(err);
});

location.always(function() { 
  $(".spinner").hide();
});

$(".onward").on("click", function(event) {
  if ($('#address') !== null) {
    var address = $('#address').val().replace(/\s/g, '+');
    $(".spinner").show();
    $.ajax({
      url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address
    }).then(function(data) {
      $(".spinner").hide();
      var lat = data.results[0].geometry.location.lat;
      var lng = data.results[0].geometry.location.lng;

      var position = {lat: lat, lng: lng};
      findMe(position, map, wolf);
    });
  }
});
