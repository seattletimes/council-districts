var $ = require("jquery");

module.exports = function(debug) {
  $(".spinner").show();

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
    });
  }

  return deferred.promise();
};