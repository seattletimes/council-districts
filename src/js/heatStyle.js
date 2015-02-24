var $ = require("jquery");

var values = {};
for (var num in demoData) {
  if (num !== "avg") {
    var district = demoData[num]
    for (var key in district) {
      if (!values[key]) values[key] = [];
      values[key].push(district[key]);
    }
  }
}

// find min and max values for each demographic
var bounds = {};
for (var key in values) {
  var max = average(values[key]) + (2 * standardDeviation(values[key]));
  var min = average(values[key]) - (2 * standardDeviation(values[key]));

  if (min < 0) {
    max += min;
    min = 0;
  }

  bounds[key] = {
    total: values[key],
    max: max,
    min: min
  }
}

function standardDeviation(values){
  var avg = average(values);
  
  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });
  
  var avgSquareDiff = average(squareDiffs);
 
  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}
 
function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);
 
  var avg = sum / data.length;
  return avg;
}

// generate color for heat map
module.exports = function(demographic, district) {
  var maxHue = [123, 90, 166];

  var max = bounds[demographic].max;
  var min = bounds[demographic].min;

  var value = demoData[district][demographic];

  var scaler = (value - min) / (max - min);

  if (scaler > 1) { scaler = 1 }
  if (scaler < 0.15) { scaler = 0.15 }

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
