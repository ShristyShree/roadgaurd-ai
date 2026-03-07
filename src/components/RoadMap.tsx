import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RoadReport } from '../types';
import { format } from 'date-fns';
import { AlertTriangle, Info, Clock, MapPin } from 'lucide-react';

// Fix for default marker icons in Leaflet
import 'leaflet/dist/leaflet.css';
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  reports: RoadReport[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (report: RoadReport) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return '#ef4444'; // red-500
    case 'medium': return '#f97316'; // orange-500
    case 'low': return '#22c55e'; // green-500
    default: return '#64748b'; // slate-500
  }
};

const createCustomIcon = (severity: string) => {
  const color = getSeverityColor(severity);
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const RoadMap: React.FC<MapProps> = ({ reports, center = [20.5937, 78.9629], zoom = 5 }) => {
  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-zinc-200 shadow-sm relative z-0">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]}
            icon={createCustomIcon(report.severity)}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getSeverityColor(report.severity) }}
                  />
                  <span className="font-bold uppercase text-xs tracking-wider text-zinc-500">
                    {report.hazard_type}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mb-1 capitalize">
                  {report.severity} Severity Hazard
                </h3>
                
                <p className="text-sm text-zinc-600 mb-3 line-clamp-2">
                  {report.description || "No description provided."}
                </p>
                
                <div className="space-y-2 text-xs text-zinc-500 border-t border-zinc-100 pt-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    <span>{report.ai_analysis}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(report.timestamp), 'PPp')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapUpdater center={center} />
      </MapContainer>
    </div>
  );
};
