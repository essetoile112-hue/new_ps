import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, LayersControl, ZoomControl, Popup, Tooltip, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Sensor = { id: string; name?: string; lat: number; lon: number; aqi?: number; value?: number };

const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';

function aqiColor(v: number) {
  if (v > 200) return '#7f1d1d';
  if (v > 150) return '#dc2626';
  if (v > 100) return '#f97316';
  if (v > 50) return '#f59e0b';
  return '#10b981';
}

export default function LiveNetworkMap({ sensors = [], height = '100%' }: { sensors?: Sensor[]; height?: string | number }) {
  const [tunisiaGeo, setTunisiaGeo] = useState<any | null>(null);
  const [worldHotspots, setWorldHotspots] = useState<any | null>(null);

  useEffect(() => {
    // try to load optional geojson files placed in public/assets/data/
    fetch('/assets/data/industrial_zones_tunisia.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) setTunisiaGeo(j); })
      .catch(() => {});

    fetch('/assets/data/world_industrial_hotspots.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) setWorldHotspots(j); })
      .catch(() => {});
  }, []);

  const center: [number, number] = sensors.length ? [sensors[0].lat, sensors[0].lon] : [34.0, 9.0];

  const satelliteUrl = MAPBOX_TOKEN
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
    : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  const satelliteAttrib = MAPBOX_TOKEN
    ? '© Mapbox' : 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics';

  return (
    <div className="rounded-lg overflow-hidden glass-panel" style={{ height }}>
      <MapContainer center={center as any} zoom={8} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <ZoomControl position="topright" />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite (High-res)">
            <TileLayer attribution={satelliteAttrib} url={satelliteUrl} maxZoom={19} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Street (OSM)">
            <TileLayer attribution='© OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="Industrial Zones — Tunisia" checked>
            <>{tunisiaGeo ? <GeoJSON data={tunisiaGeo} style={() => ({ color: '#7c3aed', weight: 1.5, fillOpacity: 0.12 })} /> : null}</>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Global Industrial Hotspots">
            <>{worldHotspots ? <GeoJSON data={worldHotspots} style={() => ({ color: '#ef4444', weight: 1, fillOpacity: 0.08 })} /> : null}</>
          </LayersControl.Overlay>

        </LayersControl>

        {/* Sensors / heat markers */}
        {sensors.map((s) => (
          <CircleMarker
            key={`sensor-${s.id}`}
            center={[s.lat, s.lon] as any}
            radius={Math.max(5, Math.min(18, (s.value || s.aqi || 0) / 15 + 5))}
            pathOptions={{ color: aqiColor(s.value ?? s.aqi ?? 0), fillColor: aqiColor(s.value ?? s.aqi ?? 0), fillOpacity: 0.8, weight: 1 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{s.name || s.id}</div>
                <div>Value: <strong>{(s.value ?? s.aqi ?? 0).toFixed ? (s.value ?? s.aqi ?? 0).toFixed(1) : (s.value ?? s.aqi ?? 0)}</strong></div>
                <div>Lat: {s.lat.toFixed(4)}, Lon: {s.lon.toFixed(4)}</div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95} permanent={false}>{s.name || s.id} — {(s.value ?? s.aqi ?? 0).toFixed ? (s.value ?? s.aqi ?? 0).toFixed(1) : (s.value ?? s.aqi ?? 0)}</Tooltip>
          </CircleMarker>
        ))}

        {/* Small colored circles for GeoJSON industrial features (Tunisia + World) */}
        {tunisiaGeo && Array.isArray(tunisiaGeo.features) && tunisiaGeo.features.map((f: any, i: number) => {
          try {
            const geom = f.geometry;
            if (!geom) return null;
            const coords = geom.type === 'Point' ? geom.coordinates : (geom.type === 'MultiPoint' && geom.coordinates[0]) || null;
            if (!coords) return null;
            const lon = coords[0];
            const lat = coords[1];
            const level = (f.properties && f.properties.level) || 'low';
            const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981';
            const radius = level === 'high' ? 10 : level === 'medium' ? 7 : 5;
            return (
              <CircleMarker key={`tun-${i}`} center={[lat, lon] as any} radius={radius} pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1 }}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{f.properties?.name || 'Zone industrielle'}</div>
                    <div>Niveau: {level}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          } catch (e) {
            return null;
          }
        })}

        {worldHotspots && Array.isArray(worldHotspots.features) && worldHotspots.features.map((f: any, i: number) => {
          try {
            const geom = f.geometry;
            if (!geom) return null;
            const coords = geom.type === 'Point' ? geom.coordinates : (geom.type === 'MultiPoint' && geom.coordinates[0]) || null;
            if (!coords) return null;
            const lon = coords[0];
            const lat = coords[1];
            const level = (f.properties && f.properties.level) || 'high';
            const color = level === 'high' ? '#7f1d1d' : level === 'medium' ? '#dc2626' : '#f97316';
            const radius = level === 'high' ? 10 : level === 'medium' ? 7 : 5;
            return (
              <CircleMarker key={`world-${i}`} center={[lat, lon] as any} radius={radius} pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1 }}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{f.properties?.name || 'Hotspot'}</div>
                    <div>Niveau: {level}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          } catch (e) {
            return null;
          }
        })}
      </MapContainer>
    </div>
  );
}
