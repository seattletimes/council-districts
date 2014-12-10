var L = require("leaflet");
var $ = require("jquery");

var MapView = function(map) {
  this.map = map;
};

MapView.prototype = {
  addLayer: function(data) {
    var self = this;
    var markers = [];
    var layer = L.geoJson(data, {
      style: function(feature) {
        var district = districtData[feature.properties.dist_name];
        return {color: district.color};
      },
      onEachFeature: function (feature, layer) {
        layer.on("click", function(e) {
          var bounds = layer.getBounds();
          self.map.fitBounds(bounds);
        });

        var center = layer.getBounds().getCenter();
        var icon = new L.divIcon({className: 'district-label', html: feature.properties.dist_name, iconAnchor: [6, 16]});
        var marker = L.marker([center.lat,center.lng], {icon: icon});
        markers.push(marker);
      }
    });
    layer.addTo(this.map);

    // Hack attack!!
    setTimeout(function() {
      markers.forEach(function(m) { m.addTo(self.map) });
    });
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