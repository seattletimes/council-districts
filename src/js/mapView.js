var L = require("leaflet");
var $ = require("jquery");

var MapView = function(map) {
  this.map = map;
};

MapView.prototype = {
  addLayer: function(data) {
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
    layer.addTo(this.map);
  },
  
  dropPin: function(position) {
    $(".my-location").remove(); // get rid of any previously dropped pins
    var icon = new L.divIcon({className: 'my-location'});
    var marker = L.marker([position.lat,position.lng], {icon: icon});
    marker.addTo(this.map);
    var oldTransform = marker._icon.style.transform;
    var newTransform = oldTransform.replace(/, \d+/, ", 0");
    marker._icon.style.transform = newTransform;
    marker._icon.style.transition = "transform .5s ease-in";
    setTimeout(function() {
      marker._icon.style.transform = oldTransform;
    }, 100);
    setTimeout(function() {
      // once pin is dropped, we don't want to transition anymore (e.g. on map zoom)
      marker._icon.style.transition = "";
    }, 600)
  }
};

module.exports = MapView;