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
    maxVal: max,
    minVal: min,
    maxDist: Math.max.apply(null, values[key]),
    minDist: Math.min.apply(null, values[key]),
    avg: average(values[key])
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

function generateColor(min, max, value) {
  var minHue = [123, 90, 166];
  var maxHue = [202, 105, 81];

  var scaler = (value - min) / (max - min);

  if (scaler > 1) { scaler = 1 }
  if (scaler < 0) { scaler = 0 }
  scaler = scaler * 2 - 1;

  var values;
  if (scaler < 0) {
    values = minHue.map(function(c) {
      return Math.round(255 - (255 - c) * (scaler * -1));
    });
  } else {
    values = maxHue.map(function(c) {
      return Math.round(255 - (255 - c) * scaler);
    });
  }

  return "rgb(" + values.join(",") + ")";
}

function updateLegend(max, min, stop) {
  if (window.matchMedia && window.matchMedia("(max-width: 525px)").matches) {
    var canvas = document.getElementById("mobile-canvas");
  } else {
    var canvas = document.getElementById("desktop-canvas");
  }

  canvas.width = canvas.offsetWidth;
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var gradient = ctx.createLinearGradient(0,0,canvas.width,0);
  gradient.addColorStop(0,min);
  gradient.addColorStop(stop,"white");
  gradient.addColorStop(1,max);
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.strokeStyle = "#555";
  ctx.fillRect(0,canvas.height*0.2,canvas.width,canvas.height*0.6);
  ctx.moveTo(1, 0);
  ctx.lineTo(1, canvas.height);
  ctx.moveTo(canvas.width - 1, 0);
  ctx.lineTo(canvas.width - 1, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "#333";
  ctx.moveTo(stop*canvas.width, 0);
  ctx.lineTo(stop*canvas.width, canvas.height);
  ctx.stroke();
};

// generate color for heat map
module.exports = {
  colorDist: function(demographic, district) {
    var demo = bounds[demographic];
    var fillColor = generateColor(demo.minVal, demo.maxVal, demoData[district][demographic]);

    var data = $("#" + demographic).data();
    $(".legend-name").html(data.name + ":");
    $(".legend-label").html(data.label);
    $(".legend .average.num").html(parseFloat(demo.avg).toFixed(0) + "%")
    $(".legend .max.num").html(parseFloat(demo.maxDist).toFixed(0) + "%")
    $(".legend .min.num").html(parseFloat(demo.minDist).toFixed(0) + "%")

    return fillColor;
  },
  colorLegend: function(demographic) {
    var demo = bounds[demographic];
    var maxDist = generateColor(demo.minVal, demo.maxVal, demo.maxDist);
    var minDist = generateColor(demo.minVal, demo.maxVal, demo.minDist);
    var stop = (demo.avg - demo.minDist)/(demo.maxDist - demo.minDist);
    updateLegend(maxDist, minDist, stop);
    var perc = stop * 100 + "%";
    $(".legend .average").css("left", perc);
  }
};
