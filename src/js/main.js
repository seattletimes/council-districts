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

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var gradient = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
gradient.addColorStop(0,"white");
gradient.addColorStop(1,"#7B5AA6");
ctx.fillStyle = gradient;
ctx.fillRect(0,0,canvas.width,canvas.height);

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

var findMe = function() {
  $("body").removeClass("located");
  $(".location-box").removeClass("showing-validation");
  $(".location-box").removeClass("showing-result");
  $(".location-box").removeClass("showing-search");
  $(".location-box").addClass("loading");

  // true for dev
  var location = locate();

  $.when(location, request).then(function(position) {
    $("body").addClass("located");
    $("#address").val("");
    var district = wolf.findDistrict(position);
    updateMyDistrictInfo(district);
    resetDemo();
    view.dropPin(position);
  }, function(err) {
    console.error(err);
  });

  location.always(function() { 
    $(".location-box").removeClass("loading");
  });

};

var resetDemo = function() {
  view.selectedDemo = null;
  var open = document.querySelector(".demo-tile.open .demo-box");
  if (open !== null) { closeBox(open) }
  $(".demo.active").removeClass("active");
}

findMe();

$(".locate-icon").click(findMe);

var onward = function() {
  if ($('#address') !== null) {
    $("body").removeClass("located");
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
        view.selectedDemo = null;
        resetDemo();
        view.dropPin(position);
      }
      $(".location-box").removeClass("loading");
    });
  }
}

var updateMyDistrictInfo = function(district) {
  if (district) {
    $(".result").html("District " + district);
    view.myDistrict = district;
    $(".location-box").addClass("showing-result");
  } else {
    // If using geolocation outside of city limits
    $(".location-box").addClass("showing-validation");
    $(".validation").html("Outside of bounds.");
    view.myDistrict = null;
  }
};

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

// BEHOLD! The great mess known as my event listeners!

// Submits address from input field
$(".onward-button").on("click", onward);
$("#address").on("keydown", function(e) {
  if (e.keyCode == 13) onward();
});

// Demographic menu animation
$(".data-box").on("click", ".demo-tile", function(e) {
  var demoBox = this.querySelector(".demo-box");
  var bounds = demoBox.getBoundingClientRect();
  var open = document.querySelector(".demo-tile.open .demo-box");
  if (bounds.height == 0) {
    if (open !== null) { closeBox(open) }
    openBox(demoBox);
  } 
});

// Triggers map update based on selected demographic
$(".demo").click(function(e) {
  $(".demo.active").removeClass("active");
  $(this).addClass("active");
  view.selectedDemo = this.id;
  view.updateView();
  $("body").addClass("show-legend");

  // on mobile
  $("body").removeClass("show-data");
});

// Changes view based on which district is selected from dropdown
$("select").change(function(e) {
  view.zoomToDistrict(e.target.value);
});
$("#map").on("click", ".district-label", function(e) {
  view.zoomToDistrict($(e.target).html());
});

// ON MOBILE

// "Explore" button shows demographic options
$(".explore").click(function() {
  $("body").addClass("show-data");
  $("body").removeClass("show-chatter");
});
$(".close-data").click(function() {
  $("body").removeClass("show-data");
});

// "About" button shows chatter
$(".about").click(function() {
  $("body").addClass("show-chatter");
  $("body").removeClass("show-data");
});
$(".close-chatter").click(function() {
  $("body").removeClass("show-chatter");
});

// Back button zooms out to default view
$("body").on("click", ".back", function() {
  view.zoomOut();
  $("body").removeClass("show-back");
});

// "View data" view shows district-specific charts/numbers
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

// Locate button hides legend, shows "find me" panel
$(".show-locate").click(function() {
  $("body").removeClass("show-legend");
});

// Chart tooltips for mobile
$("body").on("touchstart", ".bar", function(e) {
  e.stopPropagation();
  $(".bar.active").removeClass("active");
  $(this).addClass("active");
});
$("body").on("touchstart", ".charts", function(e) {
  $(".bar.active").removeClass("active");
});

