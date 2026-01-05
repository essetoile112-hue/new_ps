import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Sensor = { id: string; name: string; lat: number; lon: number; aqi: number };

export const LeafletMap = ({ sensors, height = 300, heatmapMode = false }: { sensors: Sensor[]; height?: number; heatmapMode?: boolean }) => {
  const center = sensors.length ? [sensors[0].lat, sensors[0].lon] : [36.8065, 10.1815];
  return (
    <div className="rounded-lg overflow-hidden glass-panel" style={{ height }}>
      <MapContainer center={center as any} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sensors.map(s => {
          const color = s.aqi > 100 ? '#e11d48' : s.aqi > 50 ? '#f59e0b' : '#10b981';
          if (heatmapMode) {
            return <CircleMarker key={s.id} center={[s.lat, s.lon] as any} radius={18} pathOptions={{ color, fillColor: color, fillOpacity: 0.4 }} />;
          }
          return (
            <Marker key={s.id} position={[s.lat, s.lon] as any}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{s.name}</div>
                  <div>AQI: {s.aqi}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default {};
