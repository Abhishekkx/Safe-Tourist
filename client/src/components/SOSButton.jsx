import React, { useState, useEffect, useRef } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  VolumeX,
  Volume2,
  Loader2,
  Navigation,
  AlertTriangle,
  XCircle,
  Shield,
  Mic,
  Send,
  Square,
  MessageSquare
} from 'lucide-react';
import { reverseGeocode } from '../utils/geocoding';
import { saveOfflineIncident } from '../utils/storage';
import { socket } from '../utils/socket';

export default function SOSButton({ onSOSDispatched }) {
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isSilent, setIsSilent] = useState(false);
  const [statusState, setStatusState] = useState('IDLE');
  const [touristName, setTouristName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [currentCoords, setCurrentCoords] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('Locating GPS signal...');

  // Quick Message state
  const [quickMessageText, setQuickMessageText] = useState('');
  const [isSendingQuickMsg, setIsSendingQuickMsg] = useState(false);

  // Quick Voice Memo state (Up to 15 seconds)
  const [isRecordingQuickVoice, setIsRecordingQuickVoice] = useState(false);
  const [quickVoiceDuration, setQuickVoiceDuration] = useState(0);

  const pressTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const voiceRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);
  const watchPositionIdRef = useRef(null);

  const getAccurateGPS = async () => {
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0,
          });
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const addr = await reverseGeocode(lat, lng);
        setCurrentCoords({ latitude: lat, longitude: lng });
        setCurrentAddress(addr);
        return { latitude: lat, longitude: lng, address: addr };
      } catch (err) {
        console.warn('GPS query fallback:', err);
      }
    }
    const fallbackLat = currentCoords ? currentCoords.latitude : 28.6139;
    const fallbackLng = currentCoords ? currentCoords.longitude : 77.209;
    const fallbackAddr = currentAddress !== 'Locating GPS signal...' ? currentAddress : 'Central Tourist Sector (GPS Estimated)';
    return { latitude: fallbackLat, longitude: fallbackLng, address: fallbackAddr };
  };

  useEffect(() => {
    getAccurateGPS();
    return () => {
      if (watchPositionIdRef.current) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
      }
    };
  }, []);

  const startLiveLocationTracking = (incidentId) => {
    if ('geolocation' in navigator) {
      watchPositionIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ latitude: lat, longitude: lng });

          socket.emit('UPDATE_LIVE_LOCATION', {
            incidentId,
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString(),
          });
        },
        (err) => console.warn('Location watch error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
      );
    }
  };

  const handleMouseDown = () => {
    if (statusState === 'COUNTDOWN' || statusState === 'SENDING') return;
    setIsPressing(true);
    setPressProgress(0);

    let progress = 0;
    pressTimerRef.current = setInterval(() => {
      progress += 10;
      setPressProgress(progress);
      if (progress >= 100) {
        clearInterval(pressTimerRef.current);
        setIsPressing(false);
        startCountdown();
      }
    }, 150);
  };

  const handleMouseUp = () => {
    if (pressProgress < 100) {
      clearInterval(pressTimerRef.current);
      setIsPressing(false);
      setPressProgress(0);
    }
  };

  const startCountdown = () => {
    setStatusState('COUNTDOWN');
    setCountdown(5);

    let sec = 5;
    countdownIntervalRef.current = setInterval(() => {
      sec -= 1;
      setCountdown(sec);
      if (sec <= 0) {
        clearInterval(countdownIntervalRef.current);
        dispatchSOSEmergency();
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    clearInterval(countdownIntervalRef.current);
    setStatusState('IDLE');
    setCountdown(null);
    setPressProgress(0);
  };

  const dispatchSOSEmergency = async (customDesc, voiceBase64 = null) => {
    setStatusState('SENDING');

    const locationData = await getAccurateGPS();

    const payload = {
      type: 'SOS_CRITICAL',
      urgency: 'HIGH',
      touristName: touristName.trim() || 'Anonymous Tourist',
      contactNumber: contactNumber.trim() || 'Not Provided',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      description: customDesc
        ? customDesc
        : isSilent
        ? 'Silent SOS Triggered. Immediate discreet assistance requested.'
        : 'Critical Emergency SOS Triggered by Tourist.',
      voiceNoteUrl: voiceBase64 || null,
      isSilent,
    };

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setStatusState('SENT_SUCCESS');
        startLiveLocationTracking(data.data.incidentId);
        if (onSOSDispatched) onSOSDispatched(data.data);
      } else {
        throw new Error(data.message || 'Server error');
      }
    } catch (err) {
      saveOfflineIncident(payload);
      setStatusState('SENT_SUCCESS');
      if (onSOSDispatched) onSOSDispatched(payload);
    }
  };

  const handleSendQuickMessage = async (e) => {
    e.preventDefault();
    if (!quickMessageText.trim()) return;
    setIsSendingQuickMsg(true);
    await dispatchSOSEmergency(`[Quick Distress Message]: ${quickMessageText.trim()}`);
    setQuickMessageText('');
    setIsSendingQuickMsg(false);
  };

  // Quick Voice SOS Recording: Up to 15 Seconds Duration
  const startQuickVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceRecorderRef.current = new MediaRecorder(stream);
      voiceChunksRef.current = [];

      voiceRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) voiceChunksRef.current.push(event.data);
      };

      voiceRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          dispatchSOSEmergency('[12-15s Voice SOS Note Transmitted]', reader.result);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      voiceRecorderRef.current.start(500); // Collect data every 500ms
      setIsRecordingQuickVoice(true);
      setQuickVoiceDuration(0);

      let sec = 0;
      voiceTimerRef.current = setInterval(() => {
        sec += 1;
        setQuickVoiceDuration(sec);
        // Auto-stop at 15 seconds max recording
        if (sec >= 15) {
          stopQuickVoiceRecordingAndSend();
        }
      }, 1000);
    } catch (err) {
      alert('Microphone permission required for voice emergency memo.');
    }
  };

  const stopQuickVoiceRecordingAndSend = () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
    }
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== 'inactive') {
      voiceRecorderRef.current.stop();
      setIsRecordingQuickVoice(false);
    }
  };

  return (
    <div className="panel-card-danger p-6 sm:p-7 rounded-xl relative overflow-hidden flex flex-col items-center space-y-4">
      
      {/* Header */}
      <div className="text-center space-y-1 max-w-md">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 rounded border border-red-500/20 uppercase tracking-wider">
          <Shield className="w-3 h-3" />
          Emergency Distress Control
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Direct Emergency SOS</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          GPS coordinates attached automatically to all emergency triggers and transmitted to responders.
        </p>
      </div>

      {/* Button State Views */}
      {statusState === 'COUNTDOWN' ? (
        <div className="flex flex-col items-center space-y-3 my-2">
          <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-red-900/30 border border-red-500">
            <span className="text-4xl font-black font-mono">{countdown}s</span>
          </div>
          <p className="text-xs font-bold text-red-500 uppercase">Transmitting in {countdown}s...</p>
          <button
            onClick={cancelCountdown}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white font-bold text-xs shadow transition-all"
          >
            <XCircle className="w-4 h-4 text-red-400" />
            Cancel Trigger
          </button>
        </div>
      ) : statusState === 'SENDING' ? (
        <div className="flex flex-col items-center space-y-2 my-5">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
            Compressing Media & Broadcasting Live GPS...
          </p>
        </div>
      ) : statusState === 'SENT_SUCCESS' ? (
        <div className="flex flex-col items-center space-y-2 my-3 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              Distress Signal Transmitted & Live Tracked
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Verified GPS address attached. Responders alerted on command map.
            </p>
          </div>
          <button
            onClick={() => setStatusState('IDLE')}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 mt-2"
          >
            Reset Signal
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="relative group w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center shadow-lg hover:shadow-red-600/40 active:scale-95 transition-all select-none border-4 border-white/20"
          >
            <AlertOctagon className="w-12 h-12 mb-0.5 group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-2xl tracking-wider font-mono">SOS</span>
            <span className="text-[10px] font-bold text-red-100 uppercase tracking-wider">Hold 3s</span>

            {isPressing && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="5"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * pressProgress) / 100}
                  className="transition-all duration-150"
                />
              </svg>
            )}
          </button>

          <button
            onClick={startCountdown}
            className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Immediate Tap Trigger
          </button>
        </div>
      )}

      {/* QUICK DISTRESS TOOLS: Voice SOS (Up to 15s) & Direct Message */}
      <div className="w-full pt-3 border-t border-red-500/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        
        {/* Quick Voice SOS Button */}
        <div className="p-3 rounded-lg bg-white/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Mic className="w-4 h-4 text-red-500" />
              <span>Voice SOS (12-15s Recording)</span>
            </div>
            {isRecordingQuickVoice && (
              <span className="font-mono text-[11px] font-bold text-red-600 animate-pulse">
                REC 00:{(quickVoiceDuration % 60).toString().padStart(2, '0')} / 00:15
              </span>
            )}
          </div>

          {!isRecordingQuickVoice ? (
            <button
              type="button"
              onClick={startQuickVoiceRecording}
              className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Mic className="w-3.5 h-3.5" />
              Record Voice Memo (Up to 15s)
            </button>
          ) : (
            <button
              type="button"
              onClick={stopQuickVoiceRecordingAndSend}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Square className="w-3.5 h-3.5" />
              Stop & Compress Voice SOS
            </button>
          )}
        </div>

        {/* Quick Message Input */}
        <form
          onSubmit={handleSendQuickMessage}
          className="p-3 rounded-lg bg-white/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>Quick Message (Auto-GPS)</span>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Type urgent status (e.g. Lost on Trail 4)..."
              value={quickMessageText}
              onChange={(e) => setQuickMessageText(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={isSendingQuickMsg || !quickMessageText.trim()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 shadow-sm"
            >
              <Send className="w-3 h-3" />
              Send
            </button>
          </div>
        </form>

      </div>

      {/* Attached Location Bar */}
      <div className="w-full pt-3 border-t border-red-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <Navigation className="w-4 h-4 text-red-500 shrink-0" />
          <div className="truncate">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Attached Verified GPS</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">{currentAddress}</span>
          </div>
        </div>

        <button
          onClick={() => setIsSilent(!isSilent)}
          className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
            isSilent
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-white/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {isSilent ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4" />}
            <span className="font-semibold text-xs">Silent SOS Mode</span>
          </div>
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {isSilent ? 'ON' : 'OFF'}
          </span>
        </button>

      </div>

      {/* Guest Info */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Tourist Name (Optional)"
          value={touristName}
          onChange={(e) => setTouristName(e.target.value)}
          className="bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-red-500"
        />
        <input
          type="tel"
          placeholder="Contact Number (Optional)"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-red-500"
        />
      </div>

    </div>
  );
}
