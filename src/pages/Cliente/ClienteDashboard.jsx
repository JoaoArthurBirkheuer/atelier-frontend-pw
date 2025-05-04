import { Route, Routes, Navigate } from 'react-router-dom';
import ClienteMenu from '../../components/ClienteMenu';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

function Home() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mt-4">
      <h2>Bem-vindo, {user?.tipo === 'cliente' ? `Cliente ${user.id}` : 'usuário'}!</h2>
      <p>Use o menu acima para navegar pelo sistema.</p>
    </div>
  );
}

function Pedido() {
  return (
    <div className="container mt-4">
      <h2>Realizar Pedido</h2>
      <p>Funcionalidade em desenvolvimento.</p>
    </div>
  );
}

function Carrinho() {
  return (
    <div className="container mt-4">
      <h2>Seu Carrinho</h2>
      <p>Funcionalidade em desenvolvimento.</p>
    </div>
  );
}

export default function ClienteDashboard() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <ClienteMenu />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/pedido" element={<Pedido />} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
