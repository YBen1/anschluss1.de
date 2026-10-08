"""Rebuild regional assets from the same OSM snapshot as the national dataset.
Usage: python scripts/split-states.py /path/to/germany.osm.pbf /path/to/cache
Requires osmium and shapely (see the original extraction environment).
"""
import sys, json, pathlib, hashlib
import osmium
from shapely.geometry import shape, Point, LineString, mapping
from shapely.strtree import STRtree
ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
cache = pathlib.Path(sys.argv[2]); cache.mkdir(parents=True, exist_ok=True)
filtered = cache / 'states.osm.pbf'
if not filtered.exists():
    print('Extracting state relations and referenced geometry', flush=True)
    with osmium.BackReferenceWriter(str(filtered), sys.argv[1], overwrite=True) as writer:
        for obj in osmium.FileProcessor(sys.argv[1], entities=osmium.osm.RELATION):
            if obj.tags.get('admin_level') == '4' and obj.tags.get('ISO3166-2', '').startswith('DE-'):
                writer.add(obj)
features = []; geometries = []
factory = osmium.geom.GeoJSONFactory()
for obj in osmium.FileProcessor(str(filtered)).with_areas():
    if obj.is_area() and obj.tags.get('admin_level') == '4' and obj.tags.get('ISO3166-2', '').startswith('DE-'):
        geom = shape(json.loads(factory.create_multipolygon(obj)))
        geometries.append(geom)
        features.append({'type':'Feature', 'properties':{'id':obj.tags['ISO3166-2'], 'name':obj.tags['name'], 'source':f'relation/{obj.orig_id()}'}, 'geometry':mapping(geom.simplify(.003, preserve_topology=True))})
assert len(features) == 16, f'Expected all 16 states, found {len(features)}'
tree = STRtree(geometries)
buckets = [{'stations':[], 'lines':[]} for _ in features]
operators = set(); assigned = {'stations':set(), 'lines':set()}
for kind in ('stations', 'lines'):
    records = json.loads((DATA / f'{kind}.json').read_text())
    for obj in records:
        geom = Point(obj['lon'], obj['lat']) if kind == 'stations' else LineString([(p[1],p[0]) for p in obj['path']])
        indices = list(tree.query(geom, predicate='intersects'))
        # The national boundary and state relations can differ at coastlines.
        # Preserve every source object by assigning unmatched objects to the nearest state.
        if not indices: indices = [tree.nearest(geom)]
        for index in indices: buckets[index][kind].append(obj)
        assigned[kind].add(obj['id'])
        operators.add(obj['tags'].get('operator') or 'Unbekannt')
    assert len(assigned[kind]) == len(records)
output = DATA / 'states'; output.mkdir(exist_ok=True)
def write(path, value):
    content = json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()
    path.write_bytes(content)
    return {'url':str(path.relative_to(ROOT)), 'bytes':len(content), 'sha256':hashlib.sha256(content).hexdigest()}
for feature, bucket in zip(features, buckets):
    p = feature['properties']; p['files'] = {}
    coords = [(s['lat'],s['lon']) for s in bucket['stations']]
    coords += [(l['bounds'][0],l['bounds'][1]) for l in bucket['lines']]
    coords += [(l['bounds'][2],l['bounds'][3]) for l in bucket['lines']]
    p['bounds'] = [min(x[0] for x in coords), min(x[1] for x in coords), max(x[0] for x in coords), max(x[1] for x in coords)]
    for kind in ('stations','lines'):
        descriptor = write(output / f"{p['id']}-{kind}.json", bucket[kind])
        descriptor['count'] = len(bucket[kind]); p['files'][kind] = descriptor
    print(p['name'],len(bucket['stations']),len(bucket['lines']),flush=True)
write(DATA / 'states.json', {'type':'FeatureCollection','features':sorted(features,key=lambda f:f['properties']['name']), 'operators':sorted(operators), 'snapshot':json.loads((DATA/'manifest.json').read_text())['snapshot']})
