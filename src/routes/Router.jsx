import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import ClienteDashboard from '../pages/Cliente/ClienteDashboard';
import VendedorDashboard from '../pages/Vendedor/VendedorDashboard';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

function ProtectedRoute({ children, tipo }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="text-center mt-5">Carregando...</div>;
  }

  if (!user || user.tipo !== tipo) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/clientes/*"
          element={
            <ProtectedRoute tipo="cliente">
              <ClienteDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendedores/*"
          element={
            <ProtectedRoute tipo="vendedor">
              <VendedorDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
