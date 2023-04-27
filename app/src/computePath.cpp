#include "computePath.h"
#define PI 3.1415926
#define ViewWidth 128
#define ViewHeight 128
#define xmin -20037508.3427892
#define ymin -20037508.3427892
#define xmax 20037508.3427892
#define ymax 20037508.3427892
#define MAXROW 2
#define MAXCLOUMN 2
#define a 6378245.0
#define ee 0.00669342162296594323

double getResolution(double level)
{
    return 156543.03 * pow(2, -level);
}

Point lonlatTomercator(Point lonlat)
{
    Point mercator;
    double x = (lonlat.x * 20037508.34) / 180;
    double y = log(tan(((90 + lonlat.y) * PI) / 360)) / (PI / 180);
    y = (y * 20037508.34) / 180;
    mercator.x = x;
    mercator.y = y;
    return mercator;
}

computePath curentPaths;

computePath computeRowColumn(double lng, double lat, int zoom)
{
    Point p;
    p.x = lng;
    p.y = lat;
    Point centerGeoPoint = lonlatTomercator(p);
    double Resolution = getResolution(zoom);
    cout << "Resolution:" << Resolution << endl;
    // 当前窗口显示的范围
    double minX = centerGeoPoint.x - (Resolution * ViewWidth) / 2;
    cout << "minX:" << minX << endl;
    double maxX = centerGeoPoint.x + (Resolution * ViewWidth) / 2;
    double minY = centerGeoPoint.y - (Resolution * ViewHeight) / 2;
    double maxY = centerGeoPoint.y + (Resolution * ViewHeight) / 2;
    cout << "maxY:" << maxY << endl;
    // 左上角开始的行列号
    int leftTopTitleRow = floor(abs(maxY - ymax) / Resolution / TitlePix);
    int leftTopTitleCol = floor(abs(minX - xmin) / Resolution / TitlePix);
    cout << "leftTopTitleRow:" << leftTopTitleRow << endl;
    cout << "leftTopTitleCol:" << leftTopTitleCol << endl;

    // 实际地理范围
    double realMinX = xmin + leftTopTitleCol * TitlePix * Resolution;
    double realMaxY = ymax - leftTopTitleRow * TitlePix * Resolution;

    // 计算左上角偏移像素
    double offSetX = (realMinX - minX) / Resolution;
    double offSetY = (maxY - realMaxY) / Resolution;

    // 计算瓦片个数
    int xClipNum = ceil((ViewHeight + abs(offSetY)) / TitlePix);
    int yClipNum = ceil((ViewWidth + abs(offSetX)) / TitlePix);
    // 右下角行列号
    int rightBottomTitleRow = leftTopTitleRow + xClipNum - 1;
    int rightBottomTitleCol = leftTopTitleCol + yClipNum - 1;
    int realMaxX = xmin + (rightBottomTitleCol + 1) * TitlePix * Resolution;
    int realMinY = ymax - (rightBottomTitleRow + 1) * TitlePix * Resolution;
    curentPaths.offsetX = offSetX;
    curentPaths.offsetY = offSetY;
    for (int x = 0; x < xClipNum; x++)
    {
        for (int y = 0; y < yClipNum; y++)
        {
            printf("请求图片：");
            string str = "/" + to_string(zoom) + "/" + to_string(x + leftTopTitleRow) + "/" + to_string(y + leftTopTitleCol);
            cout << str << endl;
            curentPaths.paths[x][y] = str;
        }
    }
    return curentPaths;
}
void wgs84togcj02(double lng, double lat, double *arr)
{
    // 判断是否超出转换范围
    if (out_of_china(lng, lat))
    {
        arr[0] = lng;
        arr[1] = lat;
    }
    else
    {
        double dlat = transformlat(lng - 105.0, lat - 35.0);
        double dlng = transformlng(lng - 105.0, lat - 35.0);
        double radlat = lat / 180.0 * PI;
        double magic = sin(radlat);
        magic = 1 - ee * magic * magic;
        double sqrtmagic = sqrt(magic);
        dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
        dlng = (dlng * 180.0) / (a / sqrtmagic * cos(radlat) * PI);
        arr[0] = lng + dlng;
        arr[1] = lat + dlat;
    }
}

double transformlng(double lng, double lat)
{
    double ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * sqrt(abs(lng));
    ret += (20.0 * sin(6.0 * lng * PI) + 20.0 * sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * sin(lng * PI) + 40.0 * sin(lng / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * sin(lng / 12.0 * PI) + 300.0 * sin(lng / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}
double transformlat(double lng, double lat)
{
    double ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * sqrt(abs(lng));
    ret += (20.0 * sin(6.0 * lng * PI) + 20.0 * sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * sin(lat * PI) + 40.0 * sin(lat / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * sin(lat / 12.0 * PI) + 320 * sin(lat * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}
bool out_of_china(double lng, double lat)
{
    return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
}