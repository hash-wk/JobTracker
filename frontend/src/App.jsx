import { Routes, Route, Navigate } from 'react-router-dom';
import ApplicationDetail from './pages/ApplicationDetail';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Analytics from './pages/Analytics';


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/board" element={<Board />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}