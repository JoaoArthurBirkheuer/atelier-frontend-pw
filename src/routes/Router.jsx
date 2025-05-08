import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import ClienteDashboard from '../pages/Cliente/ClienteDashboard';
import VendedorDashboard from '../pages/Vendedor/VendedorDashboard';
import Home from '../pages/Home';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

function ProtectedRoute({ children, tipo }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="text-center mt-5">Carregando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (tipo && user.tipo !== tipo) return <Navigate to="/login" replace />;

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Rotas de cliente */}
        <Route
          path="/clientes/*"
          element={
            <ProtectedRoute tipo="cliente">
              <ClienteDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rotas de vendedor */}
        <Route
          path="/vendedores/*"
          element={
            <ProtectedRoute tipo="vendedor">
              <VendedorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rota padrão */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}