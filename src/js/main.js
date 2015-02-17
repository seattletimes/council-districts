//Use CommonJS style via browserify to load other modules

var L       = require("leaflet");
var $       = require("jquery");
var wolf    = require("./wolf");
var locate  = require("./geolocation");
var MapView = require("./mapView");
var Share   = require("share");

new Share(".share", {
  ui: {
    flyout: "bottom left"
  },
});

var map = window.map =  L.map('map', {
  dragging:        false,
  boxZoom:         false,
  touchZoom:       false,
  scrollWheelZoom: false,
  doubleClickZoom: false
});

var view = window.view = new MapView(map);

var layer = L.tileLayer('//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 15,
  minZoom: 10,
  subdomains: ["server", "services"],
  attribution: "Esri, NAVTEQ, DeLorme" 
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
  var district = wolf.findDistrict(position);
  updateMyDistrictInfo(district);
  view.dropPin(position);
}, function(err) {
  console.error(err);
});

location.always(function() { 
  $(".location-box").removeClass("loading");
});

var onward = function() {
  if ($('#address') !== null) {
    var address = $('#address').val().replace(/\s/g, '+');
    var bounds = "&bounds=47.4955511,-122.4359085|47.734145,-122.2359032";
    $(".location-box").removeClass("showing-validation");
    $(".location-box").removeClass("showing-result");
    $(".location-box").removeClass("showing-search");
    $(".location-box").addClass("loading");
    $.ajax({
      url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + bounds
    }).then(function(data) {
      if (data.status == "ZERO_RESULTS") {
        $(".location-box").addClass("showing-validation");
        $(".validation").html("Zero results.");
      } else if (data.results[0].formatted_address.indexOf("Seattle") < 0) {
        $(".location-box").addClass("showing-validation");
        $(".validation").html("Outside of bounds.");
      } else {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var position = {lat: lat, lng: lng};

        var district = wolf.findDistrict(position);
        updateMyDistrictInfo(district);
        view.dropPin(position);
      }
      $(".location-box").removeClass("loading");
    });
  }
}

$(".onward-button").on("click", onward);
$("#address").on("keydown", function(e) {
  if (e.keyCode == 13) onward();
});

var updateMyDistrictInfo = function(district) {
  $(".result").html("District " + district);
  view.myDistrict = district;
  $(".location-box").addClass("showing-result");
};

$(".data-box").on("click", ".demo-tile", function(e) {
  var demoBox = this.querySelector(".demo-box");
  var bounds = demoBox.getBoundingClientRect();
  var open = document.querySelector(".demo-tile.open .demo-box");
  if (bounds.height == 0) {
    if (open !== null) { closeBox(open) }
    openBox(demoBox);
  } 
});

var openBox = function(box) {
  var $box = $(box);
  box.style.height = "auto";
  var bounds = box.getBoundingClientRect();
  box.style.height = "0";
  $box.addClass("transition-in");
  setTimeout(function() {
    box.style.height = bounds.height + "px";
  });
  setTimeout(function(){
    $box.removeClass("transition-in");
    box.style.height = "auto";
  }, 500);
  $box.closest(".demo-tile").addClass("open");
};

var closeBox = function(box) {
  var $box = $(box);
  var bounds = box.getBoundingClientRect();
  box.style.height = bounds.height + "px";
  $box.addClass("transition-out");
  setTimeout(function() {
    box.style.height = "0";
  });
  setTimeout(function() {
    $box.removeClass("transition-out");
  }, 500)
  $box.closest(".demo-tile").removeClass("open");
};

$(".demo").click(function(e) {
  $(".demo.active").removeClass("active");
  $(this).addClass("active");
  view.selectedDemo = this.id;
  view.updateView();
  $("body").addClass("show-legend");

  // on mobile
  $("body").removeClass("show-data");
});

// changes view based on which district is selected from dropdown
$("select").change(function(e) {
  view.zoomToDistrict(e.target.value);
});

$("#map").on("click", ".district-label", function(e) {
  view.zoomToDistrict($(e.target).html());
});

// on mobile
$(".explore").click(function() {
  $("body").addClass("show-data");
});
$(".close-data").click(function() {
  $("body").removeClass("show-data");
});
$(".about").click(function() {
  $("body").addClass("show-chatter");
});
$(".close-chatter").click(function() {
  $("body").removeClass("show-chatter");
});
$("body").on("click", ".back", function() {
  view.zoomOut();
  $("body").removeClass("show-back");
});
$(".view-data").click(function() {
  $("body").addClass("add-transition");
  $("body").addClass("show-district");
});
$(".close-district").click(function() {
  $("body").removeClass("show-district");
  setTimeout(function() {
    $("body").removeClass("add-transition");
  }, 500);
});
$(".search-icon").click(function() {
  $(".location-box").addClass("showing-search");
  $(".location-box").removeClass("showing-validation");
  $(".location-box").removeClass("showing-result");
});

// $(".bar").on("touchstart", function(e) {
//   console.log(e)
//   // e.stopPropagation();
//   // $(".click-tooltip").removeClass("click-tooltip");
//   // $(e.target).next().addClass("click-tooltip");
// });
