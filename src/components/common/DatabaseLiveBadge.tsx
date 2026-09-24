import React, { useState } from 'react';
import { Database, Wifi, WifiOff, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useFirebaseStatus } from '../../hooks/useFirebaseStatus';

interface DatabaseLiveBadgeProps {
  compact?: boolean;
}

export const DatabaseLiveBadge: React.FC<DatabaseLiveBadgeProps> = ({ compact = false }) => {
  const status = useFirebaseStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip((prev) => !prev)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-black tracking-wide transition shadow-2xs ${
          status.isLive
            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
            : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
        }`}
        title={`Database status: ${status.isLive ? 'LIVE' : 'UNLIVE'}`}
      >
        <span className="relative flex h-2 w-2">
          {status.isLive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status.isLive ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </span>

        <Database className={`w-3.5 h-3.5 ${status.isLive ? 'text-emerald-600' : 'text-rose-600'}`} />

        <span className="font-extrabold uppercase text-[10px]">
          {status.isLive ? 'DB LIVE' : 'UNLIVE'}
        </span>

        {!compact && (
          <span className="hidden xl:inline text-[9px] font-mono text-emerald-600 font-semibold">
            {status.latencyMs}ms
          </span>
        )}
      </button>

      {/* Floating Status Card Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 text-white rounded-2xl shadow-xl p-3 z-50 text-xs border border-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Firebase Cloud Database</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                status.isLive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {status.isLive ? 'Connected (Live)' : 'Unlive / Offline'}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Sync Mode:</span>
              <span className="font-semibold text-white">Permanent Real-Time</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Project ID:</span>
              <span className="font-mono text-indigo-300 truncate max-w-[120px]">{status.projectId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Response Latency:</span>
              <span className="font-semibold text-emerald-400">{status.latencyMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Synced:</span>
              <span className="text-slate-200">{status.lastSyncTime}</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Admin changes sync directly to user app instantly.</span>
          </div>
        </div>
      )}
    </div>
  );
};
