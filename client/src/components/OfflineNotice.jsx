import React, { useState, useEffect } from 'react';
import { WifiOff, Phone, CheckCircle, RefreshCw, Radio } from 'lucide-react';
import { getOfflineIncidents, syncOfflineIncidents, clearOfflineIncidents } from '../utils/storage';

export default function OfflineNotice({ onAutoSynced }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(null);

  const checkQueue = () => {
    setOfflineCount(getOfflineIncidents().length);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await syncOfflineIncidents();
    setIsSyncing(false);
    checkQueue();
    if (result.count > 0) {
      setSyncSuccessToast(`Connection restored! ${result.count} offline report(s) synced successfully.`);
      if (onAutoSynced) onAutoSynced();
      setTimeout(() => setSyncSuccessToast(null), 4000);
    }
  };

  useEffect(() => {
    checkQueue();

    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(checkQueue, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && offlineCount === 0 && !syncSuccessToast) return null;

  return (
    <>
      {/* Sync Success Toast */}
      {syncSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md animate-fadeIn border-b border-emerald-500">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4" />
            <span>{syncSuccessToast}</span>
          </div>
          <button
            onClick={() => setSyncSuccessToast(null)}
            className="text-emerald-100 hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Offline Alert Bar */}
      {(!isOnline || offlineCount > 0) && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-semibold">
            <WifiOff className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span>
              {!isOnline
                ? `Offline Mode Active: Limited network connection. Reports and messages drafted in LocalStorage.`
                : `${offlineCount} local report draft(s) ready for synchronization.`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOnline && offlineCount > 0 && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-md text-[11px] shadow-sm transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Queued Reports Now'}
              </button>
            )}

            <a
              href="sms:112?body=EMERGENCY%20SOS%20HELP%20REQUESTED.%20GPS%20Coordinates%20Saved"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white font-bold rounded-md text-[11px] border border-slate-700"
            >
              <Phone className="w-3 h-3 text-red-400" />
              Cellular SMS Fallback
            </a>
          </div>
        </div>
      )}
    </>
  );
}
