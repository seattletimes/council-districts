var $ = require("jquery");

module.exports = function() {
  $(".spinner").show();

  var deferred = $.Deferred();

  if (!navigator.geolocation) {
    deferred.reject("This browser doesn't support geolocation.");
  }

  deferred.resolve({
    lat: 47.618,
    lng: -122.333
  });

  // navigator.geolocation.getCurrentPosition(function(position) {
  //   deferred.resolve({
  //     lat: position.coords.latitude,
  //     lng: position.coords.longitude
  //   });
  // });

  return deferred.promise();
};