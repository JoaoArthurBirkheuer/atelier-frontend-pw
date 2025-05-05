import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import ClienteDashboard from '../pages/Cliente/ClienteDashboard';
import VendedorDashboard from '../pages/Vendedor/VendedorDashboard';
import Vendedores from '../pages/Vendedor/Vendedores';
import Clientes from '../pages/Vendedor/Clientes';
import Pecas from '../pages/Vendedor/Pecas';
import Pedidos from '../pages/Vendedor/Pedidos';
import VendedorInfo from '../pages/Vendedor/VendedorInfo';
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

        {/* Rotas para clientes */}
        <Route
          path="/clientes/*"
          element={
            <ProtectedRoute tipo="cliente">
              <ClienteDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rotas para vendedores */}
        <Route
          path="/vendedores"
          element={
            <ProtectedRoute tipo="vendedor">
              <Navigate to="/vendedores/home" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendedores/home"
          element={
            <ProtectedRoute tipo="vendedor">
              <VendedorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendedores/info-pessoal"
          element={
            <ProtectedRoute tipo="vendedor">
              <VendedorInfo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendedores/clientes"
          element={
            <ProtectedRoute tipo="vendedor">
              <Clientes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendedores/gerenciar"
          element={
            <ProtectedRoute tipo="vendedor">
              <Vendedores />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendedores/pedidos"
          element={
            <ProtectedRoute tipo="vendedor">
              <Pedidos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendedores/pecas"
          element={
            <ProtectedRoute tipo="vendedor">
              <Pecas />
            </ProtectedRoute>
          }
        />

        {/* Rota padrão */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}