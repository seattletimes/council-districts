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
    $(".validation").html("");
    $(".spinner").show();
    $.ajax({
      url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + bounds
    }).then(function(data) {
      if (data.status == "ZERO_RESULTS") {
        $(".validation").html("Zero results.");
      } else if (data.results[0].formatted_address.indexOf("Seattle") < 0) {
        $(".validation").html("Outside of bounds.");
      } else {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var position = {lat: lat, lng: lng};

        view.dropPin(position);
        var district = wolf.findDistrict(position);
        updateMyDistrictInfo(district);
      }
      $(".spinner").hide();
    });
  }
}

$(".onward-button").on("click", onward);
$("#address").on("keydown", function(e) {
  if (e.keyCode == 13) onward();
});

var updateMyDistrictInfo = function(district) {
  $(".result").html("District " + district);
  $(".search").show();
  view.myDistrict = district;
};

// $(".inner").on("click", ".search", function() {
//   $(".find-by-address").toggleClass("show-find");
// });

$("body").on("click", "._back", function() {
  view.zoomOut();
});

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
  $(".legend").addClass("show");
  
    // mobile hack
  $(".data-box").toggleClass("show");
  $(".location-box").toggleClass("show");
});

// changes view based on which district is selected from dropdown
$("select").change(function(e) {
  view.zoomToDistrict(e.target.value);
})

$("#map").on("click", ".district-label", function(e) {
  view.zoomToDistrict($(e.target).html());
})

// on mobile, brings up screen for heat maps
$(".explore").click(function(e) {
  $(".data-box").toggleClass("show");
  $(".location-box").hide();
});

$(".about").click(function(e) {
  $(".chatter").toggleClass("show");
  $(".location-box").hide();
});

$(".close-chatter").click(function(e) {
  $(".chatter").toggleClass("show");
  $(".location-box").toggleClass("show");
});

$(".view-data").click(function(e) {
  $(".district-box").show();
  $(".info-box").addClass("full-height");
  $(".view-data").hide();
});

$(".info-box").on("click", ".mobile-back", function() {
  $(".district-box").hide();
  $(".info-box").removeClass("full-height");
  $(".view-data").show();
});

// $(".bar").on("touchstart", function(e) {
//   console.log(e)
//   // e.stopPropagation();
//   // $(".click-tooltip").removeClass("click-tooltip");
//   // $(e.target).next().addClass("click-tooltip");
// });
