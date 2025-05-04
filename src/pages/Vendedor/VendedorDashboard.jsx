import { Route, Routes, Navigate } from 'react-router-dom';
import VendedorMenu from '../../components/VendedorMenu';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

function Home() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mt-4">
      <h2>Bem-vindo, {user?.tipo === 'vendedor' ? `Vendedor ${user.id}` : 'usuário'}!</h2>
      <p>Use o menu acima para navegar pelo sistema.</p>
    </div>
  );
}

function Clientes() {
  return (
    <div className="container mt-4">
      <h2>Clientes</h2>
      <p>Funcionalidade em desenvolvimento.</p>
    </div>
  );
}

function Vendedores() {
  return (
    <div className="container mt-4">
      <h2>Vendedores</h2>
      <p>Funcionalidade em desenvolvimento.</p>
    </div>
  );
}

function Pedidos() {
  return (
    <div className="container mt-4">
      <h2>Pedidos</h2>
      <p>Funcionalidade em desenvolvimento.</p>
    </div>
  );
}

export default function VendedorDashboard() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <VendedorMenu />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/vendedores" element={<Vendedores />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
