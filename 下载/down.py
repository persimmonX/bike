import math
import os
import requests
import re
PI =3.14156926
ViewWidth =500
ViewHeight =500
TitlePix =256
xmin =  -20037508.3427892
ymin = -20037508.3427892
xmax = 20037508.3427892
ymax =20037508.3427892

def getResolution (level):
    return 156543.03 * pow(2, -level)

def lonlatTomercator(lonlat):
    x = (lonlat.x * 20037508.34) / 180
    y = math.log(math.tan(((90 + lonlat.y) * PI) / 360)) / (PI / 180)
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
    if dir_path:
        path = "." + dir_path.group(1)
        if(os.path.exists(path)):
            file_path = "." + file_path + ".png"
            with open(file_path, 'wb') as f:
                f.write(r.content)
        else:
            os.makedirs(path)
    
def computeRowColumn( center,  zoom):

    centerGeoPoint = lonlatTomercator(center)
    Resolution = getResolution(zoom)
    # 当前窗口显示的范围
    minX = centerGeoPoint.x - (Resolution * ViewWidth) / 2
    maxX = centerGeoPoint.x + (Resolution * ViewWidth) / 2
    minY = centerGeoPoint.y - (Resolution * ViewHeight) / 2
    maxY = centerGeoPoint.y + (Resolution * ViewHeight) / 2
    # 左上角开始的行列号
    leftTopTitleRow = math.floor(abs(maxY - ymax) / Resolution / TitlePix)
    leftTopTitleCol = math.floor(abs(minX - xmin) / Resolution / TitlePix)

    # 实际地理范围
    realMinX = xmin + leftTopTitleCol * TitlePix * Resolution
    realMaxY = ymax - leftTopTitleRow * TitlePix * Resolution

    # 计算左上角偏移像素
    offSetX = (realMinX - minX) / Resolution
    offSetY = (maxY - realMaxY) / Resolution

    # 计算瓦片个数
    xClipNum = math.ceil((ViewHeight + abs(offSetY)) / TitlePix)
    yClipNum = math.ceil((ViewWidth + abs(offSetX)) / TitlePix)
    # 右下角行列号
    rightBottomTitleRow = leftTopTitleRow + xClipNum - 1
    rightBottomTitleCol = leftTopTitleCol + yClipNum - 1
    realMaxX = xmin + (rightBottomTitleCol + 1) * TitlePix * Resolution
    realMinY = ymax - (rightBottomTitleRow + 1) * TitlePix * Resolution

    for x in range(xClipNum):
        for y in range(yClipNum):
            file_path = "/"+str(zoom)+"/"+str(x+leftTopTitleRow)+"/"+str(y+leftTopTitleCol)
            download(file_path)

class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
def main():
    center = Point(120,30)
    zoom = 10
    computeRowColumn(center, zoom)
main()

