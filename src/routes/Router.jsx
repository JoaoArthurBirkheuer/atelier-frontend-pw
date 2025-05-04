import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
// Importar outras páginas
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/clientes"
          element={<ProtectedRoute>{/* <Clientes /> */}</ProtectedRoute>}
        />
        {/* Outras rotas protegidas aqui */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
