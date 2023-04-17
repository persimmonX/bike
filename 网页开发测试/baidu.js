import { origin } from "./store.js";
var map = new BMapGL.Map("baidu"); // 创建Map实例
map.centerAndZoom(new BMapGL.Point(origin.lon, origin.lat), origin.zoom); // 初始化地图,设置中心点坐标和地图级别
map.enableScrollWheelZoom(true); // 开启鼠标滚轮缩放
map.addEventListener("zoomend", function (e) {
  getMapStatus();
});
map.addEventListener("moveend", function (e) {
  getMapStatus();
});

function getMapStatus() {
  var cen = map.getCenter(); // 获取地图中心点
  var zoom = map.getZoom();
  origin.zoom = Math.floor(zoom);
  origin.lon = cen.lng;
  origin.lat = cen.lat;
}

fetch("../路书/lushu-3562507.json")
  .then(res => {
    return res.json();
  })
  .then(res => {
    var path = res.map(item => {
      const trans = coordtransform.bd09togcj02(...item);
      console.log("🐤 - path - trans:", trans);
      return new BMapGL.Point(...item);
    });
    var polyline = new BMapGL.Polyline(path, {
      clip: false,
      geodesic: true,
      strokeWeight: 3,
      strokeColor: "green",
    });
    map.addOverlay(polyline);
  });
