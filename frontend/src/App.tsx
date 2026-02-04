import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import Login from './pages/Login';
import Entry from './pages/Entry';
import Queue from './pages/Queue';
import Admin from './pages/Admin';
import Weighing from './pages/Weighing';
import PublicTV from './pages/PublicTV';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import SupervisorDashboard from './pages/dashboards/SupervisorDashboard';
import SalesDashboard from './pages/dashboards/SalesDashboard';
import ControlDashboard from './pages/dashboards/ControlDashboard';
import { MainLayout } from './layouts/MainLayout';
import { Toaster } from './components/molecules/ui/toast';
import { ProtectedRoute } from './components/organisms/auth/ProtectedRoute';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route path="/tv" element={<PublicTV />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<MainLayout />}>
            {/* Dashboard Routes */}
            <Route path="/dashboard/admin" element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/supervisor" element={
              <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMINISTRATOR']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/manager" element={
              <ProtectedRoute allowedRoles={['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/sales" element={
              <ProtectedRoute allowedRoles={['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']}>
                <SalesDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/control" element={
              <ProtectedRoute allowedRoles={['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']}>
                <ControlDashboard />
              </ProtectedRoute>
            } />

            {/* Existing Routes */}
            <Route path="/queue" element={
              <ProtectedRoute allowedRoles={['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR', 'AGENT_QUAI']}>
                <Queue />
              </ProtectedRoute>
            } />
            <Route path="/weighing" element={
              <ProtectedRoute allowedRoles={['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']}>
                <Weighing />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR', 'SUPERVISOR']}>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all route for 404 - Must be outside MainLayout */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
