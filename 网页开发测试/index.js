import { origin } from "./store.js";

var resolution = getResolution(origin.zoom);
var client = document.getElementById("wp");
var ViewWidth = client.clientWidth;
var ViewHeight = client.clientHeight;

var MapConfig = {
  RootDir: "http://t2.tianditu.gov.cn/DataServer?T=img_w&tk=af7560c213f145a1a52db53ca8c3fb5e",
  ViewHeight: ViewHeight,
  ViewWidth: ViewWidth,
  Resolution: resolution,
  TitlePix: 256,
  FullExtent: {
    xmin: -20037508.3427892,
    ymin: -20037508.3427892,
    xmax: 20037508.3427892,
    ymax: 20037508.3427892,
    spatialReference: {
      wkid: 3857,
    },
  },
};

let path = [];
renderToView(origin.lon, origin.lat, origin.zoom);
origin.watch.push(origin => {
  renderToView(origin.lon, origin.lat, origin.zoom);
});
function renderToView(lon, lat, zoom) {
  const point = baiduToWgs84([lon, lat]);
  const lnglatEle = document.querySelector(".lnglat");
  lnglatEle.innerHTML = point.map(item=>Number(item).toFixed(5)).join(",") + `\n zoom:${zoom}`
  // const point = [lon, lat];
  var centerGeoPoint = lonlatTomercator({ x: point[0], y: point[1] });
  const Resolution = getResolution(zoom);
  //当前窗口显示的范围
  var minX = centerGeoPoint.x - (Resolution * MapConfig.ViewWidth) / 2;
  var maxX = centerGeoPoint.x + (Resolution * MapConfig.ViewWidth) / 2;
  var minY = centerGeoPoint.y - (Resolution * MapConfig.ViewHeight) / 2;
  var maxY = centerGeoPoint.y + (Resolution * MapConfig.ViewHeight) / 2;

  //左上角开始的行列号
  var leftTopTitleRow = Math.floor(Math.abs(maxY - MapConfig.FullExtent.ymax) / Resolution / MapConfig.TitlePix);
  var leftTopTitleCol = Math.floor(Math.abs(minX - MapConfig.FullExtent.xmin) / Resolution / MapConfig.TitlePix);
  //实际地理范围
  var realMinX = MapConfig.FullExtent.xmin + leftTopTitleCol * MapConfig.TitlePix * Resolution;
  var realMaxY = MapConfig.FullExtent.ymax - leftTopTitleRow * MapConfig.TitlePix * Resolution;

  //计算左上角偏移像素
  var offSetX = (realMinX - minX) / Resolution;
  var offSetY = (maxY - realMaxY) / Resolution;

  //计算瓦片个数
  var xClipNum = Math.ceil((MapConfig.ViewHeight + Math.abs(offSetY)) / MapConfig.TitlePix);
  var yClipNum = Math.ceil((MapConfig.ViewWidth + Math.abs(offSetX)) / MapConfig.TitlePix);

  if (xClipNum > 0) {
    console.log("🐤 - renderToView - xClipNum:", xClipNum);
    console.log(point, zoom)
  }
  //右下角行列号
  var rightBottomTitleRow = leftTopTitleRow + xClipNum - 1;
  var rightBottomTitleCol = leftTopTitleCol + yClipNum - 1;
  var realMaxX = MapConfig.FullExtent.xmin + (rightBottomTitleCol + 1) * MapConfig.TitlePix * Resolution;
  var realMinY = MapConfig.FullExtent.ymax - (rightBottomTitleRow + 1) * MapConfig.TitlePix * Resolution;

  //   var mapcv = document.getElementById("mapcv");
  //   mapcv.innerHTML = "";
  //   for (var i = 0; i < xClipNum; i++) {
  //     for (var j = 0; j < yClipNum; j++) {
  //       var beauty = new Image();
  //       var ele = document.createElement("img");
  //       //   beauty.src = MapConfig.RootDir + "&X=" + (leftTopTitleCol + j) + "&Y=" + (leftTopTitleRow + i) + "&L=" + level;
  //       // beauty.src = `https://webst02.is.autonavi.com/appmaptile?style=6&x=${leftTopTitleCol + j}&y=${leftTopTitleRow + i}&z=${origin.zoom}`;
  //       // beauty.src = `http://online1.map.bdimg.com/onlinelabel/?qt=tile&x=${leftTopTitleCol + j}&y=${leftTopTitleRow + i}&z=${origin.zoom}&styles=pl&scaler=1&p=1`;
  //       beauty.src = `https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetGray/MapServer/tile/${zoom}/${leftTopTitleRow + i}/${leftTopTitleCol + j}`;
  //       var TitleImg = {
  //         img: null,
  //         x: 0,
  //         y: 0,
  //       };
  //       TitleImg.img = beauty;
  //       TitleImg.x = offSetX + j * MapConfig.TitlePix;
  //       TitleImg.y = offSetY + i * MapConfig.TitlePix;
  //       ele.src = beauty.src;
  //       ele.alt = "hello";
  //       ele.style.transform = `translateX(${Math.ceil(TitleImg.x)}px) translateY(${Math.ceil(TitleImg.y)}px)`;
  //       // ele.style.border = "1px solid red";
  //       ele.style.position = "absolute";
  //       ele.style.top = "0px";
  //       ele.style.left = "0px";
  //       mapcv.appendChild(ele);
  //     }
  //   }
  var mapcv = document.getElementById("mapcv");
  mapcv.width = ViewWidth;
  mapcv.height = ViewHeight;
  var myctx = mapcv.getContext("2d");
  myctx.clearRect(0, 0, ViewWidth, ViewHeight);
  for (let i = 0; i < xClipNum; i++) {
    for (let j = 0; j < yClipNum; j++) {
      let beauty = new Image();
      //   beauty.src = MapConfig.RootDir + "&X=" + (leftTopTitleCol + j) + "&Y=" + (leftTopTitleRow + i) + "&L=" + level;
      beauty.src = `https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetGray/MapServer/tile/${zoom}/${leftTopTitleRow + i}/${leftTopTitleCol + j}`;
      let TitleImg = {
        img: null,
        x: 0,
        y: 0,
      };
      TitleImg.img = beauty;
      TitleImg.x = Math.floor(offSetX + j * MapConfig.TitlePix);
      TitleImg.y = Math.floor(offSetY + i * MapConfig.TitlePix);
      console.log(`图片:/${zoom}/${leftTopTitleRow + i}/${leftTopTitleCol + j},offsetX:${TitleImg.x},offsetY:${TitleImg.y}`)
      beauty.onload = function () {
        myctx.drawImage(TitleImg.img, TitleImg.x, TitleImg.y);
      };
    }
  }

  renderPath(myctx, path, Resolution);
}

