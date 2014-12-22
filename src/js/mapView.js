var L = require("leaflet");
var $ = require("jquery");
var ich = require("icanhaz");
var heatStyle = require("./heatStyle");
var districtTemplate = require("./_districtInfo.html");
ich.addTemplate("districtInfo", districtTemplate);

var restyle = function(feature) {
  var district = districtData[feature.properties.dist_name];

  if (this.selectedDistrict) {
    if (feature.properties.dist_name == this.selectedDistrict) {
      return { fillColor: "#00FF00" };
    }
  } else if (this.selectedDemo) {
    return heatStyle(this.selectedDemo, district);
  } else if (this.myDistrict) {
    if (feature.properties.dist_name == this.myDistrict) {
      return { fillColor: "#00FF00" };
    }
  }
  return { 
    color: "black",
    fillColor: "gray",
    weight: 2,
    fillOpacity: 0.5 
  };
};

// var percentages = ["white", "hispanic", "black", "native", "asian", "pacific","other", "multi"];
var averageData = {};

var MapView = function(map) {
  this.map = map;
  this.selectedDistrict = null;
  this.selectedDemo = null;
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
            self.updateView();
          },
          mouseover: function(e) {
            layer.setStyle({fillColor: "#C8FFC8"});
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
      this.updateSelectedDistrictInfo(this.selectedDistrict);
    } else {
      $("body").addClass("frozen");
      this.map.setView([47.6097, -122.3331], 11);
      this.enableMapInteractions(false);
    }
  },

  updateSelectedDistrictInfo: function(district) {
    var demo = demoData[district];
    var districtData = { name: district };

    for (var key in demo) {
      var value = demo[key];
      // if (typeof value == "number") {
      //   if (percentages.indexOf(key) > -1) {
      //     districtData[key] = formatNumber((value * 100).toFixed(2));
      //   } else {
          districtData[key] = formatNumber(value);
      //   }
      // } else {
      //   districtData[key] = value;
      // }
    }    

    if (Object.keys(averageData).length == 0) {
      var avg  = demoData["avg"];
      for (var key in avg) {
        var value = avg[key];
      //   if (typeof value == "number") {
      //     if (percentages.indexOf(key) > -1) {
      //       averageData[key] = formatNumber((value * 100).toFixed(2));
      //     } else {
            averageData[key] = formatNumber(value);
      //     }
      //   } else {
      //     averageData[key] = value;
      //   }
      }    
    }

    var data = { district: districtData, average: averageData };
    $(".district-box").html(ich.districtInfo(data));
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