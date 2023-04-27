import math
import os
import requests
import re
ViewWidth =500
ViewHeight =500
TitlePix =256
xmin =  -20037508.3427892
ymin = -20037508.3427892
xmax = 20037508.3427892
ymax = 20037508.3427892

#在WGS84参考椭球中，赤道长度为40075.016686 km，在zoom level为0的时候，假设瓦片大小为256*256像素，1个像素对应的实际地理空间尺寸为156543.03米，计算公式为
def getResolution (level):
    return 156543.03 * pow(2, -level)

def lonlatTomercator(lonlat):
    x = (lonlat.x * 20037508.34) / 180
    y = math.log(math.tan(((90 + lonlat.y) * math.pi) / 360)) / (math.pi / 180)
    y = (y * 20037508.34) / 180
    lonlat.x = x
    lonlat.y = y
    return lonlat
def download(file_path):
    picture_url = "https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetGray/MapServer/tile/" + file_path
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36           (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36 QIHU 360SE",
        }
    r = requests.get(picture_url, headers=headers)
    dir_path =  re.search(r'^(/\d+/\d+)/\d+$',file_path)
    pre_dir = "./dist-map"
    if dir_path:
        path = pre_dir + dir_path.group(1)
        if(os.path.exists(path)):
            pass
        else:
            os.makedirs(path)
        file_path = pre_dir + file_path + ".png"
        with open(file_path, 'wb') as f:
            f.write(r.content)
    
def computeRowColumn( center,  zoom):

    centerGeoPoint = lonlatTomercator(center)
    Resolution = getResolution(zoom)
    print("centerGeoPoint:%s"%Resolution)
    # 当前窗口显示的范围
    minX = centerGeoPoint.x - (Resolution * ViewWidth) / 2
    print("minX:%s"%minX)
    maxX = centerGeoPoint.x + (Resolution * ViewWidth) / 2
    minY = centerGeoPoint.y - (Resolution * ViewHeight) / 2
    maxY = centerGeoPoint.y + (Resolution * ViewHeight) / 2
    print("maxY:%s"%maxY)
    # 左上角开始的行列号
    leftTopTitleRow = math.floor(abs(maxY - ymax) / Resolution / TitlePix)
    leftTopTitleCol = math.floor(abs(minX - xmin) / Resolution / TitlePix)
    print("leftTopTitleRow:%s"%leftTopTitleRow)
    print("leftTopTitleCol:%s"%leftTopTitleCol)

    # 实际地理范围
    realMinX = xmin + leftTopTitleCol * TitlePix * Resolution
    realMaxY = ymax - leftTopTitleRow * TitlePix * Resolution

    # 计算左上角偏移像素
    offSetX = (realMinX - minX) / Resolution
    offSetY = (maxY - realMaxY) / Resolution
    print("offSetX:%d"%offSetX+" offsetY:%d"%offSetY)

    # 计算瓦片个数
    xClipNum = math.ceil((ViewHeight + abs(offSetY)) / TitlePix)
    yClipNum = math.ceil((ViewWidth + abs(offSetX)) / TitlePix)
    print(yClipNum)
    # 右下角行列号
    rightBottomTitleRow = leftTopTitleRow + xClipNum - 1
    rightBottomTitleCol = leftTopTitleCol + yClipNum - 1
    realMaxX = xmin + (rightBottomTitleCol + 1) * TitlePix * Resolution
    realMinY = ymax - (rightBottomTitleRow + 1) * TitlePix * Resolution

    for x in range(xClipNum):
        for y in range(yClipNum):
            file_path = "/"+str(zoom)+"/"+str(x+leftTopTitleRow)+"/"+str(y+leftTopTitleCol)
            print(file_path)
            # download(file_path)

class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
def main():
    center = Point(121,30)
    # center = Point(122,30)
    # center = Point(123,30)
    # center = Point(124,30)
    zoom = 10
    computeRowColumn(center, zoom)
