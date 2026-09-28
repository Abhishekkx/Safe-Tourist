import React, { useState } from 'react';
import { ShieldAlert, Filter, Search, XCircle } from 'lucide-react';

export default function IncidentQueue({ incidents = [], onUpdateStatus, onSelectIncident }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncidents = incidents.filter((inc) => {
    if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;
    if (filterType !== 'ALL' && inc.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = inc.incidentId ? inc.incidentId.toLowerCase().includes(q) : false;
      const matchName = inc.touristName ? inc.touristName.toLowerCase().includes(q) : false;
      const matchAddr = inc.address ? inc.address.toLowerCase().includes(q) : false;
      if (!matchId && !matchName && !matchAddr) return false;
    }
    return true;
  });

  return (
    <div className="panel-card rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-500" />
          <div>
            <h3 className="font-extrabold text-base">Live Emergency Incident Queue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distress requests sorted by priority and dispatch status</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs w-full placeholder-slate-400"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-medium">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="SOS_CRITICAL">SOS Critical</option>
              <option value="THEFT_ASSAULT">Theft / Crime</option>
              <option value="MEDICAL">Medical</option>
              <option value="LOST_PATH">Lost Path</option>
            </select>
          </div>

        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Incident ID</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Tourist Info</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Dispatch Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                  No active incidents match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc, index) => {
                const id = inc._id || inc.incidentId || `queue-${index}`;
                const isPending = inc.status === 'PENDING';
                const isDispatched = inc.status === 'DISPATCHED';

                return (
                  <tr
                    key={id}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => onSelectIncident(inc)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-red-600 dark:text-red-400">
                      {inc.incidentId}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-extrabold rounded w-max uppercase ${
                            inc.type === 'SOS_CRITICAL'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {inc.type}
                        </span>
                        {inc.isSilent && (
                          <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase">Silent Alert</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{inc.touristName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs truncate">{inc.address}</div>
                      <div className="text-[10px] text-slate-500">{inc.contactNumber}</div>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-slate-700 dark:text-slate-300 text-xs line-clamp-2">{inc.description}</p>
                      {inc.mediaUrls && inc.mediaUrls.length > 0 && (
                        <a
                          href={inc.mediaUrls[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline block pt-0.5 font-semibold"
                        >
                          View Photo Evidence
                        </a>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full inline-block ${
                          inc.status === 'PENDING'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                            : inc.status === 'DISPATCHED'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && (
                          <button
                            onClick={() => onUpdateStatus(inc._id || inc.incidentId, 'DISPATCHED', 'Unit Dispatched')}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-all shadow-sm"
                          >
                            Dispatch Team
                          </button>
                        )}

                        {isDispatched && (
                          <button
                            onClick={() => onUpdateStatus(inc._id || inc.incidentId, 'RESOLVED', 'Safe Resolution Confirmed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-sm"
                          >
                            Mark Resolved
                          </button>
                        )}

                        <button
                          onClick={() => onUpdateStatus(inc._id || inc.incidentId, 'REJECTED', 'Dismissed as False Alarm')}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-slate-800"
                          title="Dismiss Incident"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
