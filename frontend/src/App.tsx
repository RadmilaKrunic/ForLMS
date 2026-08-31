import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Login } from './routes/Login';
import { Dashboard } from './routes/Dashboard';
import { CourseCatalog } from './routes/CourseCatalog';
import { CoursePlayer } from './routes/CoursePlayer';
import { AdminUsers } from './routes/admin/AdminUsers';
import { AdminCourses } from './routes/admin/AdminCourses';
import { AdminReports } from './routes/admin/AdminReports';

function RequireAuth({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/catalog"
          element={
            <RequireAuth>
              <CourseCatalog />
            </RequireAuth>
          }
        />
        <Route
          path="/course/:courseId"
          element={
            <RequireAuth>
              <CoursePlayer />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth roles={['Administrator']}>
              <AdminUsers />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <RequireAuth roles={['Administrator', 'ContentManager']}>
              <AdminCourses />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAuth roles={['Administrator', 'ContentManager']}>
              <AdminReports />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
