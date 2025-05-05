import { Route, Routes, Navigate } from 'react-router-dom';
import VendedorMenu from '../../components/VendedorMenu';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import VendedorInfo from './VendedorInfo';
import Clients from './Clientes';

function Home() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{ paddingTop: '70px' }}> {/* Espaço para o menu fixo */}
      <div className="container mt-4">
        <h2>Bem-vindo, {user?.nome || (user?.tipo === 'vendedor' ? `Vendedor ${user.id}` : 'usuário')}!</h2>
        <p>Use o menu acima para navegar pelo sistema.</p>
      </div>
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

function Pecas() {
    return (
      <div className="container mt-4">
        <h2>Pecas</h2>
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
        <Route path="/info-pessoal" element={<VendedorInfo />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/vendedores" element={<Vendedores />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/pecas" element={<Pecas />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
