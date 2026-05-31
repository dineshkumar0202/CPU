import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const CpuMonitor = () => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [restarting, setRestarting] = useState(false);

  const fetchCpuStatus = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get('/message/cpu-status');
      if (res.data && res.data.success) {
        setCpuUsage(res.data.data.usage);
        if (res.data.data.threshold) {
          setThreshold(res.data.data.threshold);
        }
        setError(null);
        setRestarting(false);
      }
    } catch (err) {
      // If fetching fails, and cpu was previously high or we just can't connect,
      // it is highly likely that the server is currently restarting due to CPU threshold.
      if (cpuUsage >= threshold || restarting) {
        setRestarting(true);
        setError('Server is auto-restarting...');
      } else {
        setError('Unable to reach server');
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCpuStatus(true);

    // Poll every 5 seconds
    const intervalId = setInterval(() => {
      fetchCpuStatus(false);
    }, 5000);

    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, [cpuUsage, restarting]);

  // Color config based on utilization
  let statusColor = 'text-violet-400';
  let barGradient = 'from-violet-600 to-fuchsia-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]';
  let statusText = 'Server running normally';
  let bgGlow = 'rgba(139,92,246,0.02)';

  if (cpuUsage >= threshold) {
    statusColor = 'text-red-500';
    barGradient = 'from-red-600 to-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    statusText = '⚠️ Server will restart soon!';
    bgGlow = 'rgba(239,68,68,0.06)';
  } else if (cpuUsage >= threshold * 0.7) {
    statusColor = 'text-amber-500';
    barGradient = 'from-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    statusText = 'CPU usage getting high';
    bgGlow = 'rgba(245,158,11,0.04)';
  }

  return (
    <div 
      className="glow-card rounded-2xl p-6 bg-white border border-zinc-200 transition-all duration-500"
      style={{ backgroundColor: `#ffffff` }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cpuUsage >= threshold ? 'bg-red-500' : cpuUsage >= threshold * 0.7 ? 'bg-amber-500' : 'bg-violet-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${cpuUsage >= threshold ? 'bg-red-500' : cpuUsage >= threshold * 0.7 ? 'bg-amber-500' : 'bg-violet-500'}`}></span>
            </span>
            Real-Time Engine Status
          </h2>
          <p className="text-zinc-500 text-sm mt-0.5">CPU utilization monitor</p>
        </div>
        <button
          onClick={() => fetchCpuStatus(true)}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg font-medium border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 transition-all duration-200"
        >
          {loading ? 'Polling...' : 'Refresh Now'}
        </button>
      </div>

      <div className="flex flex-col items-center py-6">
        {/* Large Percentage Gauge */}
        <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-4 border-zinc-150 mb-6 bg-zinc-50/50">
          <div className="text-center">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-900">
              {error && restarting ? 'Exited' : `${cpuUsage.toFixed(1)}%`}
            </span>
            <div className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mt-1">CPU Load</div>
          </div>
        </div>

        {/* Color-coded Progress Bar */}
        <div className="w-full mb-4">
          <div className="w-full bg-zinc-100 rounded-full h-3.5 overflow-hidden border border-zinc-200">
            <div
              style={{ width: error && restarting ? '0%' : `${Math.min(cpuUsage, 100)}%` }}
              className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${barGradient}`}
            />
          </div>
        </div>

        {/* Status Messages */}
        <div className="text-center">
          {error ? (
            <div className={`text-sm font-semibold flex flex-col items-center gap-1 ${restarting ? 'text-rose-600 animate-warning-pulse' : 'text-zinc-500'}`}>
              <span>{error}</span>
              {restarting && <span className="text-xs text-zinc-500 font-normal">Nodemon is rebooting node thread...</span>}
            </div>
          ) : (
            <p className={`text-sm font-semibold tracking-wide ${statusColor}`}>
              {statusText}
            </p>
          )}
        </div>
      </div>

      {/* Info Card Note */}
      <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 text-center">
        <p className="text-xs text-zinc-500">
          ⚙️ Auto-restart safety threshold set at <span className="font-semibold text-violet-600">{threshold}% CPU</span>.
        </p>
      </div>
    </div>
  );
};

export default CpuMonitor;
