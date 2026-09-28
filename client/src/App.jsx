import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SOSButton from './components/SOSButton';
import EmergencySidebar from './components/EmergencySidebar';
import IncidentReportModal from './components/IncidentReportModal';
import SafeHavenFinder from './components/SafeHavenFinder';
import LiveMap from './components/LiveMap';
import IncidentQueue from './components/IncidentQueue';
import BroadcastModal from './components/BroadcastModal';
import OfflineNotice from './components/OfflineNotice';
import { siren } from './components/AudioSiren';
import { socket } from './utils/socket';
import {
  AlertTriangle,
  Radio,
  ShieldCheck,
  FilePlus,
  Bell,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Layers,
  FileAudio
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [currentRole, setCurrentRole] = useState('tourist');
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Admin Auth State
  const [adminToken, setAdminToken] = useState(localStorage.getItem('STSP_ADMIN_TOKEN') || null);

  // Broadcast Alert Notification
  const [activeBroadcastAlert, setActiveBroadcastAlert] = useState(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const deduplicate = (list) => {
    const map = new Map();
    list.forEach((item) => {
      const key = item._id || item.incidentId;
      if (key) map.set(key, item);
    });
    return Array.from(map.values());
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents');
      const data = await res.json();
      if (data.success) {
        setIncidents(deduplicate(data.data));
        if (data.data.length > 0 && !selectedIncident) {
          setSelectedIncident(data.data[0]);
        }
      }
    } catch (err) {
      console.warn('Backend server offline, relying on socket stream');
    }
  };

  useEffect(() => {
    fetchIncidents();

    socket.on('NEW_EMERGENCY_ALERT', (newIncident) => {
      setIncidents((prev) => {
        const key = newIncident._id || newIncident.incidentId;
        const filtered = prev.filter((i) => (i._id || i.incidentId) !== key);
        return [newIncident, ...filtered];
      });
      setSelectedIncident(newIncident);
      if (newIncident.urgency === 'HIGH' || newIncident.type === 'SOS_CRITICAL') {
        siren.play();
      }
    });

    socket.on('INCIDENT_STATUS_UPDATED', (updatedIncident) => {
      setIncidents((prev) =>
        prev.map((item) =>
          (item._id && item._id === updatedIncident._id) || item.incidentId === updatedIncident.incidentId
            ? updatedIncident
            : item
        )
      );
      if (
        selectedIncident &&
        (selectedIncident._id === updatedIncident._id || selectedIncident.incidentId === updatedIncident.incidentId)
      ) {
        setSelectedIncident(updatedIncident);
      }
    });

    socket.on('TOURIST_LOCATION_STREAM', (locData) => {
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.incidentId === locData.incidentId) {
            return {
              ...inc,
              location: {
                ...inc.location,
                coordinates: [locData.longitude, locData.latitude],
              },
            };
          }
          return inc;
        })
      );
    });

    socket.on('SAFETY_ALERT_BROADCAST', (alertData) => {
      setActiveBroadcastAlert(alertData);
      siren.play();
    });

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => setUserCoords({ latitude: 28.6139, longitude: 77.209 })
      );
    }

    return () => {
      socket.off('NEW_EMERGENCY_ALERT');
      socket.off('INCIDENT_STATUS_UPDATED');
      socket.off('TOURIST_LOCATION_STREAM');
      socket.off('SAFETY_ALERT_BROADCAST');
    };
  }, []);

  const handleUpdateStatus = async (id, status, note) => {
    try {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, assignedResponder: 'Officer Dispatch Unit' }),
      });
      const data = await res.json();
      if (data.success) {
        setIncidents((prev) =>
          prev.map((item) => (item._id === id || item.incidentId === id ? data.data : item))
        );
        if (selectedIncident && (selectedIncident._id === id || selectedIncident.incidentId === id)) {
          setSelectedIncident(data.data);
        }
      }
    } catch (err) {
      setIncidents((prev) =>
        prev.map((item) => (item._id === id || item.incidentId === id ? { ...item, status } : item))
      );
    }
  };

  const handleAdminLoginSubmit = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminToken(data.token);
        localStorage.setItem('STSP_ADMIN_TOKEN', data.token);
        setCurrentRole('admin');
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (err) {
      if (username === 'admin' && password === 'admin123') {
        setAdminToken('mock-jwt-token');
        localStorage.setItem('STSP_ADMIN_TOKEN', 'mock-jwt-token');
        setCurrentRole('admin');
      } else {
        alert('Invalid credentials. Use admin / admin123');
      }
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('STSP_ADMIN_TOKEN');
    setCurrentRole('tourist');
  };

  const totalCount = incidents.length;
  const criticalCount = incidents.filter((i) => i.type === 'SOS_CRITICAL' && i.status !== 'RESOLVED').length;
  const dispatchedCount = incidents.filter((i) => i.status === 'DISPATCHED').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;
  const incomingPending = incidents.filter((i) => i.status === 'PENDING').slice(0, 3);

  return (
    <div className={`min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 ${theme === 'dark' ? 'dark' : ''}`}>
      
      <OfflineNotice onAutoSynced={fetchIncidents} />

      <Navbar
        currentRole={currentRole}
        setRole={setCurrentRole}
        adminToken={adminToken}
        onLoginSubmit={handleAdminLoginSubmit}
        onLogoutClick={handleAdminLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {activeBroadcastAlert && (
        <div className="bg-red-600 text-white p-3 shadow-md flex items-center justify-between border-b border-red-500">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 animate-pulse" />
            <div>
              <strong className="block text-xs uppercase font-extrabold tracking-wider">
                Emergency Alert Broadcast: {activeBroadcastAlert.title}
              </strong>
              <p className="text-xs text-red-100">{activeBroadcastAlert.message}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveBroadcastAlert(null)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {currentRole === 'tourist' ? (
          /* ========================================================================= */
          /* TOURIST PORTAL VIEW WITH LEFT EMERGENCY SIDEBAR                           */
          /* ========================================================================= */
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            
            {/* Leftmost Vertical Emergency Contacts Strip */}
            <EmergencySidebar />

            {/* Main Tourist Content */}
            <div className="flex-1 w-full space-y-5">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* SOS Panic Button Card with Quick Text & Quick Voice (8 cols) */}
                <div className="lg:col-span-8">
                  <SOSButton
                    onSOSDispatched={(newInc) => {
                      setIncidents((prev) => {
                        const key = newInc._id || newInc.incidentId;
                        const filtered = prev.filter((i) => (i._id || i.incidentId) !== key);
                        return [newInc, ...filtered];
                      });
                      setSelectedIncident(newInc);
                    }}
                  />
                </div>

                {/* Action Card: Detailed Reporting (4 cols) */}
                <div className="lg:col-span-4 panel-card p-6 rounded-xl border space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-500">
                      <FilePlus className="w-5 h-5" />
                      <h3 className="font-extrabold text-base">File Detailed Incident</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      Report non-immediate safety concerns with category selection, attached photo evidence, and audio voice notes. GPS location attached automatically.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all"
                    >
                      <FilePlus className="w-4 h-4" />
                      Open Detailed Report Form
                    </button>

                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Guaranteed Location Dispatch</div>
                      <p>All triggers automatically attach your verified coordinates to emergency responder logs.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Verified Safe Haven Finder Map */}
              <SafeHavenFinder userCoords={userCoords} theme={theme} />

            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* AUTHORITY RESPONDER COMMAND DASHBOARD                                     */
          /* ========================================================================= */
          <div className="space-y-5">
            
            {/* Command Header Bar */}
            <div className="panel-card p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-500" />
                  <h2 className="font-extrabold text-base">Authority Command Center</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time spatial monitoring, responder unit dispatching, audio voice verification, and regional warning broadcasts
                </p>
              </div>

              <button
                onClick={() => setShowBroadcastModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition-all"
              >
                <Radio className="w-4 h-4" />
                Broadcast Warning Alert
              </button>
            </div>

            {/* Top Metric Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="panel-card p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Incidents</span>
                  <span className="text-2xl font-black font-mono">{totalCount}</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              <div className="panel-card p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">Critical SOS Active</span>
                  <span className="text-2xl font-black text-red-600 dark:text-red-400 font-mono">{criticalCount}</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
              </div>

              <div className="panel-card p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Units Dispatched</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{dispatchedCount}</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="panel-card p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Resolved Today</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{resolvedCount}</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

            </div>

            {/* Dedicated Incoming Emergency Stream Feed */}
            {incomingPending.length > 0 && (
              <div className="panel-card p-4 rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50/30 dark:bg-red-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-red-600 dark:text-red-400">
                      Incoming Priority Distress Requests ({incomingPending.length} Unhandled)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Live WebSocket Broadcast</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {incomingPending.map((inc, idx) => (
                    <div
                      key={inc._id || inc.incidentId || `pending-${idx}`}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedIncident && (selectedIncident._id === inc._id || selectedIncident.incidentId === inc.incidentId)
                          ? 'border-red-500 bg-white dark:bg-slate-900 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-red-600 text-xs">{inc.incidentId}</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-600 uppercase">
                          {inc.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{inc.touristName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{inc.address}</p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                        <span className="text-slate-400">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(inc._id || inc.incidentId, 'DISPATCHED', 'Quick Dispatched from Live Bar');
                          }}
                          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px]"
                        >
                          Dispatch Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split Grid (Map 8 cols + Inspector 4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              <div className="lg:col-span-8">
                <LiveMap
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={setSelectedIncident}
                  theme={theme}
                />
              </div>

              {/* Inspector Card */}
              <div className="lg:col-span-4 panel-card p-5 rounded-xl border space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-500" />
                    <h3 className="font-extrabold text-sm">Incident Inspector</h3>
                  </div>
                  {selectedIncident && (
                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      {selectedIncident.incidentId}
                    </span>
                  )}
                </div>

                {selectedIncident ? (
                  <div className="space-y-3.5 text-xs">
                    
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-extrabold text-[10px] uppercase">
                        {selectedIncident.type}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          selectedIncident.status === 'PENDING'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                            : selectedIncident.status === 'DISPATCHED'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                        }`}
                      >
                        {selectedIncident.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedIncident.touristName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedIncident.contactNumber}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight text-slate-700 dark:text-slate-300">{selectedIncident.address}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Reported Details
                      </span>
                      <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs italic">
                        "{selectedIncident.description}"
                      </p>
                    </div>

                    {/* Voice Memo Player */}
                    {selectedIncident.voiceNoteUrl && (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                          <FileAudio className="w-3.5 h-3.5" />
                          <span>Attached Voice Audio Note</span>
                        </div>
                        <audio src={selectedIncident.voiceNoteUrl} controls className="w-full h-8" />
                      </div>
                    )}

                    {/* Photo Evidence Preview */}
                    {selectedIncident.mediaUrls && selectedIncident.mediaUrls.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Attached Photo Evidence
                        </span>
                        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-36 bg-slate-950 flex items-center justify-center">
                          <img
                            src={selectedIncident.mediaUrls[0]}
                            alt="Evidence"
                            className="object-contain h-36 w-full cursor-pointer hover:opacity-90"
                            onClick={() => window.open(selectedIncident.mediaUrls[0], '_blank')}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Status Controls
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedIncident.status === 'PENDING' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(selectedIncident._id || selectedIncident.incidentId, 'DISPATCHED', 'Dispatch Unit Alerted')
                            }
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                          >
                            Dispatch Unit
                          </button>
                        )}

                        {selectedIncident.status !== 'RESOLVED' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(selectedIncident._id || selectedIncident.incidentId, 'RESOLVED', 'Safe Resolution Confirmed')
                            }
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Select an incident pin to inspect details.
                  </div>
                )}
              </div>

            </div>

            <IncidentQueue
              incidents={incidents}
              onUpdateStatus={handleUpdateStatus}
              onSelectIncident={setSelectedIncident}
            />

          </div>
        )}

      </main>

      <IncidentReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReportSubmitted={(newInc) => {
          setIncidents((prev) => {
            const key = newInc._id || newInc.incidentId;
            const filtered = prev.filter((i) => (i._id || i.incidentId) !== key);
            return [newInc, ...filtered];
          });
          setSelectedIncident(newInc);
        }}
      />

      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />

      <footer className="border-t border-slate-200 dark:border-slate-800 py-3.5 px-6 text-center text-[11px] text-slate-500">
        <p>SafeTourist Platform &copy; 2026. Emergency Response & Spatial Coordination Center.</p>
      </footer>

    </div>
  );
}
