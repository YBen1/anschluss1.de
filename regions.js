// Regional assets retain original OSM IDs; border-crossing objects are deduplicated.
export const intersects = (a,b) => a[0]<=b[2] && a[2]>=b[0] && a[1]<=b[3] && a[3]>=b[1];
export function searchBounds(point, km=50) {
  const latitude = km / 6371 * 180 / Math.PI;
  const longitude = Math.asin(Math.sin(km / 6371) / Math.cos(point.lat * Math.PI / 180)) * 180 / Math.PI;
  return [point.lat-latitude,point.lon-longitude,point.lat+latitude,point.lon+longitude];
}
export class RegionalData {
  constructor(index, fetcher=(...args)=>fetch(...args), limit=12) {
    this.index=index; this.fetcher=fetcher; this.limit=limit;
    this.cache=new Map(); this.pending=new Map();
  }
  regions(bounds) { return this.index.features.filter(f=>intersects(f.properties.bounds,bounds)); }
  async load(feature, kind) {
    const file=feature.properties.files[kind], key=file.url;
    if(this.cache.has(key)) {
      const data=this.cache.get(key); this.cache.delete(key); this.cache.set(key,data); return data;
    }
    if(this.pending.has(key)) return this.pending.get(key);
    const task=(async()=>{
      const response=await this.fetcher(`${key}?v=${file.sha256.slice(0,16)}`);
      if(!response.ok) throw Error(`Netzdaten für ${feature.properties.name} konnten nicht geladen werden.`);
      const data=await response.json();
      if(!Array.isArray(data)||data.length!==file.count) throw Error(`Unvollständige Netzdaten für ${feature.properties.name}.`);
      this.cache.set(key,data);
      while(this.cache.size>this.limit) this.cache.delete(this.cache.keys().next().value);
      return data;
    })();
    this.pending.set(key,task);
    try { return await task; } finally { this.pending.delete(key); }
  }
  async collect(features, kinds=['stations','lines']) {
    const unique=[...new Map(features.map(f=>[f.properties.id,f])).values()];
    const result={stations:[],lines:[]};
    // Limit concurrent parsing/network activity when crossing several state borders.
    for(const kind of kinds) {
      const records=new Map();
      for(let i=0;i<unique.length;i+=2) {
        const chunks=await Promise.all(unique.slice(i,i+2).map(f=>this.load(f,kind)));
        for(const chunk of chunks) for(const o of chunk) records.set(o.id,o);
      }
      result[kind]=[...records.values()];
    }
    return result;
  }
  forSites(sites,kinds=['stations']) {
    return this.collect(sites.flatMap(s=>this.regions(searchBounds(s))),kinds);
  }
}