function renderPath(ctx, path, resolution) {
  if (path.length == 0) {
    fetch("../路书/lushu-3562507.json")
      .then(res => {
        return res.json();
      })
      .then(res => {
        path = res.map(item => {
          return baiduToWgs84(item);
        });
        drawPath(ctx, path, resolution);
      });
  } else {
    drawPath(ctx, path, resolution);
  }
}

function drawPath(ctx, path, resolution) {
  //中心的墨卡托坐标
  var centerGeoPoint = lonlatTomercator({ x: origin.lon, y: origin.lat });
  const reltiveMoctorPath = path.map(item => {
    let moctorPosition = lonlatTomercator({ x: item[0], y: item[1] });
    return [ViewWidth / 2 + (moctorPosition.x - centerGeoPoint.x) / resolution, ViewWidth / 2 + (centerGeoPoint.y - moctorPosition.y) / resolution];
  });
  const first = reltiveMoctorPath.shift();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "green";
  ctx.moveTo(...first);
  reltiveMoctorPath.forEach(element => {
    ctx.lineTo(...element);
  });
  ctx.stroke();
}

function lonlatTomercator(lonlat) {
  var mercator = { x: 0, y: 0 };
  var x = (lonlat.x * 20037508.34) / 180;
  var y = Math.log(Math.tan(((90 + lonlat.y) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;
  mercator.x = x;
  mercator.y = y;
  return mercator;
}

function getResolution(level) {
  return 156543.03 * Math.pow(2, -level);
}

function baiduToWgs84(position) {
  var bdLon = position[0];
  var bdLat = position[1];
  var PI = 3.14159265358979324;
  var x_pi = (3.14159265358979324 * 3000.0) / 180.0;
  var x = parseFloat(bdLon) - 0.0065;
  var y = parseFloat(bdLat) - 0.006;
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
  var gcjLon = z * Math.cos(theta);
  var gcjLat = z * Math.sin(theta);
  var a = 6378245.0;
  var ee = 0.00669342162296594323;
  var dLat = transformLat(gcjLon - 105.0, gcjLat - 35.0);
  var dLon = transformLon(gcjLon - 105.0, gcjLat - 35.0);
  var radLat = (gcjLat / 180.0) * PI;
  var magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  var sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * PI);
  dLon = (dLon * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * PI);
  dLat = gcjLat - dLat;
  dLon = gcjLon - dLon;
  return [dLon, dLat];
}
function transformLon(x, y) {
  var PI = 3.14159265358979324;
  var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}
function transformLat(x, y) {
  var PI = 3.14159265358979324;
  var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}
