"""Attach traceable equipment and reviewed operator evidence; preserve original OSM tags.
Usage: python enrich-stations.py GERMANY_PBF POWER_PBF [TRANSFORMER_CACHE]
Requires osmium and shapely. Both PBFs must be from the manifest snapshot.
"""
import sys,json,pathlib,hashlib,osmium
from shapely.geometry import Polygon,Point
from shapely.strtree import STRtree
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(p): return json.loads(p.read_text())
def write(p,d): p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
data=ROOT/'data'; manifest=read(data/'manifest.json')
header=osmium.io.Reader(sys.argv[1]).header()
assert header.get('osmosis_replication_timestamp')==manifest['snapshot'], 'PBF snapshot mismatch'
keys={'power','voltage','voltage:primary','voltage:secondary','voltage:tertiary','rating','rating:power','frequency','phases','transformer','name','ref'}
if len(sys.argv)>3:
 transformers=read(pathlib.Path(sys.argv[3]))
else:
 transformers=[]
 for o in osmium.FileProcessor(sys.argv[1],entities=osmium.osm.NODE).with_filter(osmium.filter.TagFilter(('power','transformer'))):
  transformers.append({'id':f'node/{o.id}','lat':o.location.lat,'lon':o.location.lon,'tags':dict(o.tags),'updated':o.timestamp.isoformat()})
stations=read(data/'stations.json'); by_id={s['id']:s for s in stations}
polygons=[];ids=[]
for o in osmium.FileProcessor(sys.argv[2]).with_locations().with_filter(osmium.filter.EntityFilter(osmium.osm.WAY)):
 sid=f'way/{o.id}'
 if sid not in by_id or not o.is_closed(): continue
 if any(not n.location.valid() for n in o.nodes): continue
 coords=[(n.lon,n.lat) for n in o.nodes]
 if len(coords)<4: continue
 p=Polygon(coords)
 if p.is_valid and not p.is_empty: polygons.append(p);ids.append(sid)
tree=STRtree(polygons)
for s in stations: s.pop('equipment',None);s.pop('operatorEvidence',None)
ambiguous=0
for t in transformers:
 point=Point(t['lon'],t['lat']);matches=[i for i in tree.query(point) if polygons[i].covers(point)]
 if len(matches)!=1:
  ambiguous+=len(matches)>1
  continue
 tags={k:v for k,v in t['tags'].items() if k in keys}
 if not any(k in tags for k in ['voltage','voltage:primary','voltage:secondary','rating','rating:power']): continue
 s=by_id[ids[matches[0]]]
 s.setdefault('equipment',[]).append({**t,'tags':tags,'association':'within-osm-station-polygon'})
review=read(data/'berlin-operator-evidence.json')
for e in review['records']:
 for sid in e['stationIds']:
  assert sid in by_id,sid
  by_id[sid].setdefault('operatorEvidence',[]).append({k:v for k,v in e.items() if k!='stationIds'})
write(data/'stations.json',stations)
index=read(data/'states.json')
for f in index['features']:
 desc=f['properties']['files']['stations'];path=ROOT/desc['url']
 records=[by_id[s['id']] for s in read(path)];write(path,records)
 desc.update(bytes=path.stat().st_size,sha256=digest(path))
write(data/'states.json',index)
berlin=read(data/'states/DE-BE-stations.json')
manifest['sha256']['stations']=digest(data/'stations.json')
manifest['enrichment']={'reviewedAt':review['reviewedAt'],'equipmentSnapshot':manifest['snapshot'],'equipmentSource':manifest['source'],'equipmentLicense':'ODbL-1.0','method':'Uniquely contained transformer nodes in valid closed OSM station ways; no nearest-neighbour assignment, no inferred station voltage or free capacity. Relations and unlocated equipment not covered.','stationsWithEquipment':sum(bool(s.get('equipment')) for s in stations),'transformerCount':sum(len(s.get('equipment',[])) for s in stations),'ambiguousTransformersSkipped':ambiguous,'berlinStationsWithEquipment':sum(bool(s.get('equipment')) for s in berlin),'berlinStationsWithOperatorEvidence':sum(bool(s.get('operatorEvidence')) for s in berlin),'operatorEvidence':'data/berlin-operator-evidence.json'}
write(data/'manifest.json',manifest)
print(json.dumps(manifest['enrichment'],indent=2))
