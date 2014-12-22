var values = {};
for (var num in demoData) {
  var district = demoData[num]
  for (var key in district) {
    if (!values[key]) values[key] = [];
    values[key].push(district[key]);
  }
}

var bounds = {};
for (var key in values) {
  bounds[key] = {
    max: Math.max.apply(null, values[key]),
    min: Math.min.apply(null, values[key])
  }
}

module.exports = function(demographic, district) {
  var minHue = [222, 222, 222];
  var maxHue = [0, 0, 255];

  var max = bounds[demographic].max;
  var value = demoData[district.name][demographic];
  var scaler = value / max;
  var values = maxHue.map(function(c) {
    return Math.round(222 - (222 - c) * scaler);
  });
 
  return {fillColor: "rgb(" + values.join(",") + ")"};
}
