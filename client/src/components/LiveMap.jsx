import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const createPulsingMarker = (status, isSilent, type) => {
  let color = '#dc2626'; // SOS Red
  if (status === 'DISPATCHED') color = '#d97706'; // Amber
  if (status === 'RESOLVED') color = '#059669'; // Emerald

  return L.divIcon({
    className: 'custom-live-marker',
    html: `
      <div style="position: relative; width: 26px; height: 26px;">
        <div style="position: absolute; inset: -6px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 26px; height: 26px; border-radius: 50%; background: ${color}; border: 2.5px solid white; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 10px;">
          ${isSilent ? 'S' : '!'}
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

// Map auto-fitter component to ensure all active report pins are visible
function MapAutoBounds({ incidents, selectedIncident }) {
  const map = useMap();

  useEffect(() => {
    if (selectedIncident && selectedIncident.location && selectedIncident.location.coordinates) {
      const lat = selectedIncident.location.coordinates[1];
      const lng = selectedIncident.location.coordinates[0];
      map.flyTo([lat, lng], 14, { duration: 1.2 });
      return;
    }

    const validCoords = incidents
      .filter((i) => i.location && i.location.coordinates && i.location.coordinates.length === 2)
      .map((i) => [i.location.coordinates[1], i.location.coordinates[0]]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [incidents, selectedIncident, map]);

  return null;
}

export default function LiveMap({ incidents = [], selectedIncident, onSelectIncident, theme }) {
  const centerLat =
    selectedIncident && selectedIncident.location && selectedIncident.location.coordinates
      ? selectedIncident.location.coordinates[1]
      : incidents.length > 0 && incidents[0].location && incidents[0].location.coordinates
      ? incidents[0].location.coordinates[0]
      : 28.6139;

  const centerLng =
    selectedIncident && selectedIncident.location && selectedIncident.location.coordinates
      ? selectedIncident.location.coordinates[0]
      : incidents.length > 0 && incidents[0].location && incidents[0].location.coordinates
      ? incidents[0].location.coordinates[0]
      : 77.209;

  const activeReports = incidents.filter(
    (inc) => inc.location && inc.location.coordinates && inc.location.coordinates.length === 2
  );

  return (
    <div
      className={`h-[380px] lg:h-[460px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-sm ${
        theme === 'dark' ? 'dark-tiles' : 'light-tiles'
      }`}
    >
      {/* Stream Status Overlay */}
      <div className="absolute top-3 left-3 z-[400] panel-card px-2.5 py-1 rounded-lg flex items-center gap-2 text-xs border border-slate-200 dark:border-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span className="font-extrabold tracking-wide uppercase text-[9px] text-slate-700 dark:text-slate-200">
          Command Center Live Map
        </span>
        <span className="text-[9px] font-mono text-red-600 dark:text-red-400 font-bold">
          ({activeReports.length} Active Report Pins)
        </span>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto Bounds Fitter */}
        <MapAutoBounds incidents={incidents} selectedIncident={selectedIncident} />

        {/* Render Map Markers for ALL Active Reports */}
        {activeReports.map((inc, index) => {
          const lat = inc.location.coordinates[1];
          const lng = inc.location.coordinates[0];
          const idKey = inc._id || inc.incidentId || `pin-${index}`;

          return (
            <Marker
              key={idKey}
              position={[lat, lng]}
              icon={createPulsingMarker(inc.status, inc.isSilent, inc.type)}
              eventHandlers={{
                click: () => onSelectIncident(inc),
              }}
            >
              <Popup>
                <div className="p-1.5 text-slate-900 max-w-xs space-y-1.5">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-mono font-bold text-xs text-red-600">{inc.incidentId}</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 uppercase">
                      {inc.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs">{inc.touristName}</h4>
                    <p className="text-[10px] text-slate-600">{inc.address}</p>
                  </div>

                  <p className="text-[11px] italic bg-slate-100 p-1.5 rounded border text-slate-800">
                    "{inc.description}"
                  </p>

                  <div className="text-[10px] text-slate-500 flex justify-between pt-0.5">
                    <span>Contact: {inc.contactNumber}</span>
                    <span>{new Date(inc.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
