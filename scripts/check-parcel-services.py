"""Explicit live smoke test: one small map image per configured public WMS.
Requires Pillow. Saves returned maps and evidence outside the published app.
"""
import json,pathlib,urllib.request,urllib.parse,math,concurrent.futures,io,sys
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1];out=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/anschluss-parcel-tests');out.mkdir(parents=True,exist_ok=True)
providers=json.loads((root/'data/parcel-services.json').read_text())['providers']
if len(sys.argv)>2:providers=[p for p in providers if p['id'] in sys.argv[2:]]
def check(p):
 try:
  lat,lon=p['sample'];x=6378137*math.radians(lon);y=6378137*math.log(math.tan(math.pi/4+math.radians(lat)/2));delta=300
  params={'SERVICE':'WMS','REQUEST':'GetMap','VERSION':p['version'],'LAYERS':p['layers'],'STYLES':p['styles'],'FORMAT':'image/png','TRANSPARENT':'TRUE','WIDTH':512,'HEIGHT':512,'BBOX':f'{x-delta},{y-delta},{x+delta},{y+delta}',('CRS' if p['version']=='1.3.0' else 'SRS'):'EPSG:3857'}
  url=p['url']+('&' if '?' in p['url'] else '?')+urllib.parse.urlencode(params)
  with urllib.request.urlopen(url,timeout=40) as response:raw=response.read();mime=response.headers.get('Content-Type')
  (out/(p['id']+'.png')).write_bytes(raw)
  image=Image.open(io.BytesIO(raw)).convert('RGBA');image.load()
  visible=sum(1 for r,g,b,a in image.getdata() if a>0 and min(r,g,b)<235)
  assert image.size==(512,512) and visible>100, f'Empty map ({visible} pixels)'
  return {'id':p['id'],'passed':True,'bytes':len(raw),'visiblePixels':visible,'mime':mime,'url':url}
 except Exception as e:return {'id':p['id'],'passed':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 results=list(pool.map(check,providers))
(out/'results.json').write_text(json.dumps(results,indent=2))
for r in results:print(json.dumps({k:v for k,v in r.items() if k!='url'}),flush=True)
sys.exit(0 if all(r['passed'] for r in results) else 1)
