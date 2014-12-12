var L = require("leaflet");
var $ = require("jquery");

var restyle = function(feature) {
  var district = districtData[feature.properties.dist_name];

  if (this.selectedDistrict) {
    if (feature.properties.dist_name == this.selectedDistrict) {
      return { color: district.color };
    }
  } else if (this.myDistrict) {
    if (feature.properties.dist_name == this.myDistrict) {
      return {color: district.color};
    }
  }
  return { color: "gray" };
}

var MapView = function(map) {
  this.map = map;
  this.selectedDistrict = null;
  this.myDistrict = null;
  this.restyle = restyle.bind(this);
};

MapView.prototype = {
  addLayer: function(data) {
    var self = this;
    var markers = [];
    var geojson = this.districts = L.geoJson(data, {
      style: self.restyle,
      onEachFeature: function (feature, layer) {
        var district = districtData[feature.properties.dist_name];

        layer.on({
          click: function(e) {
            var bounds = layer.getBounds();
            self.map.fitBounds(bounds);
            self.map.eachLayer(function(layer) {
              if (layer.feature && layer.feature.properties.dist_name == e.target.feature.properties.dist_name) {
                self.selectedDistrict = e.target.feature.properties.dist_name;
              }
            });
            self.districts.setStyle(self.restyle);
            self.updateView();
          },
          mouseover: function(e) {
            layer.setStyle({color: district.color});
          },
          mouseout: function(e) {
            geojson.resetStyle(layer);
          }
        });

        var center = layer.getBounds().getCenter();
        var icon = new L.divIcon({className: 'district-label', html: feature.properties.dist_name, iconAnchor: [6, 16]});
        var marker = L.marker([center.lat,center.lng], {icon: icon, clickable: false, zIndexOffset: -100});
        markers.push(marker);
      }
    });
    geojson.addTo(this.map);

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
      marker._icon.style.transition = ""; // once pin is dropped, stop transitioning transform
    }, 600);
  },

  zoomOut: function() {
    this.selectedDistrict = null;
    this.updateView();
  },

  updateView: function() {
    this.districts.setStyle(this.restyle);
    if (this.selectedDistrict) {
      $("body").removeClass("frozen");
      this.enableMapInteractions(true);
    } else {
      $("body").addClass("frozen");
      this.map.setView([47.6097, -122.3331], 11);
      this.enableMapInteractions(false);
    }
  },

  enableMapInteractions: function(enabled) {
    var map = this.map;
    var state = enabled ? "enable" : "disable";
    ["dragging", "boxZoom", "touchZoom", "doubleClickZoom", "scrollWheelZoom"].forEach(function(prop) {
      map[prop][state]();
    })
  }
};

module.exports = MapView;