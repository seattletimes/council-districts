var $ = require("jquery");

var values = {};
for (var num in demoData) {
  var district = demoData[num]
  for (var key in district) {
    if (!values[key]) values[key] = [];
    values[key].push(district[key]);
  }
}

// find min and max values for each demographic
var bounds = {};
for (var key in values) {
  bounds[key] = {
    max: Math.max.apply(null, values[key]),
    min: (Math.min.apply(null, values[key]) / 2 )
  }
}

// generate color for heat map
module.exports = function(demographic, district) {
  var maxHue = [123, 90, 166];

  var max = bounds[demographic].max;
  var min = bounds[demographic].min;

  var value = demoData[district][demographic];

  var scaler = (value - min) / (max - min);
  var values = maxHue.map(function(c) {
    return Math.round(255 - (255 - c) * scaler);
  });

  var fillColor = "rgb(" + values.join(",") + ")";
  var percent = demoPercents[district][demographic];

  if (value == max) {
    $(".max.swatch").css("background-color", fillColor);
    $(".max.val").html(percent.toFixed(0));
  }

  if (value == min * 2) {
    $(".min.swatch").css("background-color", fillColor);
    $(".min.val").html(percent.toFixed(0));
  }

  var data = $("#" + demographic).data();
  $(".legend-name").html(data.name + ":");
  $(".legend-label").html(data.label);

  return fillColor;
};
