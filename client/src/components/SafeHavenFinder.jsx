import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Compass, Phone } from 'lucide-react';
import { calculateDistanceKm } from '../utils/geocoding';

const createCustomIcon = (colorHex) =>
  L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: ${colorHex}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px ${colorHex};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const icons = {
  POLICE: createCustomIcon('#3b82f6'),
  HOSPITAL: createCustomIcon('#ef4444'),
  EMBASSY: createCustomIcon('#f59e0b'),
  SAFE_ZONE: createCustomIcon('#10b981'),
  USER: createCustomIcon('#ec4899'),
};

export default function SafeHavenFinder({ userCoords, theme }) {
  const [safeHavens, setSafeHavens] = useState([]);
  const [filterType, setFilterType] = useState('ALL');

  const lat = userCoords ? userCoords.latitude : 28.6139;
  const lng = userCoords ? userCoords.longitude : 77.209;

  useEffect(() => {
    fetch(`/api/incidents/safe-havens?lat=${lat}&lng=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSafeHavens(data.data);
        }
      })
      .catch(() => {});
  }, [lat, lng]);

  const filteredHavens =
    filterType === 'ALL' ? safeHavens : safeHavens.filter((sh) => sh.type === filterType);

  return (
    <div className="panel-card p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-500" />
          <div>
            <h3 className="font-extrabold text-base">Verified Emergency Safe Havens</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Nearest police command posts, medical units & embassies</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 text-xs">
          {['ALL', 'POLICE', 'HOSPITAL', 'EMBASSY', 'SAFE_ZONE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-md font-bold transition-all text-[11px] ${
                filterType === t
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Map View */}
      <div className={`h-64 sm:h-72 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative ${theme === 'dark' ? 'dark-tiles' : 'light-tiles'}`}>
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[lat, lng]} icon={icons.USER}>
            <Popup>
              <div className="p-1 text-slate-900">
                <strong className="block text-xs font-bold">Your Current Position</strong>
                <span className="text-[10px] text-slate-600">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
              </div>
            </Popup>
          </Marker>

          {filteredHavens.map((sh) => (
            <Marker key={sh.id} position={[sh.latitude, sh.longitude]} icon={icons[sh.type] || icons.SAFE_ZONE}>
              <Popup>
                <div className="p-1 text-slate-900 space-y-1">
                  <span className="text-[9px] font-extrabold uppercase text-blue-600 block">{sh.type}</span>
                  <strong className="block text-xs">{sh.name}</strong>
                  <p className="text-[10px] text-slate-600">{sh.address}</p>
                  <a href={`tel:${sh.phone}`} className="inline-block mt-1 text-[11px] font-bold text-red-600 hover:underline">
                    Hotline: {sh.phone}
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
        {filteredHavens.map((sh) => {
          const dist = calculateDistanceKm(lat, lng, sh.latitude, sh.longitude);
          return (
            <div
              key={sh.id}
              className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-1">
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-400 uppercase">
                  {sh.type}
                </span>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">{sh.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{sh.address}</p>
                <a href={`tel:${sh.phone}`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1">
                  <Phone className="w-3 h-3" />
                  {sh.phone}
                </a>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400 block">{dist} km</span>
                <span className="text-[10px] text-slate-500 block">Est. 5 min</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
