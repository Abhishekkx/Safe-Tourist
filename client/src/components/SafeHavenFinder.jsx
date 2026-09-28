import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Compass, Phone, MapPin, Navigation, AlertCircle } from 'lucide-react';
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

function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function SafeHavenFinder({ userCoords, theme }) {
  const [safeHavens, setSafeHavens] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [radius, setRadius] = useState(10); // default 10 km
  const [currentCoords, setCurrentCoords] = useState(userCoords || null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Sync prop userCoords if available
  useEffect(() => {
    if (userCoords && (!currentCoords || (currentCoords.latitude === 28.6139 && currentCoords.longitude === 77.209))) {
      setCurrentCoords(userCoords);
    }
  }, [userCoords]);

  // Fallback to browser geolocation on load if not set
  useEffect(() => {
    if (!currentCoords && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => setCurrentCoords({ latitude: 28.6139, longitude: 77.209 })
      );
    }
  }, []);

  const lat = currentCoords ? currentCoords.latitude : 28.6139;
  const lng = currentCoords ? currentCoords.longitude : 77.209;

  const handleDetectLocation = () => {
    if ('geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocating(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/incidents/safe-havens?lat=${lat}&lng=${lng}&radius=${radius}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSafeHavens(data.data || []);
        }
      })
      .catch((err) => console.error('Failed to fetch safe havens:', err))
      .finally(() => setLoading(false));
  }, [lat, lng, radius]);

  const filteredHavens =
    filterType === 'ALL' ? safeHavens : safeHavens.filter((sh) => sh.type === filterType);

  // Sort by distance ascending
  const sortedHavens = [...filteredHavens].sort((a, b) => {
    const distA = a.distance ?? calculateDistanceKm(lat, lng, a.latitude, a.longitude);
    const distB = b.distance ?? calculateDistanceKm(lat, lng, b.latitude, b.longitude);
    return distA - distB;
  });

  return (
    <div className="panel-card p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              Verified Emergency Safe Havens
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Live GPS
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nearest police command posts, medical units & embassies relative to your location
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Radius Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-bold px-2 text-slate-500">Radius:</span>
            {[5, 10, 25, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                  radius === r
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          {/* Detect Location Button */}
          <button
            onClick={handleDetectLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all"
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Locating...' : 'GPS Refresh'}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Location status line */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
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
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-500" />
          <span>Location: {lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
        </div>
      </div>

      {/* Map View */}
      <div className={`h-64 sm:h-72 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative ${theme === 'dark' ? 'dark-tiles' : 'light-tiles'}`}>
        <MapContainer
          center={[lat, lng]}
          zoom={radius <= 5 ? 13 : radius <= 10 ? 12 : radius <= 25 ? 10 : 8}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <MapRecenter center={[lat, lng]} zoom={radius <= 5 ? 13 : radius <= 10 ? 12 : radius <= 25 ? 10 : 8} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location Marker & Search Radius Circle */}
          <Circle
            center={[lat, lng]}
            radius={radius * 1000}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.08, weight: 1.5, dashArray: '4, 4' }}
          />

          <Marker position={[lat, lng]} icon={icons.USER}>
            <Popup>
              <div className="p-1 text-slate-900">
                <strong className="block text-xs font-bold">Your GPS Location</strong>
                <span className="text-[10px] text-slate-600">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                <span className="block text-[9px] text-emerald-600 font-semibold mt-1">Search radius: {radius} km</span>
              </div>
            </Popup>
          </Marker>

          {sortedHavens.map((sh) => (
            <Marker key={sh.id || sh._id} position={[sh.latitude, sh.longitude]} icon={icons[sh.type] || icons.SAFE_ZONE}>
              <Popup>
                <div className="p-1 text-slate-900 space-y-1">
                  <span className="text-[9px] font-extrabold uppercase text-blue-600 block">{sh.type}</span>
                  <strong className="block text-xs">{sh.name}</strong>
                  <p className="text-[10px] text-slate-600">{sh.address}</p>
                  <div className="text-[10px] font-bold text-amber-600">
                    Distance: {sh.distance !== undefined ? sh.distance : calculateDistanceKm(lat, lng, sh.latitude, sh.longitude)} km
                  </div>
                  <a href={`tel:${sh.phone}`} className="inline-block mt-1 text-[11px] font-bold text-red-600 hover:underline">
                    Hotline: {sh.phone}
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Loading state or Empty results notice */}
      {loading ? (
        <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
          Searching nearby safe havens within {radius} km...
        </div>
      ) : sortedHavens.length === 0 ? (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>No emergency services found within {radius} km of your location. Try expanding the radius.</span>
          </div>
          <button
            onClick={() => setRadius(radius === 5 ? 10 : radius === 10 ? 25 : 50)}
            className="px-2.5 py-1 rounded bg-amber-500 text-white font-bold text-[11px] shrink-0"
          >
            Expand Radius
          </button>
        </div>
      ) : (
        /* Grid of Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
          {sortedHavens.map((sh) => {
            const dist = sh.distance !== undefined ? sh.distance : calculateDistanceKm(lat, lng, sh.latitude, sh.longitude);
            const estTime = Math.max(1, Math.round(dist * 2.5));
            return (
              <div
                key={sh.id || sh._id}
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
                  <span className="text-[10px] text-slate-500 block">Est. {estTime} min</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

