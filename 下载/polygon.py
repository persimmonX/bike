import math
from down import download  
xmin =  -20037508.3427892
ymin = -20037508.3427892
xmax = 20037508.3427892
ymax = 20037508.3427892
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
def lonlatTomercator(lonlat):
    x = (lonlat.x * 20037508.34) / 180
    y = math.log(math.tan(((90 + lonlat.y) * math.pi) / 360)) / (math.pi / 180)
    y = (y * 20037508.34) / 180
    lonlat.x = x
    lonlat.y = y
    return lonlat
def getResolution (level):
    return 156543.03 * pow(2, -level)

def get_max_point(moctor_polygon):
    a_xmin = 20037508.3427892
    a_ymin = 20037508.3427892
    a_xmax = 0
    a_ymax = 0
    for item in moctor_polygon:
        if(item.x>=a_xmax) :
            a_xmax = item.x
        if(item.x<=a_xmin) :
            a_xmin = item.x
        if(item.y>=a_ymax) :
            a_ymax = item.y
        if(item.y<=a_ymin) :
            a_ymin = item.y
    return a_xmax,a_ymax,a_xmin,a_ymin
def is_in_polygon(moctor_area,point):
    n = len(moctor_area)
    nCross = 0
    for i in range(n):
        p1 = moctor_area[i]
        p2 = moctor_area[(i+1)%n]
        #特殊情况：边界p1p2 与 y=p0.y平行，不计数
        if (p1.y == p2.y) :continue
        # 交点在p1p2延长线上，注意是小于，不计数
        if (point.y < min(p1.y, p2.y)): continue
        #交点在p1p2延长线上，注意是大于等于，不计数
        if (point.y >= max(p1.y, p2.y)): continue
        #求交点的 X 坐标；根据相似三角形计算
        crossx = (point.y-p1.y)*(p2.x-p1.x)/(p2.y-p1.y)+p1.x
        #只统计单边交点
        if (crossx >= point.x):
            nCross += 1
    return (nCross % 2 == 1)
# 多边形区域
def compute(polygon,zoom):
    # 区域转平面墨卡托坐标系
    moctor_area = []
    for item in polygon:
        p = Point(item[0],item[1])
        lonlatTomercator(p)
        moctor_area.append(p)
    # 计算当前zoom下的分辨率 每1个像素对应米
    dpi = getResolution(zoom)
    print("dpi:%d"%dpi)
    step = dpi * 256
    print("step:%d"%step)
    # 计算多边形中最大和最小的点
    points = get_max_point(moctor_area)
    print(points)
    orgin_x = points[2]
    orgin_y = points[3]
    # 根据点获取当前所在瓦片数
    min_tileX = math.floor(orgin_y/step)
    min_tileY = math.floor(orgin_x/step)
    max_tileX = math.floor(points[1]/step)
    max_tileY = math.floor(points[0]/step)
    print("左上角行：%d,列：%d"%(min_tileX,min_tileY))
    print("max左上角行：%d,列：%d"%(max_tileX,max_tileY))

    count = 0
    paths = []
    if(min_tileX==max_tileX and min_tileY == max_tileY):
        tileY = math.floor(abs(orgin_x + xmax ) / step)
        tileX = math.floor(abs(orgin_y - ymax ) / step)
        path = "/" +str(zoom)+ "/"+str(tileX)+"/"+str(tileY)
        paths.append(path)
    else:
        for i in range(max_tileY - min_tileY + 1):
            for j in range(max_tileX-min_tileX + 1):
                c_tileX = min_tileX + i
                c_tileY = min_tileY + j
                p = Point(c_tileY*step,c_tileX*step)
                if (is_in_polygon(moctor_area,p)):
                    count += 1
                    # arcgis路径
                    tileY = math.floor(abs(p.x + xmax ) / step)
                    tileX = math.floor(abs(p.y - ymax ) / step)
                    path = "/" +str(zoom)+ "/"+str(tileX)+"/"+str(tileY)
                    paths.append(path)
                    # print("图片路径为：/%d/%d/%d"%(zoom,tileX,tileY))
    # 1张图片8kb
    large = math.ceil(count*8/1024)
    print("总共需要：%d张图片,大小：%dM"%(count,large))
    # 下载
    down_num = 0
    for path in paths:
        # 已下载
        download(path)
        down_num += 1
        last = count-down_num if count-down_num >0 else 0
        print("已下载：%d张,剩余：%d张,"%(down_num,last))
def getPolygon(path):
    with open(path) as f:
        line = f.read()
        area = line.split("|")
        area.sort()
        line = area[0].split(";")
        temp = []
        for item in line:
            x = item.split(",")
            y =[]
            y.append(float(x[0]))
            y.append(float(x[1]))
            temp.append(y)
        f.close()
        return temp
if __name__ =="__main__":
    print("开始计算")
    polygon = getPolygon("./sh.txt")
    compute(polygon,6)
    # 测试
    # p =  lonlatTomercator(Point(120,30))
    # print(p.__dict__)
    # c = math.floor(abs(p.x + xmax)/getResolution(10)/256)
    # r  =math.floor(abs(p.y - ymax)/getResolution(10)/256)
    # print("c:%d,r:%d"%(c,r))


