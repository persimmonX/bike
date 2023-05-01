

#include <TFT_eSPI.h>
#include <SPI.h>
#include "FS.h"
#include "SD.h"
#include "computePath.h"
#include <PNGdec.h>
#include <string>
#include <sstream>

#define TFT_W 128
#define TFT_H 128
#define MAX_IMAGE_WIDTH 256 // Adjust for your images

#define GpsSerial Serial2
int16_t xpos = 0;
int16_t ypos = 0;
PNG png;

TFT_eSPI myGLCD = TFT_eSPI(TFT_W, TFT_H);
TFT_CS = 1;
// 函数头
File pngfile;
void pngDraw(PNGDRAW *pDraw);
void *pngOpen(const char *filename, int32_t *size);
void pngClose(void *handle);
int32_t pngRead(PNGFILE *page, uint8_t *buffer, int32_t length);
int32_t pngSeek(PNGFILE *page, int32_t position);

// gps配置
const unsigned int gpsRxBufferLength = 600;
char gpsRxBuffer[gpsRxBufferLength];
unsigned int ii = 0;

struct
{
  char GPS_Buffer[80];
  bool isGetData;     // 是否获取到GPS数据
  bool isParseData;   // 是否解析完成
  char UTCTime[11];   // UTC时间
  char latitude[11];  // 纬度
  char N_S[2];        // N/S
  char longitude[12]; // 经度
  char E_W[2];        // E/W
  bool isUsefull;     // 定位信息是否有效
} Save_Data;

void setup()
{
  Serial.begin(115200);
  GpsSerial.begin(9600);
  Serial.println("初始化屏幕....");
  myGLCD.init();
  myGLCD.fillScreen(TFT_BLUE);
  Serial.println("显示开机界面....");
  myGLCD.setRotation(0);
  myGLCD.drawCentreString("Hello world!", TFT_W / 2, TFT_H / 2, 2);
  Serial.println("初始化储存卡....");
  if (!SD.begin(5))
  {
    Serial.println("开启储存卡失败!!!");
  }
  Serial.println("计算经纬度对应行列....");
  Serial.print("gps 初始化");
  Save_Data.isGetData = false;
  Save_Data.isParseData = false;
  Save_Data.isUsefull = false;
}

void centerMap(double lng, double lat)
{
  double *arr = new double[2];
  wgs84togcj02(lng, lat, arr);
  computePath c = computeRowColumn(arr[0], arr[1], 15);
  for (int i = 0; i < MAXROW; i++)
  {
    for (int j = 0; j < MAXCLOUMN; j++)
    {
      string str = c.paths[i][j];
      if (!str.empty())
      {
        Serial.println("开始");
        show(str, c.offsetX + j * TitlePix , c.offsetY + i * TitlePix);
      }
    }
  }
}

void show(string path, int offsetX, int offsetY)
{
  Serial.printf("加载图片-：");
  Serial.print(path.c_str());
  Serial.print(" offsetX：");
  Serial.print(offsetX);
  Serial.print(" offsetY：");
  Serial.print(offsetY);
  string strname = "/dist-map" + path + ".png";
  xpos = offsetX;
  ypos = offsetY;

  int16_t rc = png.open(strname.c_str(), pngOpen, pngClose, pngRead, pngSeek, pngDraw);
  if (rc == PNG_SUCCESS)
  {
    Serial.printf("image specs: (%d x %d), %d bpp, pixel type: %d\n", png.getWidth(), png.getHeight(), png.getBpp(), png.getPixelType());
    uint32_t dt = millis();
    if (png.getWidth() > MAX_IMAGE_WIDTH)
    {
      Serial.println("Image too wide for allocated line buffer size!");
    }
    else
    {
      rc = png.decode(NULL, 0);
      png.close();
      int r = 5;
      myGLCD.drawCircle(TFT_W / 2, TFT_H / 2, r, TFT_RED);
    }
  }
  else
  {
    Serial.println("xxxx");
  }
}
void loop()
{
  gpsRead();        // 获取GPS数据
  parseGpsBuffer(); // 解析GPS数据
  printGpsBuffer(); // 输出解析后的数据
  
}

void pngDraw(PNGDRAW *pDraw)
{
  uint16_t lineBuffer[MAX_IMAGE_WIDTH];
  png.getLineAsRGB565(pDraw, lineBuffer, PNG_RGB565_BIG_ENDIAN, 0xffffffff);
  // cout <<"当前的偏移量xpos："<<xpos<<endl;
  // cout <<"当前的偏移量ypos："<<ypos<<endl;
  myGLCD.pushImage(xpos, ypos + pDraw->y, pDraw->iWidth, 1, lineBuffer);
}

void *pngOpen(const char *filename, int32_t *size)
{
  pngfile = SD.open(filename, "r");
  *size = pngfile.size();
  Serial.print("open");
  return &pngfile;
}

void pngClose(void *handle)
{
  File pngfile = *((File *)handle);
  if (pngfile)
    pngfile.close();
}

int32_t pngRead(PNGFILE *page, uint8_t *buffer, int32_t length)
{
  if (!pngfile)
    return 0;
  page = page; // Avoid warning
  return pngfile.read(buffer, length);
}

