

#include <TFT_eSPI.h>
#include <SPI.h>
#include "FS.h"
#include "SD.h"
#include "computePath.h"
#include <PNGdec.h>

#define TFT_W 128
#define TFT_H 128
#define MAX_IMAGE_WIDTH 256 // Adjust for your images

#define TFT_MOSI 13
#define TFT_SCLK 14
#define TFT_CS 15
#define TFT_DC 2
int16_t xpos = 0;
int16_t ypos = 0;

PNG png;

TFT_eSPI myGLCD = TFT_eSPI(TFT_W, TFT_H);

// 函数头
File pngfile;
void pngDraw(PNGDRAW *pDraw);
void *pngOpen(const char *filename, int32_t *size);
void pngClose(void *handle);
int32_t pngRead(PNGFILE *page, uint8_t *buffer, int32_t length);
int32_t pngSeek(PNGFILE *page, int32_t position);


void setup()
{
  Serial.begin(115200);
  Serial.println("初始化屏幕....");
  myGLCD.init();
  myGLCD.fillScreen(TFT_WHITE);
  Serial.println("初始化储存卡....");
  SPIClass spi = SPIClass(VSPI);
  if (!SD.begin(5, spi))
  {
    Serial.println("开启储存卡失败!!!");
  }
  Serial.println("显示开机界面....");
  myGLCD.setRotation(3);
  myGLCD.drawCentreString("Hello", TFT_W / 2, TFT_H / 2, 2);

  Serial.println("计算经纬度对应行列....");
  computePath c = computeRowColumn(122.0, 30.0, 10);
  for (int x = 0; x < MAXROW; x++)
  {
    for (int y = 0; y < MAXCLOUMN; y++)
    {
      string str = c.paths[x][y];
      if (!str.empty())
      {
        show(str, c.offsetX + y * TitlePix, c.offsetY + x * TitlePix);
      }
    }
  }
}

void show(string path, int offsetX, int offsetY)
{
  Serial.printf("加载图片：");
  Serial.print(path.c_str());
  Serial.print(" offsetX：");
  Serial.print(offsetX);
  Serial.print(" offsetY：");
  Serial.print(offsetY);
  string strname = path + ".png";
  xpos = offsetX;
  ypos = offsetY;
  Serial.println("初始化储存卡....");
  SPIClass spi = SPIClass(VSPI);
  if (!SD.begin(5, spi))
  {
    Serial.println("开启储存卡失败!!!");
  }
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
    }
  }
}
void loop()
{
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
  Serial.printf("Attempting to open %s\n", filename);
  pngfile = SD.open(filename, "r");
  *size = pngfile.size();
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