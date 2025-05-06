import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import VendedorMenu from '../../components/VendedorMenu';
import VendedorInfo from './VendedorInfo';
import Clientes from './Clientes';
import Vendedores from './Vendedores';
import Pedidos from './Pedidos';
import Pecas from './Pecas';

export default function VendedorDashboard() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <VendedorMenu />
        <Routes>
          <Route index element={<Home />} />
          <Route path="/" element={<Home />} />
          <Route path="perfil" element={<VendedorInfo />} />
          <Route path="lista-clientes" element={<Clientes />} />
          <Route path="lista-vendedores" element={<Vendedores />} />
          <Route path="lista-pedidos" element={<Pedidos />} />
          <Route path="lista-pecas" element={<Pecas />} />
          <Route path="*" element={<Navigate to="/vendedores" replace />} />
        </Routes>
    </>
  );
}

function Home() {
  const { user } = useContext(AuthContext);
  return (
    <>
      <div style={{ paddingTop: '70px', paddingLeft: '20px' }}>
      <h2>Bem-vindo, {user?.nome || (user?.tipo === 'vendedor' ? `Vendedor ${user.id}` : 'usuário')}!</h2>
      <p>Use o menu acima para navegar pelo sistema.</p>
      </div>
    </>
  );
}