int32_t pngSeek(PNGFILE *page, int32_t position)
{
  if (!pngfile)
    return 0;
  page = page; // Avoid warning
  return pngfile.seek(position);
}

void gpsRead()
{
  while (GpsSerial.available())
  {
    gpsRxBuffer[ii++] = GpsSerial.read();
    if (ii == gpsRxBufferLength)
      clrGpsRxBuffer();
  }

  char *GPS_BufferHead;
  char *GPS_BufferTail;
  if ((GPS_BufferHead = strstr(gpsRxBuffer, "$GPRMC,")) != NULL || (GPS_BufferHead = strstr(gpsRxBuffer, "$GNRMC,")) != NULL)
  {
    if (((GPS_BufferTail = strstr(GPS_BufferHead, "\r\n")) != NULL) && (GPS_BufferTail > GPS_BufferHead))
    {
      memcpy(Save_Data.GPS_Buffer, GPS_BufferHead, GPS_BufferTail - GPS_BufferHead);
      Save_Data.isGetData = true;

      clrGpsRxBuffer();
    }
  }
}

void parseGpsBuffer()
{
  char *subString;
  char *subStringNext;
  if (Save_Data.isGetData)
  {
    Save_Data.isGetData = false;
    Serial.println("**************");
    Serial.println(Save_Data.GPS_Buffer);

    for (int i = 0; i <= 6; i++)
    {
      if (i == 0)
      {
        if ((subString = strstr(Save_Data.GPS_Buffer, ",")) == NULL)
          errorLog(1); // 解析错误
      }
      else
      {
        subString++;
        if ((subStringNext = strstr(subString, ",")) != NULL)
        {
          char usefullBuffer[2];
          switch (i)
          {
          case 1:
            memcpy(Save_Data.UTCTime, subString, subStringNext - subString);
            break; // 获取UTC时间
          case 2:
            memcpy(usefullBuffer, subString, subStringNext - subString);
            break; // 获取UTC时间
          case 3:
            memcpy(Save_Data.latitude, subString, subStringNext - subString);
            break; // 获取纬度信息
          case 4:
            memcpy(Save_Data.N_S, subString, subStringNext - subString);
            break; // 获取N/S
          case 5:
            memcpy(Save_Data.longitude, subString, subStringNext - subString);
            break; // 获取纬度信息
          case 6:
            memcpy(Save_Data.E_W, subString, subStringNext - subString);
            break; // 获取E/W

          default:
            break;
          }

          subString = subStringNext;
          Save_Data.isParseData = true;
          if (usefullBuffer[0] == 'A')
            Save_Data.isUsefull = true;
          else if (usefullBuffer[0] == 'V')
            Save_Data.isUsefull = false;
        }
        else
        {
          errorLog(2); // 解析错误
        }
      }
    }
  }
}
void printGpsBuffer()
{
  if (Save_Data.isParseData)
  {
    Save_Data.isParseData = false;

    Serial.print("Save_Data.UTCTime = ");
    Serial.println(Save_Data.UTCTime);

    if (Save_Data.isUsefull)
    {
      Save_Data.isUsefull = false;
      Serial.print("Save_Data.latitude = ");
      Serial.println(Save_Data.latitude);
      Serial.print("Save_Data.N_S = ");
      Serial.println(Save_Data.N_S);
      Serial.print("Save_Data.longitude = ");
      Serial.println(Save_Data.longitude);
      Serial.print("Save_Data.E_W = ");
      Serial.println(Save_Data.E_W);
      // $GNRMC,121658.000,A,3115.93422,N,12135.14385,E,4.39,185.22,280423,,,A,V*09
      // Save_Data.UTCTime = 121658.000
      // Save_Data.latitude = 3115.93422
      // Save_Data.N_S = N
      // Save_Data.longitude = 12135.14385
      // Save_Data.E_W = E

      string tmp_lat = string(Save_Data.latitude, 10);
      string lat_int = tmp_lat.substr(0, 2);
      string lat_float = tmp_lat.substr(2, 10);
      double lat = atof(lat_int.c_str()) + atof(lat_float.c_str()) / 60;

      string tmp_lng = string(Save_Data.longitude, 10);
      string lng_int = tmp_lng.substr(0, 3);
      string lng_float = tmp_lng.substr(3, 10);
      double lng = atof(lng_int.c_str()) + atof(lng_float.c_str()) / 60;
      Serial.println(lng);
      Serial.println(lat);
      centerMap(lng, lat);
    }
    else
    {
      Serial.println("GPS DATA is not usefull!");
    }
  }
}

void errorLog(int num)
{
  Serial.print("ERROR");
  Serial.println(num);
  // while (1)
  // {
  //   digitalWrite(L, HIGH);
  //   delay(300);
  //   digitalWrite(L, LOW);
  //   delay(300);
  // }
}
void clrGpsRxBuffer(void)
{
  memset(gpsRxBuffer, 0, gpsRxBufferLength); // 清空
  ii = 0;
}

double stringToNum(const string &str)
{
  istringstream iss(str);
  double num;
  iss >> num;
  return num;
}