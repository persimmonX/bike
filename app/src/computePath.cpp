#include "computePath.h"
#define PI 3.14156926
#define ViewWidth 128
#define ViewHeight 128
#define xmin -20037508.3427892
#define ymin -20037508.3427892
#define xmax 20037508.3427892
#define ymax 20037508.3427892
#define MAXROW 2
#define MAXCLOUMN 2

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
    cout<<"Resolution:"<<Resolution<<endl;
    // 当前窗口显示的范围
    double minX = centerGeoPoint.x - (Resolution * ViewWidth) / 2;
    cout<<"minX:"<<minX<<endl;
    double maxX = centerGeoPoint.x + (Resolution * ViewWidth) / 2;
    double minY = centerGeoPoint.y - (Resolution * ViewHeight) / 2;
    double maxY = centerGeoPoint.y + (Resolution * ViewHeight) / 2;
    cout<<"maxY:"<<maxY<<endl;
    // 左上角开始的行列号
    int leftTopTitleRow = floor(abs(maxY - ymax) / Resolution / TitlePix);
    int leftTopTitleCol = floor(abs(minX - xmin) / Resolution / TitlePix);
    cout<<"leftTopTitleRow:"<<leftTopTitleRow<<endl;
    cout<<"leftTopTitleCol:"<<leftTopTitleCol<<endl;

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