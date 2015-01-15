//Use CommonJS style via browserify to load other modules

var L       = require("leaflet");
var $       = require("jquery");
var wolf    = require("./wolf");
var locate  = require("./geolocation");
var MapView = require("./mapView");

var map = window.map =  L.map('map', {
  dragging:        false,
  boxZoom:         false,
  touchZoom:       false,
  scrollWheelZoom: false,
  doubleClickZoom: false
});

var view = new MapView(map);

var layer = L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
  maxZoom: 15,
  minZoom: 11
}).addTo(map);

var request = $.ajax({
  url: "assets/district_shapes.geojson",
  dataType: "json"
}).then(function(data) {
  wolf.init(data);
  view.addLayer(data);
});

// true for dev
var location = locate();

$.when(location, request).then(function(position) {
  view.dropPin(position);
  var district = wolf.findDistrict(position);
  updateMyDistrictInfo(district);
  view.updateView();
}, function(err) {
  console.error(err);
});

location.always(function() { 
  $(".spinner").hide();
});

var onward = function() {
  if ($('#address') !== null) {
    var address = $('#address').val().replace(/\s/g, '+');
    var bounds = "&bounds=47.4955511,-122.4359085|47.734145,-122.2359032";
    $(".spinner").show();
    $.ajax({
      url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + bounds
    }).then(function(data) {
      $(".spinner").hide();
      var lat = data.results[0].geometry.location.lat;
      var lng = data.results[0].geometry.location.lng;
      var position = {lat: lat, lng: lng};

      view.dropPin(position);
      var district = wolf.findDistrict(position);
      updateMyDistrictInfo(district);
      view.selectedDemo = null;
      view.updateView();
    });
  }
}

$(".onward-button").on("click", onward);
$("#address").on("keydown", function(e) {
  if (e.keyCode == 13) onward();
});

var updateMyDistrictInfo = function(district) {
  $(".result").html("District " + district.name);
  $(".search").show();
  view.myDistrict = district.name;
};

$(".inner").on("click", ".search", function() {
  $(".find-by-address").toggleClass("show-find");
});

$(".exit").on("click", function() {
  view.zoomOut();
});

$(".data-box").on("click", "li", function(e) {
  $("li.active").removeClass("active");
  $(this).addClass("active");
  view.selectedDemo = this.id;
  view.updateView();
})