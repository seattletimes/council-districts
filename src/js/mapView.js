var L = require("leaflet");
var $ = require("jquery");
var heatStyle = require("./heatStyle");

var demoLabels = {
  "population": "Population",
  "white": "White",
  "black": "Black",
  "asian": "Asian",
  "hispanic": "Hispanic",
  "other": "Two or more races/other",
  "single": "Single",
  "married": "Married",
  "renters": "Renters",
  "owners": "Owners",
  "minors": "Under 18",
  "seniors": "Over 65",
  "25k": "Less than $25,000 per year",
  "100k": "Over $100,000 per year",
  "250k": "Over $250,000 per year",
  "drive": "Drive alone",
  "carpool": "Carpool",
  "transit": "Transit",
  "bike": "Bike",
  "walk": "Walk",
  "home": "Home",
  "nonenglish": "Don't speak English at home"
};

var restyle = function(feature) {
  var district = districtData[feature.properties.dist_name];

  if (this.selectedDistrict) {
    if (feature.properties.dist_name == this.selectedDistrict) {
      return { fillColor: "#528965" };
    }
  } else if (this.selectedDemo) {
    return heatStyle(this.selectedDemo, district);
  } else if (this.myDistrict) {
    if (feature.properties.dist_name == this.myDistrict) {
      return { fillColor: "#528965" };
    }
  }
  return { 
    color: "black",
    fillColor: "#c0ccbf",
    weight: 2,
    fillOpacity: 0.7 
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
        var district = districtData[feature.properties.dist_name];

        layer.on({
          click: function(e) {
            self.zoomToDistrict(e.target.feature.properties.dist_name);
          },
          mouseover: function(e) {
            layer.setStyle({fillColor: "#dedede"});
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
    var districtData = demoData[district];

    if (Object.keys(averageData).length == 0) {
      var avg  = demoData["avg"];
      for (var key in avg) {
        var value = avg[key];
            averageData[key] = value;
      }    
    }

    var tableData = [];
    for (var key in districtData) {
      tableData.push({ 
        "district": districtData[key],
        "average": averageData[key],
        "name": demoLabels[key]
      });
    }
    
    console.log(districtData)
    // $(".district-box").html(ich.districtInfo({data: tableData}));

    for (var key in districtData) {
      var percent = districtData[key] / districtData.population * 100;
      this.drawGraph(key, percent, "district");
    }
    for (var key in averageData) {
      var percent = averageData[key] / averageData.population * 100;
      this.drawGraph(key, percent, "average");
    }
  },

  enableMapInteractions: function(enabled) {
    var map = this.map;
    var state = enabled ? "enable" : "disable";
    ["dragging", "boxZoom", "touchZoom", "doubleClickZoom", "scrollWheelZoom"].forEach(function(prop) {
      map[prop][state]();
    })
  },

  drawGraph: function(name, number, type) {
    var percent = number + "%";
    var selector = '.' + name + '.' + type;
    $(selector).width(percent);
  }
};

module.exports = MapView;