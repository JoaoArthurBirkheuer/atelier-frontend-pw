import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ClienteMenu from '../../components/ClienteMenu';
import ClienteInfo from './ClienteInfo';
import CriarPedido from './CriarPedido';
import ClientePedidos from './ClientePedidos';

export default function ClienteDashboard() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <ClienteMenu />
        <Routes>
          <Route index element={<Home />} />
          <Route path="/" element={<Home />} />
          <Route path="minha-conta" element={<ClienteInfo />} />
          <Route path="novo-pedido" element={<CriarPedido />} />
          <Route path="meus-pedidos" element={<ClientePedidos />} />
          <Route path="*" element={<Navigate to="/clientes" replace />} />
        </Routes>
    </>
  );
}

function Home() {
  const { user } = useContext(AuthContext);
  return (
    <>
      <div style={{ paddingTop: '70px', paddingLeft: '20px' }}>
      <h2>Bem-vindo, {user?.nome || (user?.tipo === 'cliente' ? `Cliente ${user.id}` : 'usuário')}!</h2>
      <p>Use o menu acima para navegar pelo sistema.</p>
      </div>
    </>
  );
}