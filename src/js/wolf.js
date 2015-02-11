var wolf = require("wherewolf")();
var $ = require("jquery");

var districtTag = "Seattle City Council Districts";

module.exports = {
  init: function(data) {
    wolf.add(districtTag, data);
  },
  instance: wolf,
  findDistrict: function(position) {
    var results = wolf.find(position, { layer: districtTag });
    if (results) {
      return results.dist_name;
    }
  }
}