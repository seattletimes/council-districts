var L = require("leaflet");
var $ = require("jquery");
var heatStyle = require("./heatStyle");
var ich = require("icanhaz");
var districtTemplate = require("./_districtTemplate.html");
ich.addTemplate("districtTemplate", districtTemplate);

var restyle = function(feature) {
  var districtName = feature.properties.dist_name;

  if (this.selectedDistrict) {
    if (feature.properties.dist_name == this.selectedDistrict) {
      return { fillColor: "#528965", fillOpacity: 0.7 };
    }
  } else if (this.selectedDemo) {
    return { fillColor: heatStyle(this.selectedDemo, districtName), fillOpacity: 0.8 };
  } else if (this.myDistrict) {
    if (feature.properties.dist_name == this.myDistrict) {
      return { fillColor: "#528965", fillOpacity: 0.7 };
    }
  }
  return { 
    color: "black",
    fillColor: "#EEE",
    weight: 2,
    fillOpacity: 0.3
  };
};

var averageData = {};

var MapView = function(map) {
  this.map = map;
  this.selectedDistrict = null;
  this.selectedDemo = null;
  this.myDistrict = null;
  this.restyle = restyle.bind(this);
  this.cityBounds = null;
};

MapView.prototype = {
  addLayer: function(data) {
    var self = this;
    var markers = [];
    var geojson = this.districts = L.geoJson(data, {
      style: self.restyle,
      onEachFeature: function (feature, layer) {
        layer.on({
          click: function(e) {
            self.zoomToDistrict(e.target.feature.properties.dist_name);

            // Mobile view hacks
            $(".location-box").hide();
            $(".view-data").addClass("show");
            $(".inner").addClass("bump-height");
            $("#map").addClass("bump-height");
          },
          mouseover: function(e) {
            layer.setStyle({ fillColor: "#c1ceaf", fillOpacity: 0.7 });
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
    self.cityBounds = geojson.getBounds();
    map.fitBounds(self.cityBounds);

    // Hack attack!!
    setTimeout(function() {
      markers.forEach(function(m) { m.addTo(self.map) });
    });
  },

  findLayer: function(f) {
    var found = [];
    this.map.eachLayer(function(layer) {
      if (f(layer)) {
        found.push(layer);
      }
    });
    return found;
  },

  findDistrictLayer: function(num) {
    return this.findLayer(function(l) {
      return l.feature && l.feature.properties && l.feature.properties.dist_name == num;
    }).pop();
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

    // Mobile view hacks
    $(".view-data").removeClass("show");
    $(".inner").removeClass("bump-height");
    $("#map").removeClass("bump-height");
  },

  zoomToDistrict: function(name) {
    var layer = this.findDistrictLayer(name);
    var bounds = layer.getBounds();
    this.map.fitBounds(bounds);
    this.selectedDistrict = layer.feature.properties.dist_name;
    this.updateView();
  },

  updateView: function() {
    this.districts.setStyle(this.restyle);
    if (this.selectedDistrict) {
      $("body").removeClass("frozen");
      this.enableMapInteractions(true);
      this.updateSelectedDistrictInfo(this.selectedDistrict);
      $("select").val(this.selectedDistrict);
    } else {
      $("body").addClass("frozen");
      map.fitBounds(this.cityBounds);
      this.enableMapInteractions(false);
    }
  },

  updateSelectedDistrictInfo: function(district) {
    // Convert numbers to formatted strings
    var districtData = {};
    for (var index in demoData[district]) {
      districtData[index] = formatNumber(demoData[district][index]).toString();
    }

    var percentData = demoPercents[district];

    if (Object.keys(averageData).length == 0) {
      var avg  = demoPercents["avg"];
      for (var key in avg) {
        var value = avg[key];
        averageData[key] = value;
      }    
    }

    // Turn options hash into array for templating
    var optionsArray = [];
    for (var name in demoOptions) {
      demoOptions[name].forEach(function(option) {
        option.dist_percent = percentData[option.id] + "%";
        option.dist_val = parseFloat(percentData[option.id]).toFixed(0);
        option.avg_percent = averageData[option.id] + "%";
        option.avg_val = parseFloat(averageData[option.id]).toFixed(0);
      })
      var obj = {"name": name, "options": demoOptions[name]};
      optionsArray.push(obj);
    }

    $(".district-box").html(ich.districtTemplate({
      graphs: optionsArray, 
      pop: districtData.population, 
      district: district,
      candidates: candidateData[district]
    })); 
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