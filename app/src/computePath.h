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

Point lonlatTomercator(Point lonlat);
computePath computeRowColumn(double lng, double lat, int zoom);