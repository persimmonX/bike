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
function refreshCoordInfo(lon, lat, zoom) {
  const lnglatEle = document.querySelector(".lnglat");
  const gcj02Ele = document.querySelector(".coord .gcj02");
  const bd09Ele = document.querySelector(".coord .bd09");
  const wgs84Ele = document.querySelector(".coord .wgs84");

  const gcj02 = coordtransform.bd09togcj02(lon, lat);
  console.log("🐤 - refreshCoordInfo - gcj02:", gcj02);
  const wgs84 = coordtransform.gcj02towgs84(...gcj02);

  lnglatEle.innerHTML = "火星坐标系：" + gcj02.map(item => Number(item).toFixed(5)).join(",") + `\n zoom:${zoom}`;
  gcj02Ele.innerHTML = "火星坐标系：" + gcj02.map(item => Number(item).toFixed(5)).join(",") + `\n zoom:${zoom}`;
  bd09Ele.innerHTML = "百度坐标系：" + [lon, lat].map(item => Number(item).toFixed(5)).join(",") + `\n zoom:${zoom}`;
  wgs84Ele.innerHTML = "wgs84坐标系：" + wgs84.map(item => Number(item).toFixed(5)).join(",") + `\n zoom:${zoom}`;
}
function renderToView(lon, lat, zoom) {
  refreshCoordInfo(lon, lat, zoom);
  const point = baiduToWgs84([lon, lat]);
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
    console.log(point, zoom);
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
      console.log(`图片:/${zoom}/${leftTopTitleRow + i}/${leftTopTitleCol + j},offsetX:${TitleImg.x},offsetY:${TitleImg.y}`);
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
  let gcj02 = coordtransform.bd09togcj02(...position);
  // return coordtransform.gcj02towgs84(...gcj02)
  return gcj02;
}
