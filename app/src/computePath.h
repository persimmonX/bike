#include <iostream>
#include <cmath>
#define MAXROW 2
#define MAXCLOUMN 2
#define TitlePix 256
using namespace std;
struct computePath
{
    double offsetX;
    double offsetY;
    string paths[MAXROW][MAXCLOUMN];
};

double getResolution(double level);
class Point
{
public:
    double x;
    double y;
};
bool out_of_china(double lng, double lat);
double transformlat(double lng, double lat);
double transformlng(double lng, double lat);
void wgs84togcj02(double lng, double lat,double *arr);
Point lonlatTomercator(Point lonlat);
computePath computeRowColumn(double lng, double lat, int zoom);
