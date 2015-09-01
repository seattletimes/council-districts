var $ = require("jquery");
var debug = false;


module.exports = function(debug) {
  $(".location-box").addClass("loading");

  var deferred = $.Deferred();

  if (!navigator.geolocation) {
    deferred.reject("This browser doesn't support geolocation.");
  }

  if (debug) {
    deferred.resolve({
      lat: 47.618,
      lng: -122.333
    });
  } else {
    navigator.geolocation.getCurrentPosition(function(position) {
      deferred.resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    }, function() {
      deferred.reject();
      $(".location-box").addClass("showing-validation");
      $(".validation").html("Unable to find location.");
    });
  }

  return deferred.promise();
};
