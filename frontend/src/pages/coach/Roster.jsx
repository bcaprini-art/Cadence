import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockRoster } from '../../lib/mock';

export default function Roster() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <header className="bg-[#0d1526] border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center font-bold text-black text-sm">C</div>
            <span className="text-xl font-bold">Cadence</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <button onClick={() => navigate('/dashboard')} className="hover:text-white">Dashboard</button>
            <button onClick={() => navigate('/team-availability')} className="hover:text-white">Availability</button>
            <button onClick={() => navigate('/schedule-event')} className="hover:text-white">Schedule</button>
            <button onClick={() => navigate('/roster')} className="text-white font-medium">Roster</button>
            <button onClick={() => navigate('/compliance')} className="hover:text-white">Compliance</button>
          </nav>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Roster</h1>
            <p className="text-sm text-gray-400 mt-1">{mockRoster.length} athletes · Class/personal schedules shown as BUSY (FERPA)</p>
          </div>
        </div>

        <div className="bg-[#0d1526] rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-6 px-5 py-3 text-xs text-gray-500 border-b border-white/5 font-medium uppercase tracking-wider">
            <span className="col-span-2">Athlete</span>
            <span>Position</span>
            <span>Year</span>
            <span>CARA hrs</span>
            <span>Status</span>
          </div>
          {mockRoster.map(a => {
            const pct = Math.round((a.cara_hours / a.cara_limit) * 100);
            const status = pct >= 95 ? { label: 'At Limit', color: 'text-red-400 bg-red-500/10' }
              : pct >= 85 ? { label: 'Near Limit', color: 'text-yellow-400 bg-yellow-500/10' }
              : { label: 'OK', color: 'text-green-400 bg-green-500/10' };
            return (
              <div key={a.id} className="grid grid-cols-6 px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors items-center">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                    {a.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-gray-500">#{a.number}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-300">{a.position}</span>
                <span className="text-sm text-gray-300">{a.year}</span>
                <div>
                  <p className="text-sm font-medium">{a.cara_hours}h <span className="text-gray-500 font-normal">/ {a.cara_limit}h</span></p>
                  <div className="mt-1 bg-white/10 rounded-full h-1 w-20">
                    <div className={`h-1 rounded-full ${pct >= 95 ? 'bg-red-500' : pct >= 85 ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${status.color}`}>{status.label}</span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
