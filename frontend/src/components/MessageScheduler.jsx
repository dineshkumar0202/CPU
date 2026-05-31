import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const MessageScheduler = () => {
  // Form State
  const [message, setMessage] = useState('');
  const [dayType, setDayType] = useState('weekday'); // 'weekday' | 'date'
  const [selectedWeekday, setSelectedWeekday] = useState('Monday');
  const [dateValue, setDateValue] = useState('');
  const [time, setTime] = useState('');

  // UI Status State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Table Data State
  const [messages, setMessages] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Get current date string (YYYY-MM-DD) in local timezone to set min date attribute
  const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD format

  const fetchMessages = async () => {
    setTableLoading(true);
    try {
      const res = await api.get('/message/all');
      if (res.data && res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load messages queue:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Auto-refresh the list every 30 seconds
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    const dayValue = dayType === 'weekday' ? selectedWeekday : dateValue;

    if (!message.trim()) {
      setError('Message text is required');
      setLoading(false);
      return;
    }

    if (!dayValue) {
      setError(dayType === 'weekday' ? 'Please select a weekday' : 'Please pick a valid calendar date');
      setLoading(false);
      return;
    }

    if (!time) {
      setError('Please specify a delivery time');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/message/schedule', {
        message,
        day: dayValue,
        time
      });

      if (res.data && res.data.success) {
        setSuccess('Message scheduled successfully!');
        setMessage('');
        setTime('');
        setDateValue('');
        fetchMessages(); // Refresh message grid
        // Auto-dismiss alert after 4 seconds
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(res.data.message || 'Failed to schedule');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Schedule Form */}
      <div 
        className="glow-card rounded-2xl p-6 bg-white border border-zinc-200"
        style={{ backgroundColor: `#ffffff` }}
      >
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-2">Configure Scheduler</h2>
        <p className="text-zinc-50 text-sm mb-6">Queue a server execution action by weekday recurrence or calendar date</p>

        {/* Alert Banners */}
        {success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm font-medium animate-fadeIn">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm font-medium animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Message Area */}
          <div>
            <label htmlFor="message-input" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Message Content
            </label>
            <textarea
              id="message-input"
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              required
              className="w-full bg-white border border-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-zinc-900 text-sm placeholder-zinc-400 outline-none transition-all duration-200 resize-none"
            />
          </div>

          {/* Toggle Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Schedule Recurrence Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200/60">
              <button
                type="button"
                onClick={() => setDayType('weekday')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  dayType === 'weekday'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
                }`}
              >
                Weekly Recurrent Weekday
              </button>
              <button
                type="button"
                onClick={() => setDayType('date')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  dayType === 'date'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
                }`}
              >
                Specific Calendar Date
              </button>
            </div>
          </div>

          {/* Day / Time Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dayType === 'weekday' ? (
              <div>
                <label htmlFor="weekday-select" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Select Weekday
                </label>
                <select
                  id="weekday-select"
                  value={selectedWeekday}
                  onChange={(e) => setSelectedWeekday(e.target.value)}
                  className="w-full bg-white border border-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-zinc-900 text-sm outline-none transition-all duration-200 cursor-pointer"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d} value={d} className="bg-white text-zinc-900">{d}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="date-input" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Pick Calendar Date
                </label>
                <input
                  id="date-input"
                  type="date"
                  min={todayStr}
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  required
                  className="w-full bg-white border border-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-zinc-900 text-sm outline-none transition-all duration-200 cursor-pointer"
                />
              </div>
            )}

            <div>
              <label htmlFor="time-input" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Execution Time (24h format)
              </label>
              <input
                id="time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-white border border-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-zinc-900 text-sm outline-none transition-all duration-200 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-600/15 hover:shadow-violet-600/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scheduling...
              </>
            ) : (
              'Schedule Message'
            )}
          </button>
        </form>
      </div>

      {/* Messages Queue Grid */}
      <div 
        className="glow-card rounded-2xl p-6 bg-white border border-zinc-200"
        style={{ backgroundColor: `#ffffff` }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Execution Queue</h2>
            <p className="text-zinc-505 text-sm mt-0.5">Logs and active scheduled events</p>
          </div>
          <button
            onClick={fetchMessages}
            disabled={tableLoading}
            className="text-xs px-3 py-1.5 rounded-lg font-medium border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 transition-all duration-200"
          >
            {tableLoading ? 'Loading...' : 'Refresh Queue'}
          </button>
        </div>

        {/* Table Wrapper */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50/80">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">#</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Message</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Day</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Scheduled At</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-zinc-200 text-sm">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-zinc-400 font-medium bg-zinc-50/10">
                    No scheduled messages found. Create one above!
                  </td>
                </tr>
              ) : (
                messages.map((msg, index) => (
                  <tr key={msg._id} className="hover:bg-zinc-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-mono text-xs">{messages.length - index}</td>
                    <td className="px-6 py-4 font-medium text-zinc-950 max-w-xs truncate" title={msg.message}>
                      {msg.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-700">
                      {/^\d{4}-\d{2}-\d{2}$/.test(msg.day) ? (
                        <span className="bg-violet-50 text-violet-600 text-xs px-2 py-1 rounded font-mono border border-violet-100">
                          {msg.day}
                        </span>
                      ) : (
                        <span className="text-violet-600 font-semibold">{msg.day}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-zinc-700">{msg.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {msg.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Sent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
                      {formatDate(msg.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MessageScheduler;
