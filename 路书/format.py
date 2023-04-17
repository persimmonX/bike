
import re

path = []

def matchLonlat(str):
    if re.match('<trkpt',str.strip()) != None:
        lonlat =  re.findall('lat="(.*)" lon="(.*)"',str)
        lonlat = [float(lonlat[0][1]),float(lonlat[0][0])]
        return lonlat

with open("./lushu-3567657.gpx",'r',encoding='utf-8') as f:
    line = f.readline()
    while line:
        data = matchLonlat(line)
        if data != None:
            path.append(data)
        line = f.readline()
    f.close()

with open("./lushu-3562507.json","w+") as f:
    f.write(str(path))
    f.close()
