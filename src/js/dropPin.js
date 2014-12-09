var L = require("leaflet");
var $ = require("jquery");

module.exports = function(position, map) {
  $(".my-location").remove(); // get rid of any previously dropped pins
  var icon = new L.divIcon({className: 'my-location'});
  var marker = L.marker([position.lat,position.lng], {icon: icon});
  marker.addTo(map);
  var oldTransform = marker._icon.style.transform;
  var newTransform = oldTransform.replace(/, \d+/, ", 0");
  marker._icon.style.transform = newTransform;
  marker._icon.style.transition = "transform .5s ease-in";
  setTimeout(function() {
    marker._icon.style.transform = oldTransform;
  }, 100);
  setTimeout(function() {
    marker._icon.style.transition = "";
  }, 600)
};