var L = require("leaflet");
var $ = require("jquery");

var MapView = function(map) {
  this.map = map;
  this.selectedItem = null;
  this.control = null;
};

MapView.prototype = {
  addLayer: function(data) {
    var self = this;
    var markers = [];
    var layer = this.districts = L.geoJson(data, {
      style: function(feature) {
        var district = districtData[feature.properties.dist_name];
        return {color: district.color};
      },
      onEachFeature: function (feature, layer) {
        var district = districtData[feature.properties.dist_name];

        layer.on({
          click: function(e) {
            var bounds = layer.getBounds();
            self.map.fitBounds(bounds);
            if (self.selectedItem == null) {
              self.selectedItem = e.target;
              self.update();
            }
          },
          mouseover: function(e) {
            layer.setStyle({color: "#4B1BDE"});
          },
          mouseout: function(e) {
            layer.setStyle({color: district.color});
          }
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
      marker._icon.style.transition = ""; // once pin is dropped, we don't want to transition anymore (e.g. on map zoom)
    }, 600)
  },

  zoomOut: function() {
    this.selectedItem = null;
    this.update();
  },

  update: function() {
    if (this.selectedItem) {
      $("#map").removeClass("frozen");
      $(".exit").show();
      $(".address-box").show();
      $(".location-box").hide();
      this.control = new L.Control.Zoom();
      this.map.addControl(this.control);      
      this.map.dragging.enable();
      this.map.boxZoom.enable();
      this.map.touchZoom.enable();
      this.map.doubleClickZoom.enable();
    } else {
      $("#map").addClass("frozen");
      $(".exit").hide();
      $(".address-box").hide();
      $(".location-box").show();
      this.map.removeControl(this.control);
      this.map.setView([47.6097, -122.3331], 11);
      this.map.dragging.disable();
      this.map.boxZoom.disable();
      this.map.touchZoom.disable();
      this.map.doubleClickZoom.disable();

    }
  }
};

module.exports = MapView;