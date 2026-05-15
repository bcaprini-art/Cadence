import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MySchedule from './pages/athlete/MySchedule';
import TeamAvailability from './pages/coach/TeamAvailability';
import ScheduleEvent from './pages/coach/ScheduleEvent';
import Roster from './pages/coach/Roster';
import Compliance from './pages/coach/Compliance';
import CARAForecast from './pages/coach/CARAForecast';
import CalendarCallback from './pages/CalendarCallback';
import AdminDashboard from './pages/admin/AdminDashboard';
import SchoolDetail from './pages/admin/SchoolDetail';
import ComplianceOverview from './pages/admin/ComplianceOverview';
import SchoolSettings from './pages/admin/SchoolSettings';
import TeacherPortal from './pages/coach/TeacherPortal';
import TravelView from './pages/coach/TravelView';
import TodoList from './pages/athlete/TodoList';
import PlayerProfile from './pages/athlete/PlayerProfile';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import EnterGrades from './pages/teacher/EnterGrades';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-green-400 text-lg font-medium">Loading Cadence...</div>
    </div>
  );
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-green-400 text-lg font-medium">Loading Cadence...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'AD' && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Layout>{children}</Layout>;
}

function TeacherRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-green-400 text-lg font-medium">Loading Cadence...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'TEACHER') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/my-schedule" element={<PrivateRoute><MySchedule /></PrivateRoute>} />
      <Route path="/team-availability" element={<PrivateRoute><TeamAvailability /></PrivateRoute>} />
      <Route path="/schedule-event" element={<PrivateRoute><ScheduleEvent /></PrivateRoute>} />
      <Route path="/roster" element={<PrivateRoute><Roster /></PrivateRoute>} />
      <Route path="/compliance" element={<PrivateRoute><Compliance /></PrivateRoute>} />
      <Route path="/cara-forecast" element={<PrivateRoute><CARAForecast /></PrivateRoute>} />
      <Route path="/calendar/callback" element={<PrivateRoute><CalendarCallback /></PrivateRoute>} />

      {/* Admin / AD Routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/schools" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/schools/:id" element={<AdminRoute><SchoolDetail /></AdminRoute>} />
      <Route path="/admin/compliance" element={<AdminRoute><ComplianceOverview /></AdminRoute>} />
      <Route path="/admin/venues" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><SchoolSettings /></AdminRoute>} />

      {/* New Feature Routes */}
      <Route path="/todo" element={<PrivateRoute><TodoList /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><PlayerProfile /></PrivateRoute>} />
      <Route path="/teacher-portal" element={<PrivateRoute><TeacherPortal /></PrivateRoute>} />
      <Route path="/travel" element={<PrivateRoute><TravelView /></PrivateRoute>} />
      <Route path="/teacher/dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
      <Route path="/teacher/enter-grades" element={<TeacherRoute><EnterGrades /></TeacherRoute>} />
      <Route path="/teacher/grades" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
