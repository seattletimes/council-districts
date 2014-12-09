//Use CommonJS style via browserify to load other modules

var L = require("leaflet");
var $ = require("jquery");
var wolf = window.wolf = require("wherewolf")();
var locate = require("./geolocation");

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
  var marker = L.marker([position.lat,position.lng], {icon: new L.DivIcon()})
  marker.addTo(map);
  var oldTransform = marker._icon.style.transform;
  var newTransform = oldTransform.replace(/, \d+/, ", 0");
  marker._icon.style.transform = newTransform;
  marker._icon.style.transition = "transform .5s ease-in";
  setTimeout(function() {
    marker._icon.style.transform = oldTransform;
  }, 100)

  var results = wolf.find(position, { layer: "Seattle City Council Districts" });
  var district = districtData[results.dist_name]
  $(".result").html(district.name);

}, function(err) {
  console.error(err);
});

location.always(function() { 
  $(".spinner").hide();
});

  // Use google geocoding api for dodgy users
  // $.ajax({
  //   url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address
  // }).then(function(data) {
  //   var lat = data.results[0].geometry.location.lat;
  //   var lng = data.results[0].geometry.location.lng;
  //   console.log(lat, lng);

  //   var pin = new L.DivIcon();
  //   L.marker([lat, lng], {icon: pin}).addTo(map);
  // });

  // if ($('#address') !== null) {

  //   var address = $('#address').val().replace(/\s/g, '+');
