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
    min: Math.min.apply(null, values[key])
  }
}

// generate color for heat map
module.exports = function(demographic, district) {
  var maxHue = [91, 85, 214];

  var max = bounds[demographic].max;
  var min = bounds[demographic].min;

  var value = demoData[district.name][demographic];
  var scaler = (value - min) / (max - min);
  var values = maxHue.map(function(c) {
    return Math.round(255 - (255 - c) * scaler);
  });
 
  return {fillColor: "rgb(" + values.join(",") + ")"};
}
