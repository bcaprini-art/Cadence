import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

function StatCard({ value, label, color = 'text-white', icon }) {
  return (
    <div className="bg-[#0d1526] border border-white/10 rounded-xl p-5 text-center">
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function RiskBadge({ status }) {
  const map = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  const labels = { high: '🔴 High Risk', medium: '🟡 Medium', low: '🟢 Compliant' };
  return (
    <span className={`text-xs border px-2 py-0.5 rounded-full ${map[status] || map.low}`}>
      {labels[status] || 'Unknown'}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [schoolsRes, venuesRes] = await Promise.all([
          api.get('/admin/schools'),
          api.get('/admin/venues'),
        ]);
        setSchools(schoolsRes.data);
        setVenues(venuesRes.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-green-400 text-sm">Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  const totalAthletes = schools.reduce((s, sc) => s + sc.athleteCount, 0);
  const totalTeams = schools.reduce((s, sc) => s + sc.teamCount, 0);
  const totalAlerts = schools.reduce((s, sc) => s + sc.athletesAtRisk, 0);

  // Upcoming venue bookings (next 7 days)
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingBookings = venues
    .flatMap((v) =>
      (v.bookings || [])
        .filter((b) => new Date(b.start) <= in7days)
        .map((b) => ({ ...b, venueName: v.name, venueType: v.type, school: v.school }))
    )
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 8);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Athletic Director Overview ·{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard value={schools.length} label="Schools" icon="🏛️" />
        <StatCard value={totalAthletes} label="Total Athletes" color="text-blue-400" icon="🏃" />
        <StatCard value={totalTeams} label="Total Teams" color="text-purple-400" icon="⚽" />
        <StatCard
          value={totalAlerts}
          label="Compliance Alerts"
          color={totalAlerts > 0 ? 'text-yellow-400' : 'text-green-400'}
          icon={totalAlerts > 0 ? '⚠️' : '✅'}
        />
      </div>

      {/* Schools List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Schools</h2>
          <button
            onClick={() => navigate('/admin/venues')}
            className="text-sm text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            🏟 View All Venues
          </button>
        </div>

        <div className="bg-[#0d1526] border border-white/10 rounded-xl overflow-hidden">
          <div className="grid grid-cols-6 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
            <div className="col-span-2">School</div>
            <div className="text-center">Teams</div>
            <div className="text-center">Athletes</div>
            <div className="text-center">Avg CARA</div>
            <div className="text-right">Status</div>
          </div>

          {schools.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">No schools found</div>
          ) : (
            schools.map((school) => (
              <button
                key={school.id}
                onClick={() => navigate(`/admin/schools/${school.id}`)}
                className="w-full grid grid-cols-6 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors text-left items-center"
              >
                <div className="col-span-2">
                  <p className="text-sm font-medium text-white">{school.name}</p>
                  {school.conference && (
                    <p className="text-xs text-gray-500">{school.conference}</p>
                  )}
                </div>
                <div className="text-center text-sm text-gray-300">{school.teamCount}</div>
                <div className="text-center text-sm text-gray-300">{school.athleteCount}</div>
                <div className="text-center">
                  <span
                    className={`text-sm font-medium ${
                      school.avgCARAHours >= 17
                        ? 'text-yellow-400'
                        : school.avgCARAHours >= 20
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {school.avgCARAHours}h
                  </span>
                </div>
                <div className="flex justify-end">
                  <RiskBadge status={school.riskStatus} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Venue Availability Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Upcoming Venue Bookings (Next 7 Days)</h2>
        {upcomingBookings.length === 0 ? (
          <div className="bg-[#0d1526] border border-white/10 rounded-xl p-8 text-center text-gray-500 text-sm">
            No venue bookings in the next 7 days
          </div>
        ) : (
          <div className="bg-[#0d1526] border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
              <div>Venue</div>
              <div>Event</div>
              <div>When</div>
              <div>School</div>
            </div>
            {upcomingBookings.map((booking, i) => (
              <div
                key={booking.id || i}
                className="grid grid-cols-4 px-4 py-3 border-b border-white/5 last:border-0 items-center"
              >
                <div>
                  <p className="text-sm text-white">{booking.venueName}</p>
                  <p className="text-xs text-gray-500">{booking.venueType}</p>
                </div>
                <div className="text-sm text-gray-300">
                  {booking.event?.title || 'Booked'}
                  {booking.event?.team?.sport && (
                    <span className="text-xs text-gray-500 ml-1">· {booking.event.team.sport}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(booking.start).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  <br />
                  {new Date(booking.start).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-xs text-gray-500">{booking.school?.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {schools.map((school) => (
            <button
              key={school.id}
              onClick={() => navigate(`/admin/compliance?schoolId=${school.id}`)}
              className="bg-[#0d1526] border border-white/10 rounded-xl p-4 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{school.name}</span>
                <RiskBadge status={school.riskStatus} />
              </div>
              <p className="text-xs text-gray-500">
                {school.teamCount} team{school.teamCount !== 1 ? 's' : ''} · View compliance →
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
