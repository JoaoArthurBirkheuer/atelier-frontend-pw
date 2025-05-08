import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ClienteMenu() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setTimeout(() => {
    navigate('/');
  }, 50);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/clientes">
          {user?.nome ? `Olá, ${user.nome.split(' ')[0]}` : 'Dashboard do Cliente'}
        </NavLink>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarCliente"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarCliente">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/clientes">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/clientes/minha-conta">Minha Conta</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/clientes/novo-pedido">Novo Pedido</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/clientes/meus-pedidos">Meus Pedidos</NavLink>
            </li>
          </ul>
          <div className="d-flex">
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}